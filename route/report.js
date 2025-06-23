const express = require("express");
const reportController = require("../controller/report");


const router = express.Router();

router.get("/productsReport", reportController.productReport);

module.exports = router;