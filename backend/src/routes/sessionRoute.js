import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
  kickParticipant,
} from "../controllers/sessionController.js";
import { startRecording, stopRecording, getRecordings } from "../controllers/sessionController.js";

const router = express.Router();

router.post("/", protectRoute, createSession);
router.get("/active", protectRoute, getActiveSessions);
router.get("/my-recent", protectRoute, getMyRecentSessions);

router.get("/:id", protectRoute, getSessionById);
router.post("/:id/join", protectRoute, joinSession);
router.post("/:id/end", protectRoute, endSession);
router.post("/:id/kick", protectRoute, kickParticipant);

router.post("/:id/recording/start", protectRoute, startRecording);
router.post("/:id/recording/stop",  protectRoute, stopRecording);
router.get("/:id/recordings",       protectRoute, getRecordings);
export default router;