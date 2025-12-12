const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  phone: { type: String, required: true },

  profilePhoto: { type: String },   // URL or Base64

  password: { type: String, required: true },

  province: { type: String, required: true },

  municipality: { type: String, required: true },

  district: { type: String, required: true },

  wardNo: { type: String, required: true },

  otp: { type: String },

  isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
