const rbacMiddleware = (requiredRole = "user") => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check admin role for admin-only endpoints
      if (requiredRole === "admin" && !req.user.isAdmin) {
        return res.status(403).json({
          message: "Access denied. Admin privileges required.",
          status: 403,
        });
      }

      // Check support agent role
      if (requiredRole === "agent" && !req.user.isAdmin && !req.user.role?.includes("agent")) {
        return res.status(403).json({
          message: "Access denied. Support agent or admin privileges required.",
          status: 403,
        });
      }

      next();
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      return res.status(500).json({
        message: "Error checking access permissions",
        status: 500,
      });
    }
  };
};

module.exports = rbacMiddleware;
