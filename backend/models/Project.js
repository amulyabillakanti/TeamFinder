const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    priority: { type: String, default: "Medium" },
    status: { type: String, default: "To Do" },
    dueDate: { type: Date },
  },
  { _id: true }
);

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "Web Development" },
    requiredSkills: [{ type: String }],
    teamSize: { type: Number, required: true },
    status: { type: String, default: "Planning" },
    progress: { type: Number, default: 0 },
    deadline: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tasks: [TaskSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);