const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// REGISTER CUSTOMER
router.post("/register", async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            profilePhoto,
            password,
            province,
            municipality,
            district,
            wardNo
        } = req.body;

        // Check duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ msg: "Email already registered" });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            phone,
            profilePhoto,
            password: hashedPassword,
            province,
            municipality,
            district,
            wardNo,
            otp
        });

        await newUser.save();

        // Send OTP email
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Pro-Connect Email Verification",
            html: `<h2>Your OTP is: <b>${otp}</b></h2>`
        });

        res.json({ msg: "OTP Sent to Email", email });

    } catch (error) {
        res.status(500).json({ msg: "Server Error", error });
    }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        if (user.otp !== otp)
            return res.status(400).json({ msg: "Incorrect OTP" });

        user.isVerified = true;
        user.otp = null;
        await user.save();

        res.json({ msg: "Email Verified Successfully" });

    } catch (error) {
        res.status(500).json({ msg: "Server Error", error });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        if (!user.isVerified)
            return res.status(400).json({ msg: "Please verify your email first" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Incorrect Password" });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ msg: "Login Successful", token, user });

    } catch (error) {
        res.status(500).json({ msg: "Server Error", error });
    }
});

module.exports = router;
