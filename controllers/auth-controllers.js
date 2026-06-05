const User = require("../models/user-model");
const bcrypt = require("bcryptjs");

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

module.exports = {
    home,
    register,
    login,
    user // Export the user function
};