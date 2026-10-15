const express = require("express");
const mongoose = require("mongoose");
const TeamRequest = require("../models/TeamRequest");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.post("/send", requireAuth, async (req, res) => {
  try {
    const { receiver, project, role, message } = req.body;
    const sender = req.user.userId;

    if (!receiver || !project) {
      return res.status(400).json({ message: "Receiver and project are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiver) || !mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({ message: "Invalid student or project ID" });
    }

    const existingRequest = await TeamRequest.findOne({ sender, receiver, project, status: "pending" });
    if (existingRequest) {
      return res.status(400).json({ message: "Team request already sent" });
    }

    const request = await TeamRequest.create({
      sender,
      receiver,
      project,
      role: role || "Team Member",
      message: message || "",
      status: "pending",
    });

    const populated = await TeamRequest.findById(request._id)
      .populate("sender", "name email department skills")
      .populate("receiver", "name email department skills")
      .populate("project", "title description requiredSkills teamSize");

    res.status(201).json({ message: "Team request sent successfully!", request: populated });
  } catch (error) {
    console.error("TEAM REQUEST ERROR:", error);
    res.status(500).json({ message: "Failed to send team request", error: error.message });
  }
});

router.get("/received/:userId", async (req, res) => {
  try {
    const requests = await TeamRequest.find({ receiver: req.params.userId })
      .populate("sender", "name email department skills")
      .populate("receiver", "name email department skills")
      .populate("project", "title description requiredSkills teamSize")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team requests", error: error.message });
  }
});

router.put("/:requestId", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be accepted or rejected" });
    }

    const request = await TeamRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Team request not found" });
    }

    if (request.receiver.toString() !== req.user.userId.toString() && request.sender.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You are not allowed to modify this request." });
    }

    request.status = status;
    await request.save();

    const updated = await TeamRequest.findById(request._id)
      .populate("sender", "name email department skills")
      .populate("receiver", "name email department skills")
      .populate("project", "title description requiredSkills teamSize");

    res.json({ message: `Team request ${status} successfully!`, request: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update team request", error: error.message });
  }
});

module.exports = router;