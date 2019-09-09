var express = require('express');
var router = express.Router();
var contactServ = require('../../services/contact.service');

// router.get("/", contactServ.getContactForm);
router.post("/", contactServ.postContactForm);

module.exports = router;
