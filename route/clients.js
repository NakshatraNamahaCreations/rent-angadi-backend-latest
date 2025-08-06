const express = require("express");
const router = express.Router();
const ClientController = require("../controller/clients");
const { userMiddleware, authenticateClient, authorizeRoles } = require("../middleware/clientMiddleware");
const { superAdminMiddleware } = require("../middleware/superAdminMiddleware");


router.post("/addClients", ClientController.createClients);
router.get("/getallClients", ClientController.getallClients);
router.get("/TotalNumberOfClients", ClientController.getTotalNumberOfClients);
router.get("/getallClientsNames", ClientController.getClientsNames);
router.post("/getClientsGrandTotal", ClientController.getClientsGrandTotal);
router.delete("/deleteClient/:id", superAdminMiddleware, ClientController.deleteClients);
router.post("/clientlogin", ClientController.clientlogin);

router.put("/editClient/:id", ClientController.editClients);
router.get("/getCurrentClientName", ClientController.getCurrentClientName);
router.get("/getCurrentClientNameToken", userMiddleware, ClientController.getCurrentClientNameToken);

module.exports = router;
