const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: [
        "pending",      // request sent
        "accepted",     // provider accepted
        "in_progress",  // service started
        "rejected"      // provider rejected
      ],
      default: "pending"
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
