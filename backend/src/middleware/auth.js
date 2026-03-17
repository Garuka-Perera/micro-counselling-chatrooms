const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Invalid or expired token",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};