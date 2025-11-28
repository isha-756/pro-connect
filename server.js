// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// connect DB
connectDB();

// middlewares
app.use(cors()); // allow cross-origin calls (configure origins in production)
app.use(express.json());

// routes
app.use('/api/auth', require('./routes/auth'));

// example protected test route
const auth = require('./middleware/auth');
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: `Hello ${req.user.id}, this is protected`, user: req.user });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
