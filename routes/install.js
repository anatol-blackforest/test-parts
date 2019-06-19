const express = require('express');
const router = express.Router();
const {installCtrl} = require('../controllers');

/* Роуты установки приложения */
router
    .get('/', installCtrl.get)
    .post('/', installCtrl.post)

module.exports = router;
