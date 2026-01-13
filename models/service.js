const mongoose = require("mongoose");

const ServiceRequestSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceType: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    customerLocation: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ServiceRequest ||
  mongoose.model("ServiceRequest", ServiceRequestSchema);
