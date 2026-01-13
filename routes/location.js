const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

router.post("/update", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ msg: "Latitude & longitude required" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    });

    res.json({ msg: "Location updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

