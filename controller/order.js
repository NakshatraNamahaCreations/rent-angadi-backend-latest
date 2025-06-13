const ordermodel = require("../model/order");
const ProductManagementModel = require("../model/product");
const InventoryModel = require("../model/inventory");
const mongoose = require("mongoose");
const { parseDate } = require("../utils/dateString");
const Order = require("../model/order");

class order {
  async postaddorder(req, res) {
    const {
      quoteId,
      slots,
      ClientId,
      clientName,
      clientNo,
      executivename,
      Address,
      GrandTotal,
      paymentStatus,
      orderStatus,
      labourecharge,
      transportcharge,
      GST,
      discount,
      placeaddress,
      adjustments,
      products,
    } = req.body;

    try {
      // const startDate = '09-06-2025'
      // const endDate = '12-06-2025'

      // const start = parseDate(startDate.trim());
      // const end = parseDate(endDate.trim());
      // const productId = "67cfe7e5998cc252e7dfc148"
      // let inventory = await InventoryModel.find({
      //   productId: productId,
      //   startdate: start,
      //   enddate: end
      // });
      // console.log(`Hello `);
      // const k = await InventoryModel.find({ productId: '67cfe7e5998cc252e7dfc148' });
      // console.log(`k: `, k);


      // Iterate through slots
      for (const slot of slots) {
        const { products, quoteDate, endDate } = slot;

        // Convert quoteDate and endDate to Date objects
        const start = parseDate(quoteDate.trim());
        const end = parseDate(endDate.trim());

        console.log("start: ", start)
        console.log("end: ", end)

        // Validate date range
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            message: "Invalid start date or end date provided."
          });
        }

