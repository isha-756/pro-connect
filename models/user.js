const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    "Full Name": {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    "Profile Photo": {
      type: String // URL or Base64
    },

    role: {
      type: String,
      enum: ["customer", "provider"],
      default: "customer"
    },

    // ✅ REQUIRED FOR SERVICE MATCHING (PROVIDER)
    serviceType: {
      type: String,
      default: null
    },

    // ✅ GEO LOCATION (USED BY REQUEST & DISTANCE)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },

    isOnline: {
      type: Boolean,
      default: false
    },

    socketId: {
      type: String,
      default: null
    },

    otp: {
      type: String,
      default: null
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// ✅ REQUIRED FOR GEO QUERIES
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
