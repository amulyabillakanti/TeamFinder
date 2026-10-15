const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: "student" },
    department: { type: String, default: "" },
    degree: { type: String, default: "" },
    college: { type: String, default: "" },
    year: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    preferredRoles: { type: [String], default: [] },
    preferredProjectCategories: { type: [String], default: [] },
    careerGoals: { type: String, default: "" },
    availability: { type: String, default: "Available" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    badges: { type: [String], default: [] },
    points: { type: Number, default: 0 },
    profileCompleted: { type: Number, default: 0 },
    avatar: { type: String, default: "" },
    color: { type: String, default: "violet" },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);