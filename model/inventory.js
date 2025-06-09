const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    ref: "Product",
    required: true,
  },
  startdate: {
    type: String,
    required: true,
  },
  enddate: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  // slot: {
  //   type: String,
  //   required: true,
  // },
  reservedQty: {
    type: Number,
    default: 0,
  },
  availableQty: {
    type: Number,
    required: true,
  },
});

// InventorySchema.virtual('startDateObj').get(function () {
//   const [day, month, year] = this.startdate.split('-');
//   return new Date(`${year}-${month}-${day}`);
// });

// // Virtual for endDate (converted to Date object)
// InventorySchema.virtual('endDateObj').get(function () {
//   const [day, month, year] = this.enddate.split('-');
//   return new Date(`${year}-${month}-${day}`);
// });


const Inventory = mongoose.model("Inventory", InventorySchema);
module.exports = Inventory;
