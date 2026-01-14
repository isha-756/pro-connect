const router = require("express").Router();
const User = require("../models/User");
const ServiceRequest = require("../models/servicerequest");
const ServiceTaken = require("../models/servicetaken");
const Notification = require("../models/notification");
/* ============================
   1. UPDATE CUSTOMER LOCATION
============================ */
router.post("/update-location", async (req, res) => {
  try {
    const { customerId, lat, lng } = req.body;

    await User.findByIdAndUpdate(customerId, {
      location: {
        type: "Point",
        coordinates: [lng, lat] // IMPORTANT ORDER
      }
    });

    res.json({ msg: "Customer location updated" });
  } catch (err) {
    res.status(500).json({ msg: "Location update failed" });
  }
});
/* ============================
   2. SELECT SERVICE
   → Notify ALL providers of that service
============================ */
router.post("/select-service", async (req, res) => {
  try {
    const { serviceType } = req.body;

    const providers = await User.find({
      role: "provider",
      serviceType
    });

    const io = req.app.get("io");

    providers.forEach((provider) => {
      if (provider.socketId) {
        io.to(provider.socketId).emit("service-alert", {
          message: "A customer is looking for your service",
          serviceType
        });
      }
      // else → offline (store later if needed)
    });

    res.json({
      msg: "Providers notified (online via socket)",
      totalProviders: providers.length
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
/* ============================
   3. SEND REQUEST
   → Create request
   → Notify provider
   → Notify customer
============================ */
router.post("/send-request", async (req, res) => {
  try {
    const { customerId, providerId, serviceType } = req.body;

    const customer = await User.findById(customerId).select(
      "Full Name phone location"
    );
    const provider = await User.findById(providerId).select("socketId");

    if (!customer || !provider)
      return res.status(404).json({ msg: "User not found" });

    const request = await ServiceRequest.create({
      customer: customerId,
      provider: providerId,
      serviceType,
      customerLocation: customer.location
    });

    const io = req.app.get("io");

    // 🔔 Notify provider (name + phone)
    if (provider.socketId) {
      io.to(provider.socketId).emit("service-request", {
        requestId: request._id,
        serviceType,
        customer: {
          id: customer._id,
          name: customer["Full Name"],
          phone: customer.phone
        }
      });
    }

    // 🔔 Notify customer (stored)
    await Notification.create({
      user: customerId,
      message: "Request sent successfully"
    });

    res.json({ msg: "Request sent", requestId: request._id });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
/* ============================
   4. MY REQUESTS
   → ONLY accepted
============================ */
router.get("/my-requests/:customerId", async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      customer: req.params.customerId,
      status: "accepted"
    }).populate("provider", "Full Name phone Profile Photo");

    res.json(requests);
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

/* ============================
   5. COMPLETE SERVICE
   → Move to ServiceTaken
============================ */
router.post("/complete/:requestId", async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);

    if (!request)
      return res.status(404).json({ msg: "Request not found" });

    await ServiceTaken.create({
      customer: request.customer,
      provider: request.provider,
      serviceType: request.serviceType,
      customerLocation: request.customerLocation,
      completedAt: new Date(),
      completedBy: "customer"
    });

    await ServiceRequest.findByIdAndDelete(request._id);

    res.json({ msg: "Service completed successfully" });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

/* ============================
   6. CUSTOMER NOTIFICATIONS
============================ */
router.get("/notifications/:customerId", async (req, res) => {
  const notifications = await Notification.find({
    user: req.params.customerId
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

module.exports = router;