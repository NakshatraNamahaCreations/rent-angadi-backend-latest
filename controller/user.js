const JWT_SECRET_KEY = require("../config/jwtSecret");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../model/user");

async function signup(req, res) {
  try {
    const { phoneNumber } = req.body;
    console.log("phoneNumber: ", phoneNumber)

    // validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const phoneRegex = /^[6-9]\d{9}$/; // Starts with 6–9 and has 10 digits
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const user = await userModel.findOne({ phoneNumber });
    console.log(`user: `, user);

    if (user) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const newUser = await userModel.create({
      phoneNumber,
    });

    const token = await jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(201).json({ success: "User signed up successfully", token, newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { phoneNumber } = req.body;
    console.log("phoneNumber: ", phoneNumber)

    const user = await userModel.findOne({ phoneNumber });
    console.log(`user: `, user);

    if (!user) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const token = await jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({ success: "Logged in successfully", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { signup, login };
