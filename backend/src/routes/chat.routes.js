const express = require("express");
const prisma = require("../prisma");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_REPORT_CATEGORIES = [
  "ABUSIVE_BEHAVIOR",
  "UNSAFE_ADVICE",
  "INAPPROPRIATE_LISTENER",
  "INAPPROPRIATE_USER",
  "TECHNICAL_ISSUE",
  "MODERATION_FAILURE",
  "OTHER",
];

/*
  Submit post-session feedback
*/
router.post("/feedback", verifyToken, async (req, res) => {
  try {
    const { sessionId, rating, comment, wouldUseAgain } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "rating must be a number between 1 and 5.",
      });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        listener: true,
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Chat session not found." });
    }

    const isParticipant =
      session.userId === req.user.id || session.listenerId === req.user.id;

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "You are not allowed to submit feedback for this session.",
      });
    }

    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        sessionId,
        submittedById: req.user.id,
      },
    });

    if (existingFeedback) {
      return res.status(409).json({
        message: "You already submitted feedback for this session.",
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        sessionId,
        submittedById: req.user.id,
        rating,
        comment: comment?.trim() || null,
        wouldUseAgain:
          typeof wouldUseAgain === "boolean" ? wouldUseAgain : null,
      },
    });

    return res.status(201).json({
      message: "Feedback submitted successfully.",
      feedback,
    });
  } catch (error) {
    console.error("POST /chat/feedback error:", error);
    return res.status(500).json({ message: "Failed to submit feedback." });
  }
});

/*
  Submit report for a session / participant
*/
router.post("/report", verifyToken, async (req, res) => {
  try {
    const { sessionId, category, description, reportedUserId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    if (!category || !ALLOWED_REPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Invalid report category.",
        allowedCategories: ALLOWED_REPORT_CATEGORIES,
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "description is required." });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        listener: true,
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Chat session not found." });
    }

    const isParticipant =
      session.userId === req.user.id || session.listenerId === req.user.id;

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "You are not allowed to report this session.",
      });
    }

    if (reportedUserId && reportedUserId === req.user.id) {
      return res.status(400).json({ message: "You cannot report yourself." });
    }

    const report = await prisma.report.create({
      data: {
        sessionId,
        reporterId: req.user.id,
        reportedUserId: reportedUserId || null,
        category,
        description: description.trim(),
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        flaggedCount: {
          increment: 1,
        },
      },
    });

    return res.status(201).json({
      message: "Report submitted successfully.",
      report,
    });
  } catch (error) {
    console.error("POST /chat/report error:", error);
    return res.status(500).json({ message: "Failed to submit report." });
  }
});

module.exports = router;