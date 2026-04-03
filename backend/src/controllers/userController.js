import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export async function syncUser(req, res) {
  try {
    const clerkId = req.auth().userId;
    console.log("SyncUser endpoint called for clerkId:", clerkId);
    const { emailAddresses, firstName, lastName, imageUrl } = req.auth().sessionClaims || {};

    if (!emailAddresses || emailAddresses.length === 0) {
      console.warn("⚠️ Warning: emailAddresses is missing from sessionClaims. Make sure Custom Session Claims are configured in Clerk Dashboard.");
    }

    const email = emailAddresses?.[0]?.email_address;
    const name = `${firstName || ""} ${lastName || ""}`.trim();

    console.log("Syncing user data:", { email, name, clerkId });

    // use upsert to avoid race conditions with Inngest functions
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        clerkId,
        email,
        name,
        profileImage: imageUrl,
      },
      { new: true, upsert: true, runValidators: true }
    );

    console.log("Successfully synced user to MongoDB:", user._id);

    // ensure stream user is also synced synchronously
    await upsertStreamUser({
      id: user.clerkId.toString(),
      name: user.name,
      image: user.profileImage,
    });

    res.status(200).json({ user });
  } catch (err) {
    console.error("❌ syncUser error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
