const Clientmodel = require("../model/clients");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const { parse } = require('date-fns');
const Order = require("../model/order");
const { default: mongoose } = require("mongoose");
const AdminModel = require("../model/Auth/adminLogin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const _ = require('lodash');

class Clients {
  async createClients(req, res) {
    let { clientName, email, phoneNumber, address, activeStatus, executives, clientPassword, } = req.body;

    console.log({ clientName, email, phoneNumber, address, activeStatus, executives })

    try {
      // Check if client with the same phone number already exists
      console.log("Client phoneNumber: ", phoneNumber)
      // const existingClient = await Clientmodel.findOne({ phoneNumber });
      // console.log("existingClient: ", existingClient)
      // if (existingClient) {
      //   return res.status(401).json({ error: "This number already exists!" });
      // }

      const phoneRegex = /^[6-9]\d{9}$/; // Starts with 6–9 and has 10 digits
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid Client phone number" });
      }

      // executives.forEach((exec) => {
      //   console.log(`exec: ${exec.phoneNumber}`);
      //   if (!phoneRegex.test(exec.phoneNumber)) {
      //     return res.status(400).json({ error: "Invalid Executive phone number" });
      //   }
      // });

      // let parsedExecutives = [];
      // if (executives) {
      //   parsedExecutives = Array.isArray(executives)
      //     ? executives
      //     : JSON.parse(executives);
      // }

      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        // if (!existingUser.clientDetails) {
        //   existingUser.clientDetails = newClient._id;
        //   await existingUser.save();
        //   const savedClient = await newClient.save();
        //   return res.json({ 
        //     success: "Client added successfully",
        //     client: savedClient,
        //     message: "User already existed but was updated with client details"
        //   });
        // }
        return res.status(400).json({ error: "Phone number already exists" });
      }

      const newClient = new User({
        phoneNumber,
        name: clientName,
        email,
        address,
        activeStatus,
        role: "client",
        permissions: {
          addNewEnquiry: true,
          executiveManagement: true,
          viewOrders: true,
        }
      });

      const savedClient = await newClient.save();

      // const hashedPassword = await bcrypt.hash(clientPassword, 10);
      // const newUser = await User.create({
      //   phoneNumber,
      //   password: hashedPassword,
      //   role: "client",
      //   clientDetails: savedClient._id,
      // });

      // Invalidate cache after adding a new client (if caching is used)
      if (cache) cache.del("allclients");

      return res.json({ success: "Client added successfully", client: savedClient });
    } catch (error) {
      console.error("Error creating client:", error);
      return res.status(500).json({ error: "Failed to add Client" });
    }
  }

  async clientlogin(req, res) {
    let { companyName, phoneNumber } = req.body;

    try {
      // Validate input
      if (!companyName || !phoneNumber) {
        return res.status(400).json({
          error: "Please enter company name, executive name, and executive phone number",
        });
      }

      // Find the client by company name
      const client = await User.findOne({ clientName: companyName });

      if (!client) {
        return res.status(404).json({
          error: "Client not found. Please check your details",
        });
      }

      // Check if the executive exists in the client's executive list
      const executive = client.executives.find(
        (exec) => exec.phoneNumber === phoneNumber
      );

      if (!executive) {
        return res.status(404).json({
          error: "Executive not found. Please check your details",
        });
      }

      // Update the active status for the client
      await User.findOneAndUpdate(
        { clientName: companyName },
        { activeStatus: "Online" },
        { new: true }
      );

      // Update the active status for the specific executive
      await User.updateOne(
        { clientName: companyName, "executives._id": executive._id },
        { $set: { "executives.$.activeStatus": "Online" } }
      );

      return res.status(200).json({
        success: "Login successful",
        client: {
          id: client._id,
          clientName: client.clientName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          address: client.address,
          executive: {
            id: executive._id,
            name: executive.name,
            phoneNumber: executive.phoneNumber,
            activeStatus: "Online",
          },
        },

      });
    } catch (error) {
      console.error("Error during client login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async editClients(req, res) {
    const ClientId = req.params.id;
    const {
      clientName,
      email,
      phoneNumber,
      address,
      executives, // Updated to include executives
    } = req.body;

    try {
      // Find the client by ID
      const findClients = await User.findOne({ _id: ClientId });
      if (!findClients) {
        return res.status(404).json({ error: "No data found" });
      }

      // Update client fields conditionally
      findClients.clientName = clientName || findClients.clientName;
      findClients.email = email || findClients.email;
      findClients.phoneNumber = phoneNumber || findClients.phoneNumber;

      findClients.address = address || findClients.address;

      // Parse and update executives if provided
      if (executives) {
        const parsedExecutives = Array.isArray(executives)
          ? executives
          : JSON.parse(executives);

        findClients.executives = parsedExecutives;
      }

      // Save updated client
      const updatedData = await findClients.save();

      // Invalidate cache after updating the client
      if (cache) cache.del("allclients");

      return res.json({ success: "Client updated successfully", data: updatedData });
    } catch (error) {
      console.error("Error updating client:", error);
      return res.status(500).json({ error: "Unable to update the Client" });
    }
  }

  // async editClients(req, res) {
  //   const ClientId = req.params.id;
  //   const {
  //     clientName,
  //     email,
  //     phoneNumber,
  //     alternateNumber,
  //     password,
  //     address,
  //   } = req.body;

  //   try {
  //     const findClients = await Clientmodel.findOne({ _id: ClientId });
  //     if (!findClients) {
  //       return res.json({ error: "No data found" });
  //     }

  //     findClients.clientName = clientName || findClients.clientName;

  //     findClients.email = email || findClients.email;
  //     findClients.phoneNumber = phoneNumber || findClients.phoneNumber;
  //     findClients.alternateNumber =
  //       alternateNumber || findClients.alternateNumber;
  //     findClients.password = password || findClients.password;
  //     findClients.address = address || findClients.address;

  //     let updatedData = await Clientmodel.findOneAndUpdate(
  //       { _id: ClientId },
  //       findClients,
  //       { new: true }
  //     );

  //     if (updatedData) {
  //       // Invalidate cache after updating a Client
  //       cache.del("allclients");
  //       return res.json({ success: "Updated", data: updatedData });
  //     } else {
  //       return res.json({ error: "Update failed" });
  //     }
  //   } catch (error) {
  //     console.log("error", error);
  //     return res.status(500).json({ error: "Unable to update the Client" });
  //   }
  // }

  async getallClients(req, res) {
    let cachedClients = cache.get("allclients");
    if (cachedClients) {
      return res.json({ Client: cachedClients });
    } else {
      try {
        const clients = await User.find({ role: "client" })
          .populate('executives')
          .sort({ createdAt: -1 })
          .lean();
        if (clients && clients.length > 0) {
          cache.set("allclients", clients);
          return res.json({ Client: clients });
        } else {
          return res.status(404).json({ error: "No clients found" });
        }
      } catch (error) {
        console.error("Error getting clients:", error);
        return res
          .status(500)
          .json({ error: "Failed to retrieve clients" });
      }
    }
  }

  async getClientsGrandTotal(req, res) {
    console.log("inside getClientsGrandTotal");
    const { clientIds, startDate, endDate } = req.body;
    console.log("Selected Clients:", clientIds, "startDate: ", startDate, "endDate: ", endDate);

    try {
      // const startdate = parse(startDate, "dd-MM-yyyy", new Date());
      // const enddate = parse(endDate, "dd-MM-yyyy", new Date());
      // const startdate = startDate
      // const enddate = endDate
      // const clientMap=clientIds.map(id => new mongoose.Types.ObjectId(id)) 
      // console.log("map: ", clientMap)

      const result = await Order.aggregate([
        {
          $match: {
            clientId: { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) },
            slots: {
              $elemMatch: {
                quoteDateObj: { $gte: new Date(startDate) },
                endDateObj: { $lte: new Date(endDate) }
              }
            }
          }
        },
        {
          $group: {
            _id: "$clientId",
            totalGrandTotal: { $sum: "$GrandTotal" },
            totalRoundOff: { $sum: "$roundOff" }
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "clientId",
            foreignField: "_id",
            as: "clientInfo"
          }
        },
        { $unwind: "$clientInfo" },
        {
          $project: {
            clientName: "$clientInfo.name",
            totalGrandTotal: 1,
            totalRoundOff: 1
          }
        }
      ]);



      console.log("result: ", result)

      return res.json(result);
    } catch (error) {
      console.error("Error fetching and processing orders:", error);
      return res.status(500).json({ error: "Failed to fetch client totals" });
    }
  }

  async getTotalNumberOfClients(req, res) {
    try {
      // Use await correctly with the countDocuments() method
      let clientCount = await Clientmodel.countDocuments({});
      // Check if the count is not zero (though it would still return 0 if no documents are found)
      if (clientCount !== null) {
        return res.json({ clientCount: clientCount });
      } else {
        return res.status(404).json({ error: "No clients found" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve client count" });
    }
  }

  async getClientsNames(req, res) {
    try {
      let Client = await Clientmodel.find({})
      if (Client) {
        return res.json({ ClientNames: Client });
      } else {
        return res.status(404).json({ error: "No subcategories found" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve subcategories" });
    }
  }

  async deleteClients(req, res) {
    let id = req.params.id;
    console.log("ID received in request:", id);

    try {
      let data = await Clientmodel.deleteOne({ _id: id });
      if (data.deletedCount > 0) {
        // Invalidate cache after deleting a Client
        cache.del("allclients");
        return res.json({ success: "Successfully deleted" });
      } else {
        return res.status(404).json({ error: "Client not found" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete Client" });
    }
  }

  async getCurrentClientName(req, res) {
    const { clientId, executiveId, userRole } = req;
    try {
      const client = await User.find({ _id: clientId })
        .populate('executives')
        .select('name address ')
        .lean()
      console.log("Client: ", client)


      if (!client) {
        return res.json({ error: "Client not found" });
      }


      if (userRole === 'client') {
        return res.json({ ClientNames: client, userRole });
      }

      // const filteredClient = [{
      //   ...client[0],
      //   executives: client[0].executives.filter((executive) => executive._id.toString() === executiveId)
      // }];

      client[0].executives = client[0].executives.filter((executive) => executive._id.toString() === executiveId);

      console.log("Filtered Client: ", client);
      return res.json({ ClientNames: client, userRole });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve subcategories" });
    }
  }
}

const ClientController = new Clients();
module.exports = ClientController;



// if (userRole === 'client') {
//   const client = await User.find({ _id: clientId })
//     // .populate('executives')
//     .select("-executives")
//     .lean()
//   console.log("Client: ", client)
//   if (client) {
//     return res.json({ ClientNames: client });
//   }
// } else if (userRole === 'executive') {
//   const client = await User.find({
//     _id: executiveId,
//     role: 'executive'
//   })
//     .populate('clientId', 'name clientName email address')
//     .lean()
//   console.log("Client: ", client)