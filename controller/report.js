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
    const allProducts = await Product.find({}).select("ProductPrice").lean();
    const productPriceMap = new Map(allProducts.map(p => [p._id.toString(), Number(p.ProductPrice)]));

    // Fetch orders
    const orders = await Order.find({}).lean().sort({ createdAt: -1 });

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
        const unitPrice = productPriceMap.get(product.productId.toString()) || 0;

        // Calculate days including both start and end dates
        const totalDays = Math.ceil((endDate - quoteDate) / (24 * 60 * 60 * 1000)) + 1;
        const productTotal = quantity * unitPrice * totalDays * (1-order.discount/100);

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

}

const reportController = new report();
module.exports = reportController;