        for (const product of products) {
          const { productId, quantity, productName } = product;

          // Validate product fields
          if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
              message: `Invalid product details for "${productName}".`,
            });
          }

          const inventory = await InventoryModel.find({ productId });

          // Step 2: Check for overlapping date ranges
          const overlappingInventory = inventory.filter(item => {
            // Convert startdate and enddate from strings (e.g., 'DD-MM-YYYY') to Date objects
            const inventoryStartDate = parseDate(item.startdate);
            const inventoryEndDate = parseDate(item.enddate);

            // Check if there's an overlap
            return inventoryStartDate <= end && inventoryEndDate >= start;
          });

          // Calculate total reserved quantity
          const totalReserved = overlappingInventory.reduce(
            (sum, item) => sum + item.reservedQty,
            0
          );

          const existingInventory = inventory.find(item =>
            item.productId === productId &&
            item.startdate === quoteDate &&
            item.enddate === endDate
          );

          // console.log("existingInventory", existingInventory);
          const findProd = await ProductManagementModel.findById(productId)
          // console.log("findProd", findProd);
          // Fetch product stock if inventory entry does not exist
          const globalStock = existingInventory
            ? existingInventory.availableQty
            : (await ProductManagementModel.findById(productId)).ProductStock;

          console.log(`globalstock ${product.productName} wth ${product.productId}: `, globalStock);

          // Check stock availability
          if (globalStock < quantity) {
            return res.status(400).json({
              message: `Insufficient stock for "${productName}" on ${quoteDate}.`,
            });
          }

          // Update or create inventory entry
          if (existingInventory) {
            existingInventory.reservedQty += quantity;
            existingInventory.availableQty -= quantity;
            await existingInventory.save();
          } else {
            const inventory = new InventoryModel({
              productId,
              startdate: quoteDate,
              enddate: endDate,
              reservedQty: quantity,
              availableQty: globalStock - quantity,
            });
            await inventory.save();
          }


          // Update global product stock
          // const productData = await ProductManagementModel.findById(productId);
          // if (!productData) {
          //   return res.status(404).json({ message: `Product with ID "${productId}" not found.` });
          // }
          // productData.ProductStock -= quantity;
          // productData.StockSold += quantity;
          // await productData.save();
        }
      }

      // Create the order after inventory updates
      const newOrder = new ordermodel({
        quoteId,
        ClientId,
        clientName,
        clientNo,
        executivename,
        slots,
        Address,
        GrandTotal,
        paymentStatus,
        orderStatus,
        labourecharge,
        transportcharge,
        GST,
        discount,
        placeaddress,
        adjustments,
        products,
      });

      const savedOrder = await newOrder.save();

      res.status(201).json({
        message: "Order created successfully and inventory updated.",
        order: savedOrder,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        message: "Failed to create order and update inventory.",
        error: error.message,
      });
    }
  }

  async updateOrder(req, res) {
    const {
      quoteId,
      orderId,
      slots,
      ClientId,
      clientName,
      clientNo,
      executivename,
      Address,
      GrandTotal,
      paymentStatus,
      orderStatus,
      labourecharge,
      transportcharge,
      GST,
      discount,
      placeaddress,
      adjustments,
      products,
    } = req.body;

    try {
      // Iterate through slots
      for (const slot of slots) {
        const { products, quoteDate, endDate } = slot;

        // Convert quoteDate and endDate to Date objects
        const start = parseDate(quoteDate.trim());
        const end = parseDate(endDate.trim());

        // Validate date range
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            message: "Invalid start date or end date provided."
          });
        }

        for (const product of products) {
          const { productId, quantity, productName } = product;

          // Validate product fields
          if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
              message: `Invalid product details for "${productName, quoteDate, endDate}".`,
            });
          }

          const existingQuotation = await Quotation.find({ quoteId });
          if (!existingQuotation) {
            return res.status(400).json({
              message: `Quotation does not exist`,
            });
          }

          // check if inventory exists
          const existingOrder = await Order.find({ id: orderId });
          if (!existingOrder) {
            return res.status(400).json({
              message: `Order does not exist`,
            });
          }

          const existingInventory = await InventoryModel.find({
            productId,
            startdate: quoteDate,
            enddate: endDate
          });
          if (existingInventory) {
            return res.status(400).json({
              message: `inventory does not exist`,
            });
          }

          // Fetch product stock if inventory entry does not exist
          const globalStock = existingInventory.availableQty

          // Check stock availability
          if (globalStock < quantity) {
            return res.status(400).json({
              message: `Insufficient stock for "${productName}" on ${quoteDate}.`,
            });
          }

          // Update or create inventory entry          
          existingInventory.reservedQty += quantity;
          existingInventory.availableQty -= quantity;
          await existingInventory.save();
        }
      }

      updatedOrder.products = [...updatedOrder.products, ...products]
      updatedOrder.GrandTotal = GrandTotal;
      updatedOrder.GST = GST;
      updatedOrder.discount = discount;
      updatedOrder.adjustments = adjustments;
      updatedOrder.labourecharge = labourecharge;
      updatedOrder.transportcharge = transportcharge;


      await updatedOrder.save();

      res.status(201).json({
        message: "Order created successfully and inventory updated.",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        message: "Failed to create order and update inventory.",
        error: error.message,
      });
    }
  }

  async getTotalNumberOfOrder(req, res) {
    try {
      // Get the current date and set the time to the start of the day
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Get the current date and set the time to the end of the day
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Count the total number of documents
      let totalorderCount = await ordermodel.countDocuments({});

      // Count the number of documents created today
      let todayorderCount = await ordermodel.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });

      return res.json({
        totalorderCount: totalorderCount,
        todayorderCount: todayorderCount,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve quotation counts" });
    }
  }

  async getallorders(req, res) {
    try {
      let data = await ordermodel.find({}).sort({ _id: -1 });
      // console.log(data,"Data nhi")
      if (data) {
        return res.json({ orderData: data });
      } else {
        return res.status(404).json({ error: "No orders found" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
  }

  async getOrderById(req, res) {
    const { id } = req.params; // Get the order ID from the route params
    console.log("id: ", id)

    try {
      // // Find the order by its ID
      // const order = await Order.findById(id)
      //   .populate('clientId') // Optionally, populate related fields if needed (e.g., client details)
      //   .populate('products.productId') // Optionally, populate product details if needed
      //   .exec();
      const order = await Order.findById(id)

      // If no order found, return a 404 response
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      // Return the found order as a response
      return res.status(200).json({ order });
    } catch (error) {
      // Handle errors (e.g., invalid ObjectId format, database issues)
      console.error(error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
  };

  async findanddelete(req, res) {
    try {
      let data = await ordermodel.find({ phone });
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve " });
    }
  }

  async getfindwithClientID(req, res) {
    try {
      const id = req.params.id;
      let data = await ordermodel.find({ ClientId: id }).sort({ _id: -1 });
      if (data) {
        return res.json({ orderData: data });
      } else {
        return res.status(404).json({ error: "No orders found" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
  }

  async getApprovedOrders(req, res) {
    try {
      const data = await ordermodel
        .find({ orderStatus: { $in: ["Approved", "Delivered", "Returned"] } })
        .sort({ _id: -1 });

      if (data.length > 0) {
        return res.json({ orderData: data });
      } else {
        return res.status(404).json({ error: "No orders found" });
      }
    } catch (error) {
      console.error("Error retrieving orders:", error); // Log the error for debugging
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
  }

  async updateStatus(req, res) {
    try {
      const id = req.params.id; // Extract the order ID from the URL
      const { orderStatus } = req.body; // Extract orderStatus from the request body

      // Log received data for debugging
      console.log("Order ID:", id);
      console.log("New Order Status:", orderStatus);

      if (!id) {
        return res.status(400).json({ error: "Order ID is required" });
      }

      if (!orderStatus) {
        return res.status(400).json({ error: "Order status is required" });
      }

      // Perform the update operation
      const orderDetails = await ordermodel.findOneAndUpdate(
        { _id: id }, // Query condition: Match by ID
        { orderStatus }, // Update operation: Set new status
        { new: true } // Return the updated document
      );

      if (orderDetails) {
        return res.status(200).json({
          success: true,
          message: "Order status updated successfully",
          orderDetails,
        });
      } else {
        return res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async refurbishment(req, res) {
    try {
      const { id } = req.params;
      const {
        productrefurbishment,
        damagerefurbishment,
        shippingaddressrefurbishment,
        expense,
        floormanager,
      } = req.body;
      const existingRefurbishment = await ordermodel.findById(id);
      if (!existingRefurbishment) {
        return res.status(404).json({ message: "Refurbishment not found" });
      }
      const updatedData = {
        productrefurbishment:
          productrefurbishment || existingRefurbishment.productrefurbishment,
        damagerefurbishment:
          damagerefurbishment || existingRefurbishment.damagerefurbishment,
        shippingaddressrefurbishment:
          shippingaddressrefurbishment ||
          existingRefurbishment.shippingaddressrefurbishment,
        expense: expense || existingRefurbishment.expense,
        floormanager: floormanager || existingRefurbishment.floormanager,
      };
      const updatedRefurbishment = await ordermodel.findByIdAndUpdate(
        id,
        updatedData,
        { new: true }
      );
      if (!updatedRefurbishment) {
        return res.status(404).json({ message: "Refurbishment not found" });
      }
      return res.status(200).json({
        message: "Refurbishment updated successfully",
        data: updatedRefurbishment,
      });
    } catch (error) {
      console.error("Error updating refurbishment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // product sales
  async getHighestAndLowestProductSales(req, res) {
    try {
      const productSales = await ProductManagementModel.aggregate([
        {
          $lookup: {
            from: "orders", // Join with the orders collection
            localField: "_id", // Match Product _id
            foreignField: "products.productId", // Match productId in orders
            as: "orderDetails",
          },
        },
        {
          $unwind: {
            path: "$orderDetails",
            preserveNullAndEmptyArrays: true, // Include products with no orders
          },
        },
        {
          $unwind: {
            path: "$orderDetails.products",
            preserveNullAndEmptyArrays: true, // Include products with no matching sales
          },
        },
        {
          $match: {
            $expr: { $eq: ["$orderDetails.products.productId", "$_id"] }, // Match product IDs
          },
        },
        {
          $group: {
            _id: "$_id", // Group by ProductId
            productName: { $first: "$ProductName" }, // Product name from the product collection
            totalSales: {
              $sum: {
                $cond: [
                  { $ifNull: ["$orderDetails.products.quantity", false] }, // Check if quantity exists
                  "$orderDetails.products.quantity", // Sum quantities
                  0, // If no sales, set to 0
                ],
              },
            },
          },
        },
        { $sort: { totalSales: -1 } }, // Sort by total sales descending
        { $limit: 5 }, // Limit to top 5 products
      ]);

      res.status(200).json({
        success: true,
        topProducts: productSales,
      });
    } catch (error) {
      console.error("Error calculating product sales:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // async getHighestAndLowestProductSales(req, res) {
  //   try {
  //     const productSales = await ProductManagementModel.aggregate([
  //       {
  //         $lookup: {
  //           from: "orders", // Join with the orders collection
  //           localField: "_id", // Match ProductId in products
  //           foreignField: "products.ProductId", // Match ProductId in orders
  //           as: "orderDetails",
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: "$orderDetails",
  //           preserveNullAndEmptyArrays: true, // Include products with no orders
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: "$orderDetails.products",
  //           preserveNullAndEmptyArrays: true, // Include products with no matching sales
  //         },
  //       },
  //       {
  //         $match: {
  //           $expr: { $eq: ["$orderDetails.products.ProductId", "$_id"] }, // Match product IDs
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: "$_id", // Group by ProductId
  //           productName: { $first: "$ProductName" }, // Product name from the product collection
  //           totalSales: {
  //             $sum: {
  //               $cond: [
  //                 { $ifNull: ["$orderDetails.products.qty", false] },
  //                 "$orderDetails.products.qty",
  //                 0, // If no sales, set to 0
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       { $sort: { totalSales: -1 } }, // Sort by total sales descending
  //       { $limit: 5 }, // Limit to top 5 products
  //     ]);

  //     res.status(200).json({
  //       success: true,
  //       topProducts: productSales,
  //     });
  //   } catch (error) {
  //     console.error("Error calculating product sales:", error);
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // }

  // category sales

  async getCategorySales(req, res) {
    try {
      const categorySales = await ProductManagementModel.aggregate([
        {
          $lookup: {
            from: "orders", // Join with orders collection
            localField: "_id", // Match Product _id
            foreignField: "products.productId", // Match productId in orders
            as: "orderDetails",
          },
        },
        {
          $unwind: {
            path: "$orderDetails",
            preserveNullAndEmptyArrays: true, // Include products with no orders
          },
        },
        {
          $unwind: {
            path: "$orderDetails.products",
            preserveNullAndEmptyArrays: true, // Include products with no matching sales
          },
        },
        {
          $match: {
            $expr: { $eq: ["$orderDetails.products.productId", "$_id"] }, // Match product IDs
          },
        },
        {
          $group: {
            _id: "$ProductCategory", // Group by ProductCategory
            totalSales: {
              $sum: {
                $cond: [
                  { $ifNull: ["$orderDetails.products.quantity", false] }, // Check if quantity exists
                  "$orderDetails.products.quantity", // Sum quantities
                  0, // If no quantity, add 0
                ],
              },
            },
          },
        },
        { $sort: { totalSales: -1 } }, // Sort categories by total sales descending
        {
          $project: {
            categoryName: "$_id", // Rename _id to categoryName
            totalSales: 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        categorySales,
      });
    } catch (error) {
      console.error("Error calculating category sales:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getHighestAndLowestProductSalesdate(req, res) {
    try {
      const { fromDate, toDate } = req.query;

      // Ensure `fromDate` and `toDate` are provided
      if (!fromDate || !toDate) {
        return res
          .status(400)
          .json({ error: "fromDate and toDate are required" });
      }

      const productSales = await ProductManagementModel.aggregate([
        {
          $lookup: {
            from: "orders", // Join with the orders collection
            localField: "_id", // Match ProductId in products
            foreignField: "products.ProductId", // Match ProductId in orders
            as: "orderDetails",
          },
        },
        {
          $unwind: {
            path: "$orderDetails",
            preserveNullAndEmptyArrays: true, // Include products with no orders
          },
        },
        {
          $unwind: {
            path: "$orderDetails.products",
            preserveNullAndEmptyArrays: true, // Include products with no matching sales
          },
        },
        {
          $match: {
            $and: [
              { $expr: { $eq: ["$orderDetails.products.ProductId", "$_id"] } }, // Match product IDs
              {
                $expr: {
                  $and: [
                    { $gte: ["$orderDetails.startDate", new Date(fromDate)] }, // Filter by fromDate
                    { $lte: ["$orderDetails.startDate", new Date(toDate)] }, // Filter by toDate
                  ],
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$_id", // Group by ProductId
            productName: { $first: "$ProductName" }, // Product name from the product collection
            totalSales: {
              $sum: {
                $cond: [
                  { $ifNull: ["$orderDetails.products.qty", false] },
                  "$orderDetails.products.qty",
                  0, // If no sales, set to 0
                ],
              },
            },
          },
        },
        { $sort: { totalSales: -1 } }, // Sort by total sales descending
        { $limit: 5 }, // Limit to top 5 products
      ]);

      res.status(200).json({
        success: true,
        topProducts: productSales,
      });
    } catch (error) {
      console.error("Error calculating product sales:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getProductSalesData(req, res) {
    try {
      const { productId } = req.params;
      console.log("ProductId received:", productId);

      // Validate productId format
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Invalid ProductId format" });
      }

      // Convert productId to ObjectId
      const ObjectId = mongoose.Types.ObjectId;
      const productObjectId = new ObjectId(productId);

      const productSales = await ordermodel.aggregate([
        {
          $unwind: {
            path: "$products", // Decompose products array
            preserveNullAndEmptyArrays: true, // Prevent removal of orders with no products
          },
        },
        {
          $match: {
            "products.productId": productObjectId, // Match the productId field
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } }, // Group by startDate
            totalSales: { $sum: "$products.quantity" }, // Sum quantities sold
          },
        },
        { $sort: { _id: 1 } }, // Sort by date in ascending order
      ]);

      // Format data for response
      const formattedData = productSales.map((item) => ({
        date: item._id,
        totalSales: item.totalSales,
      }));

      res.status(200).json({
        success: true,
        data: formattedData,
      });
    } catch (error) {
      console.error("Error fetching product sales data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // cancelation product
  // async cancelOrder(req, res) {
  //   const { orderId } = req.body;
  //   console.log(orderId, "orderId");

  //   try {
  //     const order = await ordermodel.findById(orderId);
  //     if (!order) return res.status(404).json({ error: "Order not found" });

  //     const { slots = [] } = order;

  //     for (const slot of slots) {
  //       const { slotName, quoteDate, endDate, products = [] } = slot;

  //       for (const product of products) {
  //         const { productId, quantity } = product;

  //         // Update the inventory
  //         const inventory = await InventoryModel.findOne({
  //           productId,
  //           slot: slotName,
  //           startdate: quoteDate,
  //           enddate: endDate,
  //         });

  //         if (inventory) {
  //           inventory.reservedQty -= quantity;
  //           inventory.availableQty += quantity;

  //           // Ensure values are not negative
  //           inventory.reservedQty = Math.max(0, inventory.reservedQty);
  //           inventory.availableQty = Math.max(0, inventory.availableQty);

  //           await inventory.save();
  //         } else {
  //           console.warn("Inventory not found for:", {
  //             productId,
  //             slot: slotName,
  //             startdate: quoteDate,
  //             enddate: endDate,
  //           });
  //         }
  //       }
  //     }

  //     // Mark the order as cancelled
  //     order.orderStatus = "cancelled";
  //     await order.save();

  //     return res
  //       .status(200)
  //       .json({ message: "Order cancelled and inventory updated." ,});
  //   } catch (err) {
  //     console.error("Error cancelling order:", err);
  //     return res.status(500).json({ error: "Internal server error" });
  //   }
  // }
  // async cancelOrder(req, res) {
  //   const { orderId } = req.body;
  //   console.log("Received Order ID for Cancellation:", orderId);

  //   try {
  //     const order = await ordermodel.findById(orderId);
  //     if (!order) {
  //       console.error("❌ Order not found for ID:", orderId);
  //       return res.status(404).json({ error: "Order not found" });
  //     }

  //     console.log("✅ Found Order:");
  //     console.log("Client:", order.clientName);
  //     console.log("Slots:", order.slots.length);

  //     const { slots = [] } = order;

  //     for (const slot of slots) {
  //       console.log(`\n🔄 Processing Slot: ${slot.slotName}`);
  //       console.log("Start Date:", slot.quoteDate);
  //       console.log("End Date:", slot.endDate);
  //       console.log("Products in this slot:", slot.products.length);

  //       for (const product of slot.products) {
  //         const { productId, quantity } = product;

  //         console.log(`➡️ Updating inventory for Product ID: ${productId}`);
  //         console.log("Quantity to return:", quantity);

  //         const inventory = await InventoryModel.findOne({
  //           productId,
  //           slot: slot.slotName,
  //           startdate: slot.quoteDate,
  //           enddate: slot.endDate,
  //         });

  //         if (inventory) {
  //           console.log("✅ Found Inventory Before Update:", {
  //             reservedQty: inventory.reservedQty,
  //             availableQty: inventory.availableQty,
  //           });

  //           inventory.reservedQty = Math.max(
  //             0,
  //             inventory.reservedQty - quantity
  //           );
  //           inventory.availableQty = Math.max(
  //             0,
  //             inventory.availableQty + quantity
  //           );

  //           await inventory.save();

  //           console.log("✅ Inventory Updated:", {
  //             reservedQty: inventory.reservedQty,
  //             availableQty: inventory.availableQty,
  //           });
  //         } else {
  //           console.warn("⚠️ Inventory record not found for:", {
  //             productId,
  //             slot: slot.slotName,
  //             startdate: slot.quoteDate,
  //             enddate: slot.endDate,
  //           });
  //         }
  //       }
  //     }

  //     // Mark the order as cancelled
  //     order.orderStatus = "cancelled";
  //     await order.save();
  //     console.log("✅ Order status updated to 'cancelled'");

  //     return res.status(200).json({
  //       message: "Order cancelled and inventory updated.",
  //     });
  //   } catch (err) {
  //     console.error("🔥 Error cancelling order:", err);
  //     return res.status(500).json({ error: "Internal server error" });
  //   }
  // }

  async cancelOrder(req, res) {
    const { orderId } = req.body;
    console.log("Received Order ID for Cancellation:", orderId);

    try {
      const order = await ordermodel.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get all slots from the order
      const slots = order.slots || [];

      // Update inventory for each slot
      for (const slot of slots) {
        const { products, quoteDate, endDate } = slot;

        // Loop through each product in the slot
        for (const product of products) {
          const { productId, quantity } = product;

          // Find and update the inventory entry
          const inventory = await InventoryModel.findOne({
            productId,
            startdate: quoteDate,
            enddate: endDate,
          });

          if (inventory) {
            // Release the reserved quantity back to available
            inventory.availableQty += quantity;
            inventory.reservedQty -= quantity;
            await inventory.save();
          }
        }
      }

      // Update order status to cancelled
      order.orderStatus = "cancelled";
      await order.save();

      return res.status(200).json({
        message: "Order cancelled and inventory updated.",
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

const orderController = new order();
module.exports = orderController;
