const express = require("express");
const router = express.Router();
const ClientController = require("../controller/clients");
const { userMiddleware, authenticateClient, authorizeRoles } = require("../middleware/clientMiddleware");


router.post("/addClients", ClientController.createClients);
router.get("/getallClients", ClientController.getallClients);
router.get("/TotalNumberOfClients", ClientController.getTotalNumberOfClients);
router.get("/getallClientsNames", ClientController.getClientsNames);
router.post("/getClientsGrandTotal", ClientController.getClientsGrandTotal);
router.delete("/deleteClients/:id", ClientController.deleteClients);
router.post("/clientlogin", ClientController.clientlogin);

router.put(
  "/editClient/:id",
  ClientController.editClients
);


router.get("/getCurrentClientName", userMiddleware, ClientController.getCurrentClientName);

module.exports = router;
