const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.userId) {
      return res.status(401).json({ message: "Invalid login token." });
    }
    req.user = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

module.exports = requireAuth;
