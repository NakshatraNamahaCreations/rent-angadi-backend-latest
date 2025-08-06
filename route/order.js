const express = require("express");
const router = express.Router();
const orderController = require("../controller/order");
const { userMiddleware } = require("../middleware/clientMiddleware");

router.post("/postaddorder", orderController.postaddorder);
router.get("/getallorder", orderController.getallorders);
router.get("/my-orders/:id", orderController.getMyOrders);
router.get("/my-orders-token", userMiddleware, orderController.getMyOrdersToken);
router.get("/getOrder/:id", orderController.getOrderById);
router.get("/getApprovedData", orderController.getApprovedOrders);
router.get("/TotalNumberOfOrder", orderController.getTotalNumberOfOrder);
router.get("/findwithclientid/:id", orderController.getfindwithClientID);
router.put("/updateOrderById/:id", orderController.updateOrderById);
router.put("/updateExistingOrderById/:id", orderController.updateExistingOrderById);
router.put("/addNewProductToOrderById/:id", orderController.addNewProductToOrderById);
router.put("/updateOrderFields", orderController.updateOrderFields);
router.delete("/deleteProductInOrderById/:id", orderController.deleteProductInOrderById);
router.put("/updateStatus/:id", orderController.updateStatus);
router.put("/refurbishment/:id", orderController.refurbishment);
router.get(
  "/products/sales/highest-lowest",
  orderController.getHighestAndLowestProductSales
);
router.get("/category/sales/highest-lowest", orderController.getCategorySales);
router.get(
  "/products/sales/highest-lowest/date",
  orderController.getHighestAndLowestProductSalesdate
);
router.get(
  "/products/sales/individual/:productId",
  orderController.getProductSalesData
);

// order
router.post("/cancel-slot", orderController.cancelOrder);

router.get("/invoice", orderController.invoiceId)

module.exports = router;
