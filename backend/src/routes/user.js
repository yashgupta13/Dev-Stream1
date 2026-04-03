import express from "express";
import { requireClerkAuth } from "../middleware/protectRoute.js";
import { syncUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/sync", requireClerkAuth, syncUser);

export default router;