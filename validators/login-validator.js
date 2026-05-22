const { z } = require("zod");

// Login validation schema
const loginSchema = z.object({

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address" }),

  password: z
    .string({ required_error: "Password is required" })
    .trim()
    .min(6, {
      message: "Password must be at least 6 characters.",
    }),

});

module.exports = loginSchema;