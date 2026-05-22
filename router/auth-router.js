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


module.exports = router;