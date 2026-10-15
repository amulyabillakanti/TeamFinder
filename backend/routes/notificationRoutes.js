const express = require("express");
const Notification = require("../models/Notification");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (req.user.userId.toString() !== targetId) {
      return res.status(403).json({ message: "You can only view your own notifications." });
    }

    const notifications = await Notification.find({ user: targetId }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (notification.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You are not allowed to update this notification." });
    }

    notification.read = true;
    await notification.save();
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification", error: error.message });
  }
});

module.exports = router;
