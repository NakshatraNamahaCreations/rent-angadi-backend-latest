const express = require("express");
const router = express.Router();
const executiveController = require("../controller/executive");
const { clientMiddleware, authorizeRoles, authenticateClient } = require("../middleware/clientMiddleware");
// const { authMiddleware } = require("../middleware/auth");
// const { roleCheck } = require("../middleware/roleCheck");


// Protected routes (require authentication)
// router.use(authMiddleware);

// Routes that require admin role
// router.use("/", roleCheck(['admin']));

router.use(authenticateClient);

router.post("/", authorizeRoles('client'), executiveController.createExecutive);
router.get("/", authorizeRoles('client'), executiveController.getAllExecutives);
router.get("/:id", authorizeRoles('client'), executiveController.getExecutive);
router.put("/:id", authorizeRoles('client'), executiveController.updateExecutive);
router.delete("/:id", authorizeRoles('client'), executiveController.deleteExecutive);

module.exports = router;
