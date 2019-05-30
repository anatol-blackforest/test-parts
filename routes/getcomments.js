const express = require('express');
const router = express.Router();
const comments = require('../controllers');

router.route('/')
            .post(comments.getComments)

module.exports = router;
