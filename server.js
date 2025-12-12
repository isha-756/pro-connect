// server.js
const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const ratingRoutes = require("./routes/rating"); // Rating & Review routes

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allows profilePhoto as Base64

// Routes
app.use("/api/auth", authRoutes);       // Auth routes
app.use("/api/rating", ratingRoutes);   // Rating & Review routes

// Test route
app.get("/", (req, res) => {
    res.send("Pro-Connect API Running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

