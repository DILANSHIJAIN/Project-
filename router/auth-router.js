const express = require("express");
const router = express.Router();

const authcontrollers =
  require("../controllers/auth-controllers"); // Checked: Adjusted to match your single controller export schema

const signupSchema =
  require("../validators/auth-validator");

const loginSchema =
  require("../validators/login-validator");

const validate =
  require("../middlewares/validate-middleware");

const authMiddleware = require("../middlewares/auth-middleware");


// Home route
router.get("/", authcontrollers.home);


// Register route (🚪 Step 1: Validates information structure, then generates & drops OTP)
router.post(
  "/register",
  validate(signupSchema),
  authcontrollers.register
);


// 🔑 New OTP Verification route (Step 2: Re-validates data profile inputs, then registers permanently)
router.post(
  "/verify-otp",
  validate(signupSchema),
  authcontrollers.verifyOtp
);


// Login route
router.post(
  "/login",
  validate(loginSchema),
  authcontrollers.login
);

router.route("/user").get(authMiddleware, authcontrollers.user);

router.route("/forgot-password").post(authcontrollers.forgotPassword);
router.route("/reset-password/:token").post(authcontrollers.resetPassword);

module.exports = router;