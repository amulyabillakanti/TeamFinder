const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const sanitizeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  degree: user.degree,
  college: user.college,
  year: user.year,
  bio: user.bio,
  skills: user.skills || [],
  interests: user.interests || [],
  preferredRoles: user.preferredRoles || [],
  preferredProjectCategories: user.preferredProjectCategories || [],
  careerGoals: user.careerGoals,
  availability: user.availability || "Available",
  github: user.github,
  linkedin: user.linkedin,
  portfolio: user.portfolio,
  badges: user.badges || [],
  points: user.points || 0,
  profileCompleted: user.profileCompleted || 0,
  avatar: user.avatar,
  color: user.color,
  available: user.available,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

router.post("/register", async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be at least 8 characters and no more than 72 bytes." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered. Please log in instead." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      department: "",
      year: "",
      skills: [],
      interests: [],
      bio: "",
      available: true,
      profileCompleted: 25,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(201).json({ message: "Student registered successfully!", token, user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered. Please log in instead." });
    }
    console.error("Registration failed:", error);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful!", token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Failed to load current user", error: error.message });
  }
});

router.put("/me", requireAuth, async (req, res) => {
  try {
    const update = {
      name: req.body.name,
      department: req.body.department,
      degree: req.body.degree,
      college: req.body.college,
      year: req.body.year,
      bio: req.body.bio,
      skills: Array.isArray(req.body.skills) ? req.body.skills : String(req.body.skills || "").split(",").map((item) => item.trim()).filter(Boolean),
      interests: Array.isArray(req.body.interests) ? req.body.interests : String(req.body.interests || "").split(",").map((item) => item.trim()).filter(Boolean),
      availability: req.body.availability || "Available",
      github: req.body.github,
      linkedin: req.body.linkedin,
      portfolio: req.body.portfolio,
    };

    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully!", user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
});

router.put("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, {
      department: req.body.department,
      year: req.body.year,
      skills: req.body.skills,
      interests: req.body.interests,
      bio: req.body.bio,
      availability: req.body.availability,
      github: req.body.github,
      linkedin: req.body.linkedin,
      portfolio: req.body.portfolio,
    }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully!", user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
});

router.get("/all", async (_req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ points: -1, createdAt: -1 });
    res.json({ users: users.map(sanitizeUser) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const skill = req.query.skill || "";
    const users = await User.find({
      $or: [
        { name: { $regex: skill, $options: "i" } },
        { department: { $regex: skill, $options: "i" } },
        { skills: { $regex: skill, $options: "i" } },
      ],
    }).select("-password");

    res.json({ users: users.map(sanitizeUser) });
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

module.exports = router;