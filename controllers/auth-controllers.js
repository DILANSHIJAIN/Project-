const User = require("../models/user-model");
const bcrypt = require("bcryptjs");

// HOME
const home = async (req, res) => {
    try {
        res.status(200).send("Welcome to world best platform");
    } catch (error) {
        console.log(error);
    }
};

// REGISTER
const register = async (req, res) => {

    console.log("🔥 REGISTER FUNCTION HIT");

    try {

        const { username, email, phone, password } = req.body;

        console.log("REGISTER BODY:", req.body);

        const userExist = await User.findOne({ email });

        if (userExist) {
            return res.status(400).json({
                msg: "email already exists"
            });
        }

        //const saltRound = 10;

       // const hash_password = await bcrypt.hash(password, saltRound);

        const userCreated = await User.create({
            username,
            email,
            phone,
            password
        });

        console.log("USER CREATED:", userCreated);

        res.status(201).json({
            msg: "Registration Successful",
            token: await userCreated.generateToken(),
            userID: userCreated._id.toString()
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            msg: error.message
        });
    }
};

// LOGIN
const login = async (req, res) => {

    console.log("🔥 LOGIN FUNCTION HIT");

    try {

        const { email, password } = req.body;

        console.log("LOGIN EMAIL:", email);
        console.log("LOGIN PASSWORD:", password);

        const userExist = await User.findOne({ email });

        console.log("USER FOUND:", userExist);

        if (!userExist) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            userExist.password
        );

        console.log("PASSWORD MATCH:", isMatch);

        if (isMatch) {

            res.status(200).json({
                msg: "Login Successful",
                token: await userExist.generateToken(),
                userID: userExist._id.toString(),
            });

        } else {

            res.status(401).json({
                message: "Invalid email or Password"
            });
        }

    } catch (error) {

        console.log(error);
        next(error);

        // res.status(500).json({
        //     message: "Internal server error"
        // });
    }
};

module.exports = {
    home,
    register,
    login
};