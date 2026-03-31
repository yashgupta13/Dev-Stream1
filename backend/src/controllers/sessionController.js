import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import bcrypt from "bcryptjs";

export async function createSession(req, res) {
  try {
    const { sessionName, problem, difficulty, password, candidateEmail } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!sessionName || !problem || !difficulty || !password || !candidateEmail) {
      return res.status(400).json({
        message: "All fields including candidate email are required",
      });
    }    

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db
    const session = await Session.create({name: sessionName, problem, difficulty, password: hashedPassword, candidateEmail: candidateEmail.toLowerCase(), host: userId, callId });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: sessionName,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(req, res) {
  try {
    const userEmail = req.user.email.toLowerCase();
    const userId = req.user._id;

    const sessions = await Session.find({
      status: "active",
      $or: [
        { host: userId },
        { candidateEmail: userEmail },
      ],
    })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;
    const userEmail = req.user.email.toLowerCase();

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // email restriction
    if (session.candidateEmail !== userEmail) {
      return res.status(403).json({
        message: "You are not authorized to join this session",
      });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // verify password
    const isMatch = await bcrypt.compare(password, session.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Host cannot join their own session as participant",
      });
    }

    // session full check
    if (session.participant) {
      return res.status(409).json({ message: "Session is full" });
    }

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    // delete stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function kickParticipant(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user._id;

    const session = await Session.findById(id).populate("participant");

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.host.toString() !== hostId.toString()) {
      return res.status(403).json({ message: "Only host can kick participant" });
    }

    if (!session.participant) {
      return res.status(400).json({ message: "No participant to kick" });
    }

    // block participant
    session.participant.blocked = true;
    await session.participant.save();

    // end session
    session.status = "completed";
    await session.save();

    // cleanup stream
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    res.status(200).json({ message: "Participant kicked and blocked" });
  } catch (err) {
    console.log("kickParticipant error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Start recording
export async function startRecording(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the host can start recording" });
    }

    const call = streamClient.video.call("default", session.callId);
    await call.startRecording();

    res.status(200).json({ message: "Recording started" });
  } catch (error) {
    console.log("startRecording error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Stop recording
export async function stopRecording(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the host can stop recording" });
    }

    const call = streamClient.video.call("default", session.callId);
    await call.stopRecording();

    res.status(200).json({ message: "Recording stopped" });
  } catch (error) {
    console.log("stopRecording error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get recordings list
export async function getRecordings(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const call = streamClient.video.call("default", session.callId);
    const response = await call.listRecordings();

    res.status(200).json({ recordings: response.recordings || [] });
  } catch (error) {
    console.log("getRecordings error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}