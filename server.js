// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

dotenv.config();

// -----------------------------
// App & HTTP server
// -----------------------------
const app = express();
const server = http.createServer(app);

// -----------------------------
// Socket.IO setup
// -----------------------------
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔹 Make io accessible in all routes
app.set("io", io);

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// -----------------------------
// Database connection
// -----------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err =>
    console.error("❌ MongoDB connection error:", err.message)
  );

// -----------------------------
// Models (registered once)
// -----------------------------
require("./models/User");
// -----------------------------
// Routes (CUSTOMER SIDE)
// -----------------------------
app.use("/api/customer/auth", require("./routes/auth"));
app.use("/api/customer/location", require("./routes/location"));
app.use("/api/customer/request", require("./routes/request"));
app.use("/api/customer/rating", require("./routes/rating"));
app.use("/api/customer/distance", require("./routes/distance"));

// -----------------------------
// Health Check
// -----------------------------
app.get("/", (req, res) => {
  res.send("✅ Professional Connect – Customer API Running");
});

// -----------------------------
// Socket.IO logic (Customer + Provider notifications)
// -----------------------------
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  /*
   Register socket after login
   Used for:
   - customer notifications
   - provider request alerts
  */
  socket.on("register", async ({ userId }) => {
    try {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(userId, {
        socketId: socket.id
      });
    } catch (err) {
      console.error("Socket register error:", err.message);
    }
  });

  /*
   Live location update (customer)
  */
  socket.on("update-location", async ({ userId, latitude, longitude }) => {
    try {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(userId, {
        location: {
          type: "Point",
          coordinates: [longitude, latitude] // [lng, lat]
        }
      });
    } catch (err) {
      console.error("Location update error:", err.message);
    }
  });

  /*
   Cleanup on disconnect
  */
  socket.on("disconnect", async () => {
    try {
      const User = mongoose.model("User");
      await User.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: null }
      );
      console.log("⚡ Socket disconnected:", socket.id);
    } catch (err) {
      console.error("Disconnect error:", err.message);
    }
  });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
