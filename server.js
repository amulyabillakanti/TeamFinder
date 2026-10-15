const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const teamRequestRoutes = require("./routes/teamRequestRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 5050;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server requests and local tools without an Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.send("TeamFinder backend is working!"));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/team-requests", teamRequestRoutes);

app.use((err, _req, res, _next) => {
  console.error("Request error:", err.message);
  res.status(err.message.includes("CORS") ? 403 : 500).json({
    message: err.message.includes("CORS") ? "This website is not allowed to access the API." : "Unexpected server error.",
  });
});

async function start() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from environment variables.");
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing from environment variables.");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected successfully.");
  app.listen(PORT, "0.0.0.0", () => console.log(`TeamFinder API listening on port ${PORT}`));
}

start().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
