const express = require("express");
const Project = require("../models/Project");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const sanitizeProject = (project) => ({
  id: project._id,
  _id: project._id,
  title: project.title,
  description: project.description,
  category: project.category,
  requiredSkills: project.requiredSkills || [],
  teamSize: project.teamSize,
  status: project.status,
  progress: project.progress,
  deadline: project.deadline,
  members: project.members || [],
  createdBy: project.createdBy,
  dueDate: project.deadline,
  tasks: project.tasks || [],
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, category, requiredSkills, teamSize, deadline } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const project = await Project.create({
      title,
      description,
      category: category || "Web Development",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : String(requiredSkills || "").split(",").map((item) => item.trim()).filter(Boolean),
      teamSize: Number(teamSize) || 4,
      deadline: deadline || null,
      createdBy: req.user.userId,
      members: [req.user.userId],
      status: "Planning",
      progress: 0,
    });

    const created = await Project.findById(project._id).populate("createdBy", "name email department skills").populate("members", "name email availability");

    res.status(201).json({ message: "Project created successfully!", project: sanitizeProject(created) });
  } catch (error) {
    console.error("Project creation failed:", error);
    res.status(500).json({ message: "Project creation failed", error: error.message });
  }
});

router.post("/create", requireAuth, async (req, res) => {
  return router.handle(req, res);
});

router.get("/", async (_req, res) => {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name email department skills")
      .populate("members", "name email availability")
      .sort({ createdAt: -1 });

    res.json({ projects: projects.map(sanitizeProject) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email department skills")
      .populate("members", "name email availability");

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ project: sanitizeProject(project) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project", error: error.message });
  }
});

module.exports = router;