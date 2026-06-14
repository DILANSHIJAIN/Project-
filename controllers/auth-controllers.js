const User = require("../models/user-model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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

// REGISTER
const register = async (req, res, next) => {

    console.log(" REGISTER FUNCTION HIT");

    try {

        let { username, email, phone, password } = req.body;

        if (!username || !email || !phone || !password) {
            return res.status(400).json({ message: "Please fill all registration fields" });
        }

        email = email.trim().toLowerCase();

        const userExist = await User.findOne({ email });

        if (userExist) {
            return res.status(400).json({ message: "email already exists" });
        }

        // Explicitly set role and admin status for new users
        const isAdmin = false; 

        const userCreated = await User.create({
            username,
            email,
            phone,
            password, // Let the User model middleware handle hashing
            isAdmin
        });

        res.status(201).json({
            message: "Registration Successful",
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

        email = email.trim().toLowerCase(); // Standardize email casing to match registration

        const userCount = await User.countDocuments();
        console.log(`🔍 Login Attempt: "${email}" | DB: "${mongoose.connection.name}" | Users: ${userCount}`);

        // World-class fix: Escape special regex characters to prevent server crashes on specific inputs
        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        let userExist = await User.findOne({
            $or: [
                { email: { $regex: new RegExp("^" + escapedEmail + "$", "i") } },
                { username: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }
            ]
        });

        if (!userExist) {
            console.log(`❌ Login failed: No user found with identifier: ${email}`);
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        // Security check: ensure the user document has a password
        if (!userExist.password) {
            console.log(`❌ Login failed: No password hash for ${email}.`);
            return res.status(500).json({ message: "Account configuration error" });
        }

        const isMatch = await bcrypt.compare(
            password,
            userExist.password
        );

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

            res.status(401).json({
                message: "Invalid email or Password"
            });
        }

    } catch (error) {

        next(error);
    }
};

//to send user data
const user=async(req,res,next)=>{
  try{
     const userData=req.user;
     console.log(userData);
     return res.status(200).json({userData});
  }catch(error){
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

        // Escape special regex characters to prevent crashes and allow robust searching
        const escapedEmail = sanitizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const user = await User.findOne({
            $or: [
                { email: sanitizedEmail }, // Direct match first
                { username: sanitizedEmail },
                { email: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }, // Case-insensitive regex
                { username: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }
            ]
        });

        if (!user) {
            console.log(`❌ No user found matching identifier: "${sanitizedEmail}"`);
            return res.status(404).json({ message: "User with this email or username does not exist." });
        }

        // Generate a random reset token
        const token = crypto.randomBytes(20).toString("hex");
        console.log(`🔑 Generating new reset token for: ${user.email}`);
        
        // Data Repair: Clean up any legacy newlines (like "admin\n") in the role array
        // We do this via updateOne to avoid triggering validation errors during the fix
        if (user.role && Array.isArray(user.role)) {
            const cleanRole = user.role.map(r => typeof r === 'string' ? r.trim() : r);
            await User.updateOne({ _id: user._id }, { $set: { role: cleanRole } });
        }

        // Use findByIdAndUpdate to update the token
        const updateResult = await User.findByIdAndUpdate(user._id, {
            $set: {
                resetPasswordToken: token,
                resetPasswordExpires: Date.now() + 3600000, // 1 hour
            }
        }, { new: true }); // {new: true} returns the updated document

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
                console.log("Current working directory:", process.cwd());
                throw new Error(`Missing ${missing} in environment configuration.`);
            }
            
            // Create the transporter
            const transporter = getTransporter();
            
            // Send the response to the user immediately
            res.status(200).json({ message: "A reset link has been sent to your email." });

            // Trigger the email sending in the background (no 'await')
            transporter.sendMail(mailOptions)
                .then(() => console.log(`✅ Background: Password reset email sent to: ${user.email}`))
                .catch((err) => console.error("❌ Background Email Error:", err.message));

        } catch (mailError) {
            console.error("❌ Nodemailer Error Details:", mailError);
            // Since we moved the response up, this catch only handles immediate config errors
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
        // Updating password - the pre-save hook in user-model.js will handle hashing
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
    login,
    user,
    forgotPassword,
    resetPassword
};