const mongoose = require("mongoose");
const Order = require("../model/order");
const Product = require("../model/product");
const { parseDate } = require("../utils/dateString");

class report {
  // get all products & orders
  // find how much each product was billed i.e. quanity order * unit price monthwise
  async productReport(req, res) {
    try {
      // Fetch all products with their prices first
      const allProducts = await Product.find({}).select("ProductPrice").lean();
      const productPriceMap = new Map(allProducts.map(p => [p._id.toString(), Number(p.ProductPrice)]));
      const orders = await Order.find({}).lean().sort({ createdAt: -1 });

      // Create a month-wise report object
      const monthWiseReport = {};

      // Process each order
      // orders.filter(order => order._id.toString() === "6856a44e67ce5248a5a4dd7d")
      // .forEach(order => {
      orders.forEach(order => {
        const slot = order.slots[0];
        if (!slot) return;

        // Process each product in the slot
        slot.products.forEach(product => {
          // Get product-specific dates
          const quoteDate = parseDate(product.productQuoteDate);
          const endDate = parseDate(product.productEndDate);

          // Skip if either date is invalid
          if (!quoteDate || !endDate) return;

          const month = quoteDate.getMonth();
          const year = quoteDate.getFullYear();
          const monthKey = `${year}-${month + 1}`;

          if (!monthWiseReport[monthKey]) {
            monthWiseReport[monthKey] = {
              totalRevenue: 0,
              products: new Map()
            };
          }

          const quantity = Number(product.quantity || 0);
          console.log("price: ", productPriceMap.get(product.productId.toString()))
          const unitPrice = productPriceMap.get(product.productId.toString()) || 0;

          // Calculate days including both start and end dates
          const totalDays = Math.ceil((endDate - quoteDate) / (24 * 60 * 60 * 1000)) + 1;
          const productTotal = quantity * unitPrice * totalDays;

          // Update product totals
          if (!monthWiseReport[monthKey].products.has(product.productName)) {
            monthWiseReport[monthKey].products.set(product.productName, {
              productId: product.productId,
              quantity: 0,
              totalRevenue: 0,
              days: 0
            });
          }

          const productStats = monthWiseReport[monthKey].products.get(product.productName);
          productStats.quantity += quantity;
          productStats.totalRevenue += productTotal;
          productStats.days += totalDays;
          monthWiseReport[monthKey].totalRevenue += productTotal;
        });
      });

      // Convert the month-wise report to an array
      const result = Object.entries(monthWiseReport).map(([monthKey, data]) => ({
        month: monthKey,
        totalRevenue: data.totalRevenue,
        products: Array.from(data.products.entries())
          .map(([productName, stats]) => {
            const unitPrice = productPriceMap.get(stats.productId.toString()) || 0;
            return {
              name: productName,
              totalRevenue: stats.totalRevenue,
              price: unitPrice,
              quantity: stats.quantity,
              days: stats.days
            };
          })
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
      }));

      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  }

  async orderReport(req, res) {
    try {
      const orders = await Order.find().lean();

      const result = orders.map(order => {
        const slot = order.slots?.[0];
        const products = slot?.products?.map(p => ({
          productName: p.productName || "Unnamed",
          quantity: p.quantity ?? "N/A"
        })) || [];

        return {
          orderId: order._id,
          products
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /*
  * get order deetails
  * were using price form saved order.product.productPrice
  *   
  */
  async productReportByMonth(req, res) {
    try {
      // Extract month and year from request parameters (e.g., "2025-06")
      const { year, month } = req.body; // Assume you pass year and month like "2025-06"
      console.log(`"year: ", ${year}, " month: ", ${month}`);

      // Ensure year and month are valid
      if (!year || !month || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      // Fetch all products with their prices first
      // const allProducts = await Product.find({}).select("ProductPrice").lean();
      // const productPriceMap = new Map(allProducts.map(p => [p._id.toString(), Number(p.ProductPrice)]));

      // Fetch orders
      const orders = await Order.find({ orderStatus: 'Confirm' }).lean().sort({ createdAt: -1 });
      // const orders = await Order.find({}).lean().sort({ createdAt: -1 });

      // Create a month-wise report object
      const monthWiseReport = {};

      // Process each order
      orders.forEach(order => {
        const slot = order.slots[0];
        if (!slot) return;

        // Process each product in the slot
        slot.products.forEach(product => {
          // Get product-specific dates
          const quoteDate = parseDate(product.productQuoteDate);
          const endDate = parseDate(product.productEndDate);

          // Skip if either date is invalid or if the order is not within the requested month
          if (!quoteDate || !endDate) return;

          const productMonth = quoteDate.getMonth() + 1; // Get month (1-12)
          const productYear = quoteDate.getFullYear();

          // Only include products from the requested month and year
          if (productMonth !== Number(month) || productYear !== Number(year)) return;

          const monthKey = `${productYear}-${productMonth}`;

          if (!monthWiseReport[monthKey]) {
            monthWiseReport[monthKey] = {
              totalRevenue: 0,
              products: new Map()
            };
          }

          const quantity = Number(product.quantity || 0);
          // const unitPrice = productPriceMap.get(product.productId.toString()) || 0;

          // Calculate days including both start and end dates
          const totalDays = Math.ceil((endDate - quoteDate) / (24 * 60 * 60 * 1000)) + 1;
          const productTotal = quantity * product.productPrice * totalDays * (1 - order.discount / 100);
          // console.log(`${product.productName}: `, { totalDays, productTotal, discount: order.discount }, (1 - order.discount / 100))

          // Update product totals
          if (!monthWiseReport[monthKey].products.has(product.productName)) {
            monthWiseReport[monthKey].products.set(product.productName, {
              productId: product.productId,
              quantity: 0,
              totalRevenue: 0,
              days: 0
            });
          }

          const productStats = monthWiseReport[monthKey].products.get(product.productName);
          productStats.quantity += quantity;
          productStats.totalRevenue += productTotal;
          productStats.days += totalDays;
          monthWiseReport[monthKey].totalRevenue += productTotal;
        });
      });

      // Convert the month-wise report to an array
      const result = Object.entries(monthWiseReport).map(([monthKey, data]) => ({
        month: monthKey,
        totalRevenue: data.totalRevenue,
        products: Array.from(data.products.entries())
          .map(([productName, stats]) => {
            // const unitPrice = productPriceMap.get(stats.productId.toString()) || 0;
            return {
              name: productName,
              totalRevenue: stats.totalRevenue,
              // price: stats.productPrice,
              quantity: stats.quantity,
              days: stats.days
            };
          })
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
      }));

      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  }

  async clientReportByMonth(req, res) {
    const { clientIds, year, month } = req.body;
    console.log(`"year: ", ${year}, " month: ", ${month}`, "clientIds:", clientIds);

    try {
      if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      // Convert clientIds to ObjectId array
      const clientIdObjs = clientIds.map(id => new mongoose.Types.ObjectId(id));
      console.log("clientIdObjs:", clientIdObjs);

      // Define month boundaries (UTC) to avoid timezone edge cases
      const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const nextMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      console.log(`monthStart `, monthStart)
      console.log(`nextMonthStart `, nextMonthStart)

      // Fetch orders for the specified clients
      // Fetch orders for the specified clients where slot overlaps the month
      // Overlap condition: slot.quoteDateObj < nextMonthStart AND slot.endDateObj >= monthStart
      const orders = await Order.aggregate([
        {
          $match: {
            orderStatus: "Confirm",
            clientId: { $in: clientIdObjs },
            slots: {
              $elemMatch: {
                quoteDateObj: {
                  $gte: monthStart,
                  $lt: nextMonthStart,
                },
              },
            },
          },
        },
        // ✅ Join payments collection
        {
          $lookup: {
            from: "payments",            // collection name in MongoDB
            localField: "quoteId",       // field in Order
            foreignField: "quotationId", // field in Payments
            as: "payments",
          },
        },
        // {
        //   $project: {
        //     // _id: 1,
        //     // clientId: 1,
        //     // orderDate: 1,
        //     // GrandTotal: 1,
        //     // discount: 1,
        //     // roundOff: 1,
        //     // totalPaid: 1,
        //     payments: 1,
        //   }
        // },
        // ✅ Optionally compute totals
        {
          $addFields: {
            totalPaid: { $sum: "$payments.advancedAmount" }, // sum of all payment amounts
            paymentsCount: { $size: "$payments" },   // number of payments
            paymentMode: { $first: "$payments.paymentMode" },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);


      if (!orders || orders.length === 0) {
        return res.status(200).json({ message: "No orders found for the specified clients" });
      }

      console.log(`orders list: `, orders.map(o => o.payments));

      // Create a month-wise report object
      const monthWiseReport = {
        totalRevenue: 0,
        totalDiscount: 0,
        totalRoundOff: 0,
        totalPayments: 0,
        orders: []
      };
      console.log(`orders[0]: `, orders[0].slots[0].products.map(product => ({
        total: product.total,
        quantity: product.quantity,
        productQuoteDate: product.productQuoteDate,
        productEndDate: product.productEndDate
      })));
      // console.log(`orders: `, orders[1].slots[0].products.map(product => ({
      //   total: product.total,
      //   quantity: product.quantity,
      //   productQuoteDate: product.productQuoteDate,
      //   productEndDate: product.productEndDate
      // })));

      // Process each order
      orders.forEach(order => {
        const slot = order.slots[0];
        if (!slot) return;

        // Get order dates
        const quoteDate = slot.quoteDateObj;
        const endDate = slot.endDateObj;

        // Skip if either date is invalid
        if (!quoteDate || !endDate) return;

        // const allProducts = await Product.find({}).select("ProductPrice").lean();
        // const productPriceMap = new Map(allProducts.map(p => [p._id.toString(), Number(p.ProductPrice)]));
        const allProductsTotal = slot.products.reduce((total, product) => total + Number(product.total || 0), 0);
        console.log(`allProductsTotal: `, allProductsTotal);

        // Calculate total for this order
        const orderTotal = order.GrandTotal || 0;
        console.log(`order.GrandTotal orderTotal ${order._id}: `, order.GrandTotal);
        const discount = order.discount || 0;
        const discountAmount = allProductsTotal * (Number(discount || 0) / 100)
        console.log(`discountAmount: `, discountAmount);
        const roundOff = order.roundOff || 0;

        // Add to month totals        
        monthWiseReport.totalRevenue += orderTotal;
        monthWiseReport.totalDiscount += discountAmount;
        monthWiseReport.totalRoundOff += roundOff;
        monthWiseReport.totalPayments += order.totalPaid || 0;

        // Add order details to the report
        monthWiseReport.orders.push({
          orderId: order._id,
          clientId: order.clientId,
          executiveName: order.executivename,
          Address: order.Address,
          orderDate: quoteDate,
          allProductsTotal,
          discountAmount,
          totalAmount: orderTotal,
          roundOff,
          netAmount: orderTotal - discountAmount,
          totalPaid: order.totalPaid || 0,
          payments: order.payments.map(p => ({
            paymentId: p._id,
            amount: p.advancedAmount,
            mode: p.paymentMode,
            remarks: p.paymentRemarks,
            comment: p.comment,
            // status: p.status,
            date: p.createdAt,
          })),
          products: slot.products.map(product => ({
            productId: product.productId,
            productName: product.productName,
            quantity: Number(product.quantity || 0),
            price: Number(product.total || 0),
            days: Math.ceil((parseDate(product.productEndDate) - parseDate(product.productQuoteDate)) / (24 * 60 * 60 * 1000)) + 1
          }))
        });
      });

      // Sort orders by date
      monthWiseReport.orders.sort((a, b) => b.orderDate - a.orderDate);

      console.log(`monthWiseReport: `, monthWiseReport);

      return res.status(200).json({
        month: `${year}-${month}`,
        ...monthWiseReport
      });
    } catch (error) {
      console.error("Error generating client report:", error);
      return res.status(500).json({ error: "Failed to generate client report" });
    }
  }




  async productReportDates(req, res) {
    try {
      const { fromDate, toDate } = req.query;

      console.log(`fromDate: ${fromDate}, toDate: ${toDate}`);

      // Validate input
      if (!fromDate || !toDate) {
        return res.status(400).json({ message: "fromDate and toDate are required." });
      }

      // Convert to Date objects
      const start = new Date(fromDate);
      const end = new Date(toDate);

      console.log(`Parsed Dates - start: ${start.toISOString()}, end: ${end.toISOString()}`);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      if (end < start) {
        return res.status(400).json({ message: "fromDate cannot be after toDate." });
      }

      // ✅ Fetch all confirmed orders that have at least one slot within the range
      const orders = await Order.find({
        orderStatus: "Confirm",
        // "slots.quoteDateObj": { $gte: start, $lte: end },
        slots: {
          $elemMatch: {
            $and: [
              { quoteDateObj: { $lte: end } },  // slot starts before range ends
              { endDateObj: { $gte: start } },  // slot ends after range starts
            ],
          },
        },

      })
        .lean()
        .sort({ "slots.quoteDateObj": -1 });

      console.log(`orders: ${orders.length}`);
      console.log(`orders: ${orders.map(o => o._id)}`);

      const report = {
        totalRevenue: 0,
        products: new Map(),
      };

      // ✅ Loop through orders
      orders.forEach((order) => {
        order.slots?.forEach((slot) => {
          if (!slot.quoteDateObj || !slot.endDateObj) return;

          const slotStart = new Date(slot.quoteDateObj);
          const slotEnd = new Date(slot.endDateObj);

          // ✅ include slot if it overlaps the selected date range
          const overlaps =
            slotStart <= end && slotEnd >= start;
          if (!overlaps) return;

          slot.products?.forEach((product) => {
            const quoteDateP = parseDate(product.productQuoteDate);
            const endDateP = parseDate(product.productEndDate);
            if (!quoteDateP || !endDateP) return;

            const totalDays =
              Math.ceil((endDateP - quoteDateP) / (24 * 60 * 60 * 1000)) + 1;

            const quantity = Number(product.quantity || 0);
            const price = Number(product.productPrice || 0);
            const discount = Number(order.discount || 0);

            const total =
              quantity * price * totalDays * (1 - discount / 100);

            if (!report.products.has(product.productName)) {
              report.products.set(product.productName, {
                productId: product.productId,
                totalRevenue: 0,
                quantity: 0,
                totalDays: 0,
              });
            }

            const stats = report.products.get(product.productName);
            stats.quantity += quantity;
            stats.totalRevenue += total;
            stats.totalDays += totalDays;

            report.totalRevenue += total;
          });
        });
      });

      // ✅ Format final response
      const finalReport = {
        fromDate,
        toDate,
        totalRevenue: report.totalRevenue,
        totalProducts: report.products.size,
        products: Array.from(report.products.entries())
          .map(([name, stats]) => ({
            name,
            // productId: stats.productId,
            totalRevenue: stats.totalRevenue,
            // quantity: stats.quantity,
            // totalDays: stats.totalDays,
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue),
      };

      return res.status(200).json(finalReport);
    } catch (error) {
      console.error("Error in productReportByMonth:", error);
      return res.status(500).json({
        message: "Internal server error.",
        error: error.message,
      });
    }
  }












}

const reportController = new report();
module.exports = reportController;