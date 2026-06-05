const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const rbacMiddleware = require("../middlewares/rbac-middleware");

// Example: Protected route accessible to all authenticated users
router.get("/user-only", authMiddleware, rbacMiddleware("user"), (req, res) => {
  res.status(200).json({
    message: "User-only endpoint",
    user: req.user.username,
  });
});

// Example: Protected route accessible only to admins
router.get(
  "/admin-only",
  authMiddleware,
  rbacMiddleware("admin"),
  (req, res) => {
    res.status(200).json({
      message: "Admin-only endpoint",
      admin: req.user.username,
    });
  }
);

// Example: Protected route accessible to support agents or admins
router.get(
  "/support-only",
  authMiddleware,
  rbacMiddleware("agent"),
  (req, res) => {
    res.status(200).json({
      message: "Support agent endpoint",
      agent: req.user.username,
    });
  }
);

module.exports = router;
