const User = require("../models/user-model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Otp = require(require('path').join(process.cwd(), 'otp-model.js'));
const { sendOtpEmail } = require("../utils/mailer"); // ✅ Loads your centralized mailer utility

// Function to get email transporter
const getTransporter = () => {
    return nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// HOME
const home = async (req, res, next) => {
    try {
        res.status(200).send("Welcome to world best platform");
    } catch (error) {
        next(error);
    }
};

// REGISTER (🚪 STEP 1: Validate & Send 6-Digit Verification Code)
const register = async (req, res, next) => {
    console.log("🚀 OTP REGISTER INITIATION FUNCTION HIT");

    try {
        let { username, email, phone, password } = req.body;

        if (!username || !email || !phone || !password) {
            return res.status(400).json({ message: "Please fill all registration fields" });
        }

        email = email.trim().toLowerCase();

        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Generate a secure, random 6-digit numeric OTP string
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP temporarily to MongoDB (cleans up any older attempts for this user first)
        await Otp.deleteOne({ email });
        await Otp.create({ email, otp: otpCode });

        // Dispatch the verification email to the user's inbox
        await sendOtpEmail(email, otpCode);

        res.status(200).json({
            message: "Verification code sent to your email. Please check your inbox.",
            step: 2 // Tells your frontend state to switch open the verification input fields
        });

    } catch (error) {
        next(error);
    }
};

// VERIFY OTP (🔑 STEP 2: Validate Code and Complete Permanent DB Registration)
const verifyOtp = async (req, res, next) => {
    console.log("🔑 OTP VERIFICATION FUNCTION HIT");

    try {
        let { username, email, phone, password, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and verification code are required" });
        }

        email = email.trim().toLowerCase();

        // 1. Locate matching email and OTP credentials in MongoDB
        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        // 2. Prevent race conditions or multi-tab duplicate creations
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: "User already registered." });
        }

        // Explicitly set role and admin status for new users
        const isAdmin = false; 

        // 3. Complete registration to your primary collection permanently
        const userCreated = await User.create({
            username,
            email,
            phone,
            password, // Let your pre-save User hook handle hashing dynamically
            isAdmin
        });

        // 4. Wipe out the matching OTP record now that authentication succeeded
        await Otp.deleteOne({ _id: otpRecord._id });

        // 5. Send back authorization access payloads exactly like your old register route
        res.status(201).json({
            message: "Account verified and registered successfully!",
            token: userCreated.generateToken(),
            isAdmin: userCreated.isAdmin,
            userID: userCreated._id.toString()
        });

    } catch (error) {
        next(error);
    }
};

// LOGIN
const login = async (req, res, next) => {
    console.log(" LOGIN FUNCTION HIT");

    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        email = email.trim().toLowerCase(); 

        const userCount = await User.countDocuments();
        console.log(`🔍 Login Attempt: "${email}" | DB: "${mongoose.connection.name}" | Users: ${userCount}`);

        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        let userExist = await User.findOne({
            $or: [
                { email: { $regex: new RegExp("^" + escapedEmail + "$", "i") } },
                { username: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }
            ]
        });

        if (!userExist) {
            console.log(`❌ Login failed: No user found with identifier: ${email}`);
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        if (!userExist.password) {
            console.log(`❌ Login failed: No password hash for ${email}.`);
            return res.status(500).json({ message: "Account configuration error" });
        }

        const isMatch = await bcrypt.compare(password, userExist.password);

        if (isMatch) {
            console.log(`✅ Login Successful: ${email} | Admin: ${userExist.isAdmin}`);
            
            res.status(200).json({
                message: "Login Successful",
                token: userExist.generateToken(),
                isAdmin: userExist.isAdmin,
                userID: userExist._id.toString(),
            });

        } else {
            console.log(`❌ Login failed: Password mismatch for ${email}.`);
            res.status(401).json({ message: "Invalid email or Password" });
        }

    } catch (error) {
        next(error);
    }
};

// to send user data
const user = async (req, res, next) => {
  try {
     const userData = req.user;
     console.log(userData);
     return res.status(200).json({ userData });
  } catch (error) {
    next(error);
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Please provide a valid email address." });
        }

        const sanitizedEmail = email.trim().toLowerCase();
        const totalUsers = await User.countDocuments();
        console.log(`🔍 Password reset search (Identifier: "${sanitizedEmail}") | Total Users in DB: ${totalUsers}`);

        const escapedEmail = sanitizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const user = await User.findOne({
            $or: [
                { email: sanitizedEmail }, 
                { username: sanitizedEmail },
                { email: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }, 
                { username: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }
            ]
        });

        if (!user) {
            console.log(`❌ No user found matching identifier: "${sanitizedEmail}"`);
            return res.status(404).json({ message: "User with this email or username does not exist." });
        }

        const token = crypto.randomBytes(20).toString("hex");
        console.log(`🔑 Generating new reset token for: ${user.email}`);
        
        if (user.role && Array.isArray(user.role)) {
            const cleanRole = user.role.map(r => typeof r === 'string' ? r.trim() : r);
            await User.updateOne({ _id: user._id }, { $set: { role: cleanRole } });
        }

        const updateResult = await User.findByIdAndUpdate(user._id, {
            $set: {
                resetPasswordToken: token,
                resetPasswordExpires: Date.now() + 3600000, 
            }
        }, { new: true }); 

        if (!updateResult) {
            console.error(`❌ Database update failed for User ID: ${user._id}`);
            return res.status(500).json({ message: "Failed to generate reset token. Please try again." });
        }

        const frontendBaseUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "http://10.238.173.228:5173";
        const resetUrl = `${frontendBaseUrl}/reset-password/${token}`;
        console.log(`📧 Sending reset link: ${resetUrl}`);

        const mailOptions = {
            to: user.email.trim(),
            from: process.env.EMAIL_USER,
            subject: "Password Reset Request",
            text: `You requested a password reset for your account.\n\n` +
                `Please click the link below to set a new password:\n\n` +
                `${resetUrl}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                const missing = !process.env.EMAIL_USER ? "EMAIL_USER" : "EMAIL_PASS";
                console.error(`❌ Environment Variable Missing: ${missing}`);
                throw new Error(`Missing ${missing} in environment configuration.`);
            }
            
            const transporter = getTransporter();
            res.status(200).json({ message: "A reset link has been sent to your email." });

            transporter.sendMail(mailOptions)
                .then(() => console.log(`✅ Background: Password reset email sent to: ${user.email}`))
                .catch((err) => console.error("❌ Background Email Error:", err.message));

        } catch (mailError) {
            console.error("❌ Nodemailer Error Details:", mailError);
        }
    } catch (error) {
        next(error);
    }
};

// RESET PASSWORD
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        console.log(`🔄 Reset Password attempt for token: ${token}`);

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            console.log(`❌ Reset Password failed: Token invalid or expired for token: ${token}`);
            return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }
        console.log(`✅ User found for token: ${token}. User ID: ${user._id}`);
        
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        console.log(`✅ Password reset successful and token invalidated for user: ${user._id}`);

        res.status(200).json({ message: "Password has been updated successfully." });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    home,
    register,
    verifyOtp, // ✅ Exported new verification route handler
    login,
    user,
    forgotPassword,
    resetPassword
};