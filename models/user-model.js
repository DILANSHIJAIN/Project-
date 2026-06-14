const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: [
      {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["user", "agent", "admin"],
      },
    ],
    default: ["user"],
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });


//  PASSWORD HASHING MIDDLEWARE
userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) {
    return next(); //  fixed
  }

  try {
    const saltRound = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(user.password, saltRound);

    user.password = hash_password;
    next(); //  IMPORTANT
  } catch (error) {
    next(error);
  }
});


// GENERATE JWT TOKEN
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      userId: this._id.toString(),
      email: this.email,
      isAdmin: this.isAdmin,
    },
    process.env.JWT_SECRET_KEY || "fallback_secret",
    {
      expiresIn: "30d",
    }
  );
};

const User = mongoose.model("User", userSchema);
module.exports = User;