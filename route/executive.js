const express = require("express");
const router = express.Router();
const executiveController = require("../controller/executive");
const userMiddleware = require("../middleware/auth");
// const { authMiddleware } = require("../middleware/auth");
// const { roleCheck } = require("../middleware/roleCheck");


// Protected routes (require authentication)
// router.use(authMiddleware);

// Routes that require admin role
// router.use("/", roleCheck(['admin']));

router.post("/", userMiddleware, executiveController.createExecutive);
router.get("/", executiveController.getAllExecutives);
router.get("/:id", executiveController.getExecutive);
router.put("/:id", executiveController.updateExecutive);
router.delete("/:id", executiveController.deleteExecutive);

module.exports = router;
