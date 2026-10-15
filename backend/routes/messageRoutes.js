const express = require("express");
const Message = require("../models/Message");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.userId.toString();
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { receiver, text } = req.body;
    if (!receiver || !text) {
      return res.status(400).json({ message: "Receiver and text are required." });
    }

    const message = await Message.create({
      sender: req.user.userId,
      receiver,
      text,
      conversationId: [req.user.userId, receiver].sort().join("_"),
      read: false,
    });

    const fullMessage = await Message.findById(message._id).populate("sender", "name email").populate("receiver", "name email");
    res.status(201).json({ message: fullMessage });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

module.exports = router;
