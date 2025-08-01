const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  clientId: {
    type: mongoose.Types.ObjectId,
  },
  roles: {
    superAdmin: {
      type: Boolean,
      default: false,
    },
    admin: {
      type: Boolean,
      default: false,
    },
    adminRights: {
      type: Boolean,
      default: false,
    },
    master: {
      type: Boolean,
      default: false,
    },
    banner: {
      type: Boolean,
      required: false,
    },
    dashboard: {
      type: Boolean,
      default: false,
    },
    master: {
      type: Boolean,
      default: false,
    },
    banner: {
      type: Boolean,
      default: false,
    },
    productManagement: {
      type: Boolean,
      default: false,
    },
    clients: {
      type: Boolean,
      default: false,
    },
    executiveManagement: {
      type: Boolean,
      default: false,
    },
    addNewEnquiry: {
      type: Boolean,
      default: false,
    },
    myOrders: {
      type: Boolean,
      default: false,
    },
    enquiryList: {
      type: Boolean,
      default: false,
    },
    enquiryCalendar: {
      type: Boolean,
      default: false,
    },
    quotation: {
      type: Boolean,
      default: false,
    },
    orders: {
      type: Boolean,
      default: false,
    },
    termsAndConditions: {
      type: Boolean,
      default: false,
    },
    paymentReport: {
      type: Boolean,
      default: false,
    },
    refurbishmentReport: {
      type: Boolean,
      default: false,
    },
    inventoryProductList: {
      type: Boolean,
      default: false,
    },
    reports: {
      type: Boolean,
      default: false,
    },
    damagedAndLost: {
      type: Boolean,
      default: false,
    },
  },
});

const AdminModel = mongoose.model("admin", adminSchema);
module.exports = AdminModel;
