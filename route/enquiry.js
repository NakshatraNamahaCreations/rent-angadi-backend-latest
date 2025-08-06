const express = require("express");
const router = express.Router();
const EnquiryController = require("../controller/enquiry");
const { userMiddleware } = require("../middleware/clientMiddleware");

router.post("/createEnquiry", EnquiryController.createEnquiry);
router.get(
  "/TotalNumberOfEnquiry",
  EnquiryController.getTotalAndTodayEnquiryCount
);
router.get("/getallEnquiry", EnquiryController.allEnquiry);
router.get("/enquiry-details/:id", EnquiryController.getEnquiryById);
router.post("/updatefollowup/:id", EnquiryController.updateenquiryfollowup);
router.get("/my-enquiries/:id", EnquiryController.getMyEnquiries);
router.put("/updatestatus/:id", EnquiryController.updateEnquiry);
router.delete("/deleteEnquiry/:id", EnquiryController.postdeleteEnquiry);
router.get("/getEnquiryaggbyid/:id", EnquiryController.getEnquiryaggredata);
router.post("/add-products", EnquiryController.addProductsToEnquiry);
router.put('/updateenquiries/:id', EnquiryController.updateEnquiries);
router.put('/update-product-data/:id', EnquiryController.updateProductData);
router.delete('/delete-product-data/:id', EnquiryController.deleteProductFromEnquiry);
router.put('/add/:id', EnquiryController.addProductToEnquiry);

module.exports = router;

