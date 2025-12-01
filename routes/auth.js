// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const auth = require('../middleware/auth'); // optional: for /me route

// Helper: simple validation (you can extend)
const isEmpty = (v) => !v || String(v).trim() === '';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, province, city } = req.body;

    // basic validations
    if (isEmpty(name) || isEmpty(email) || isEmpty(password) || isEmpty(phone) || isEmpty(province) || isEmpty(city)) {
      return res.status(400).json({ msg: 'Please provide name, email, password, phone, province and city.' });
    }

    // check existing
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) return res.status(400).json({ msg: 'User with this email already exists.' });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      province: province.trim(),
      city: city.trim(),
    });

    await user.save();

    // sign token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

    // return token and basic user (exclude password)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        province: user.province,
        city: user.city,
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send('Server error');
  }
});

// LOGIN (email + password only)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (isEmpty(email) || isEmpty(password)) {
      return res.status(400).json({ msg: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials.' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        province: user.province,
        city: user.city,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// optional: get current user (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
