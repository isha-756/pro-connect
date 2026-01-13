const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/* ============================
   EMAIL SETUP
============================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/* ============================
   REGISTER CUSTOMER
============================ */
router.post("/register", async (req, res) => {
  try {
    const {
      "Full Name": fullName,
      email,
      phone,
      "Profile Photo": profilePhoto,
      password
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "Email already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      profilePhoto,
      role: "customer",
      otp,
      isVerified: false
    });

    await newUser.save();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Pro-Connect Email Verification",
      html: `<h2>Your OTP is: <b>${otp}</b></h2>`
    });

    res.status(201).json({ msg: "OTP sent to email", email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* ============================
   VERIFY OTP
============================ */
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

    res.json({ msg: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});
/* ============================
   LOGIN (CUSTOMER ONLY)
   → Location mandatory
============================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password, latitude, longitude } = req.body;

    // 1️⃣ Check location first
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        msg: "Location permission is required to login"
      });
    }

    // 2️⃣ Find customer
    const user = await User.findOne({
      email,
      role: "customer"
    });

    if (!user)
      return res.status(400).json({ msg: "Customer not found" });

    if (!user.isVerified)
      return res
        .status(400)
        .json({ msg: "Please verify your email first" });

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Incorrect password" });

    // 4️⃣ Store location at login time (GeoJSON)
    user.location = {
      type: "Point",
      coordinates: [longitude, latitude] // [lng, lat]
    };

    await user.save();

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6️⃣ Success response
    res.json({
      msg: "Customer login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* ============================
   LOGOUT
============================ */
router.post("/logout", (req, res) => {
  res.status(200).json({ msg: "Customer logged out successfully" });
});

const auth = require("../middleware/auth");

/* ============================
   EDIT CUSTOMER PROFILE
============================ */
router.put("/edit-profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { phone, profilePhoto } = req.body;

    const updateFields = {};
    if (phone) updateFields.phone = phone;
    if (profilePhoto) updateFields.profilePhoto = profilePhoto;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true }
    ).select("-password -otp");

    res.json({
      msg: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
