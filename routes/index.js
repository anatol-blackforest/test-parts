const express = require('express');
const router = express.Router();
const {getCtrl, addCtrl, updateCtrl, deleteCtrl} = require('../controllers');

/* GET start page. */

router
    .get('/', getCtrl)
    .post('/', addCtrl)
    .put('/:id', updateCtrl)
    .delete('/:id', deleteCtrl)

module.exports = router;
