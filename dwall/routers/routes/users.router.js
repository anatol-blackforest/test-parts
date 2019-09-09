var express = require('express');
var router = express.Router();
var userServ = require('../../services/userServ.js');
var userServices = new userServ();

router.post("/", userServices.createNewUser);
router.put("/", userServices.updateUser);

router.put("/updatePass", userServices.updatePassword);
router.put("/setFallback", userServices.setFallback);
router.get("/myFallback", userServices.getMyFallback);
router.get("/userData", userServices.getAllUsersData);

router.get("/myLicence", userServices.getLicence);


module.exports = router;

