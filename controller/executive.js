const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Executive = require("../model/executive");
const Clientmodel = require("../model/clients");
const AdminModel = require("../model/Auth/adminLogin");

const executiveController = {
  async createExecutive(req, res) {
    try {
      const { username, password, name, email, clientId } = req.body;

      // Validate required fields
      if (!username || !password || !name || !email || !clientId) {
        return res.status(400).json({
          message: "All fields (username, password, name, email, clientId) are required"
        });
      }

      // Check if client exists
      const client = await Clientmodel.findById(clientId);
      if (!client) {
        return res.status(404).json({
          message: "Client not found"
        });
      }

      const existingExecutive = await Executive.findOne({
        $or: [
          { username },
          { email }
        ],
        clientId
      });

      if (existingExecutive) {
        return res.status(400).json({
          message: existingExecutive.username === username
            ? "Username already exists for this client"
            : "Email already exists for this client"
        });
      }

      const newExecutive = new AdminModel({
        email,
        password,
        clientId,
        isExecutive: true,
        roles: {
          addNewEnquiry: true,
          myOrders: true
        }
      });

      await newExecutive.save();

      // Don't return password in response
      const executiveData = newExecutive.toObject();
      delete executiveData.password;

      res.status(201).json({
        message: "Executive created successfully",
        executive: executiveData
      });
    } catch (error) {
      console.error("Error creating executive:", error);
      res.status(500).json({
        message: "Failed to create executive",
        error: error.message
      });
    }
  },

  async getAllExecutives(req, res) {
    try {
      const { clientId } = req.params;

      if (!clientId) {
        return res.status(400).json({
          message: "Client ID is required"
        });
      }

      const executives = await Executive.find({ clientId })
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: "Executives retrieved successfully",
        executives
      });
    } catch (error) {
      console.error("Error getting executives:", error);
      res.status(500).json({
        message: "Failed to get executives",
        error: error.message
      });
    }
  },

  async getExecutive(req, res) {
    try {
      const { id, clientId } = req.params;
      const executive = await Executive.findOne({
        _id: id,
        clientId
      })
        .select('-password');

      if (!executive) {
        return res.status(404).json({
          message: "Executive not found"
        });
      }

      res.status(200).json({
        message: "Executive retrieved successfully",
        executive
      });
    } catch (error) {
      console.error("Error getting executive:", error);
      res.status(500).json({
        message: "Failed to get executive",
        error: error.message
      });
    }
  },

  async updateExecutive(req, res) {
    try {
      const { id, clientId } = req.params;
      const updates = req.body;

      // Validate required fields
      if (!clientId) {
        return res.status(400).json({
          message: "Client ID is required"
        });
      }

      // If password is being updated, hash it
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      }

      const executive = await Executive.findOneAndUpdate(
        {
          _id: id,
          clientId
        },
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!executive) {
        return res.status(404).json({
          message: "Executive not found"
        });
      }

      res.status(200).json({
        message: "Executive updated successfully",
        executive
      });
    } catch (error) {
      console.error("Error updating executive:", error);
      res.status(500).json({
        message: "Failed to update executive",
        error: error.message
      });
    }
  },

  async deleteExecutive(req, res) {
    try {
      const { id, clientId } = req.params;
      const executive = await Executive.findOneAndDelete({
        _id: id,
        clientId
      });

      if (!executive) {
        return res.status(404).json({
          message: "Executive not found"
        });
      }

      res.status(200).json({
        message: "Executive deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting executive:", error);
      res.status(500).json({
        message: "Failed to delete executive",
        error: error.message
      });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;

      const executive = await Executive.findOne({ username });

      if (!executive || !await executive.comparePassword(password)) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      const token = jwt.sign(
        {
          id: executive._id,
          username: executive.username,
          role: executive.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Don't return password in response
      const executiveData = executive.toObject();
      delete executiveData.password;

      res.status(200).json({
        message: "Login successful",
        token,
        executive: executiveData
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({
        message: "Login failed",
        error: error.message
      });
    }
  }
};

module.exports = executiveController;
