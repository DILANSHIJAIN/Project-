const express = require("express");
const router = express.Router();

const authcontrollers =
  require("../controllers/auth-controllers");

const signupSchema =
  require("../validators/auth-validator");

const loginSchema =
  require("../validators/login-validator");

const validate =
  require("../middlewares/validate-middleware");

const authMiddleware=require("../middlewares/auth-middleware");



// Home route
router.get("/", authcontrollers.home);


// Register route
router.post(
  "/register",
  validate(signupSchema),
  authcontrollers.register
);


// Login route
router.post(
  "/login",
  validate(loginSchema),
  authcontrollers.login
);
router.route("/user").get(authMiddleware,authcontrollers.user);

router.route("/forgot-password").post(authcontrollers.forgotPassword);
router.route("/reset-password/:token").post(authcontrollers.resetPassword);

module.exports = router;