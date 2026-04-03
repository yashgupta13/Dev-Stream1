import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export async function syncUser(req, res) {
  try {
    const clerkId = req.auth().userId;
    const { emailAddresses, firstName, lastName, imageUrl } = req.auth().sessionClaims;

    const email = emailAddresses?.[0]?.emailAddress;
    const name = `${firstName || ""} ${lastName || ""}`.trim();

    // use upsert to avoid race conditions with Inngest functions
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        clerkId,
        email,
        name,
        profileImage: imageUrl,
      },
      { new: true, upsert: true }
    );

    // ensure stream user is also synced synchronously
    await upsertStreamUser({
      id: user.clerkId.toString(),
      name: user.name,
      image: user.profileImage,
    });

    res.status(200).json({ user });
  } catch (err) {
    console.error("syncUser error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
