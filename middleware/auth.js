// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Token can be sent as:
  // 1️⃣ x-auth-token
  // 2️⃣ Authorization: Bearer <token>
  const token =
    req.header("x-auth-token") ||
    (req.header("authorization") &&
      req.header("authorization").split(" ")[1]);

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT FIX
    // Your JWT payload = { id, role }
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

