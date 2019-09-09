var express = require('express');
var router = express.Router();
var licenseService = require('../../services/licenses.service');

//router.post("/", licenseService.createLicense);
router.get("/", licenseService.getAllLicenses);
router.get("/:id", licenseService.getLicenseById);
//router.patch("/:id", licenseService.updateLicense);
//router.delete("/:id", licenseService.removeLicense);

module.exports = router;