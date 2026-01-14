const mongoose = require("mongoose");

const serviceTakenSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    serviceType: {
      type: String,
      required: true
    },

    customerLocation: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },

    completedBy: {
      type: String,
      enum: ["customer", "provider"],
      required: true
    },

    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceTaken", serviceTakenSchema);
