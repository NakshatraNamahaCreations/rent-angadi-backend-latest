const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Clientmodel = require("../model/clients");
const Executive = require("../model/executive");
const User = require("../model/user");
const mongoose = require("mongoose");
const executiveController = {
  async createExecutive(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { password, phoneNumber, name, email } = req.body;
      const { clientId } = req;

      // Validate required fields
      if (!password || !phoneNumber || !name || !email || !clientId) {
        return res.status(400).json({
          message: "All fields (password, phoneNumber, name, email, clientId) are required"
        });
      }

      // Check if client exists
      const client = await User.findById(clientId);
      if (!client) {
        return res.status(404).json({
          message: "Client not found"
        });
      }

      // const existingExecutive = await Executive.findOne({
      //   $or: [
      //     { username },
      //     { email }
      //   ],
      //   clientId
      // });

      const existingExecutive = await User.findOne({
        phoneNumber
      });

      if (existingExecutive) {
        return res.status(400).json({
          message: existingExecutive.phoneNumber === phoneNumber
            ? "Phone Number already exists for this client"
            : "Email already exists for this client"
        });
      }


      const newExecutive = await User.create([
        {
          phoneNumber,
          name,
          email,
          clientId,
          role: "executive",
          permissions: {
            addNewEnquiry: true,            
            }
          }
      ], { session });

      // await User.updateOne({ _id: clientId }, { $push: { executives: newExecutive._id } }, { session });
      await User.updateOne(
        { _id: clientId },
        { $push: { executives: newExecutive[0]._id } }, // Push the executive's _id to the client's executives array
        { session } // Pass session to the update operation
      );


      await session.commitTransaction();

      return res.status(201).json({
        message: "Executive created successfully"
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({
        message: "Failed to create executive",
        error: error.message
      });
    } finally {
      await session.endSession();
    }
  },

  async getAllExecutives(req, res) {
    try {
      const { clientId } = req;

      if (!clientId) {
        return res.status(400).json({
          message: "Client ID is required"
        });
      }

      const client = await User.findById(clientId)
        .populate('executives', 'name phoneNumber permissions isActive')
        .lean();

      // const users = await User.find({ clientId, role: "executive" })
      //   .populate('executiveId', 'executiveName clientId')
      //   .sort({ createdAt: -1 })
      //   .lean();

      // console.log("Users: ", users);

      res.status(200).json({
        message: "Executives retrieved successfully",
        client
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
      const executive = await User.findOne({
        _id: id,
        clientId
      })

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
      );

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
      const { phoneNumber, password } = req.body;

      const executive = await Executive.findOne({ phoneNumber });

      if (!executive || !await executive.comparePassword(password)) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      const token = jwt.sign(
        {
          id: executive._id,
          phoneNumber: executive.phoneNumber,
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
