const JWT_SECRET_KEY = require("../config/jwtSecret");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const Client = require("../model/clients");
const Executive = require("../model/executive");

const signup = async (req, res) => {
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

    const user = await User.findOne({ phoneNumber });
    console.log(`user: `, user);

    if (user) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const newUser = await User.create({
      phoneNumber,
    });

    const token = await jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(201).json({ message: "User signed up successfully", token, newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    console.log("phoneNumber: ", phoneNumber)

    const user = await User.findOne({ phoneNumber }).lean();
    console.log(`user: `, user);

    if (!user) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ error: "Invalid password" });
    // }

    

    let token = '';
    let permissions = user.permissions || {};

    if (user.executiveId) {
      // Fetch executive permissions
      const executive = await Executive.findById(user.executiveId).lean();
      if (executive) {
        permissions = executive.permissions || {};
      }
      token = jwt.sign({ 
        phoneNumber, 
        role: "executive",
        permissions,
        executiveId: user.executiveId 
      }, JWT_SECRET_KEY, { expiresIn: "1h" });
    }else if (user.clientId) {
      // Fetch client permissions
      const client = await Client.findById(user.clientId).lean();
      if (client) {
        permissions = client.permissions || {};
      }
      token = jwt.sign({ 
        phoneNumber, 
        role: "client",
        permissions,
        clientId: user.clientId 
      }, JWT_SECRET_KEY, { expiresIn: "1h" });
    } 

    res.status(200).json({ 
      message: "Logged in successfully",
      token,
      permissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { signup, login };
