import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

// this only checks if the user is authenticated with Clerk
export const requireClerkAuth = requireAuth();

// this checks both Clerk auth AND if the user exists in our MongoDB
export const protectRoute = [
  requireClerkAuth,
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId)
        return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      const user = await User.findOne({ clerkId });

      if (!user)
        return res
          .status(401)
          .json({ message: "User not found in our records. Please ensure your account is synchronized." });

      // BLOCKED USER CHECK
      if (user.blocked) {
        return res.status(403).json({
          message: "Your account has been blocked due to policy violations",
        });
      }

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];