const express = require('express');
const router = express.Router();
const {installCtrl} = require('../controllers');

/* GET start page. */
router
    .get('/', installCtrl.get)
    .post('/', installCtrl.post)

module.exports = router;
