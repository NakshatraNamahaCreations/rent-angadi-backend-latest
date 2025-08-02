const express = require("express");
const router = express.Router();
const executiveController = require("../controller/executive");
const { clientMiddleware } = require("../middleware/clientMiddleware");
// const { authMiddleware } = require("../middleware/auth");
// const { roleCheck } = require("../middleware/roleCheck");


// Protected routes (require authentication)
// router.use(authMiddleware);

// Routes that require admin role
// router.use("/", roleCheck(['admin']));

router.post("/", clientMiddleware, executiveController.createExecutive);
router.get("/", clientMiddleware, executiveController.getAllExecutives);
router.get("/:id", clientMiddleware, executiveController.getExecutive);
router.put("/:id", clientMiddleware, executiveController.updateExecutive);
router.delete("/:id", clientMiddleware, executiveController.deleteExecutive);

module.exports = router;
