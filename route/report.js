const express = require("express");
const reportController = require("../controller/report");


const router = express.Router();

router.get("/productsReport", reportController.productReport);
router.post("/productReportByMonth", reportController.productReportByMonth);

module.exports = router;