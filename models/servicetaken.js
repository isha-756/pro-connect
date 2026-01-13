const mongoose = require("mongoose");

const serviceTakenSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    serviceType: String,

    customerLocation: {
      lat: Number,
      lng: Number
    },

    completedBy: {
      type: String,
      enum: ["customer", "provider"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceTaken", serviceTakenSchema);
