const express = require('express');
const router = express.Router();
const comments = require('../controllers/comments');

router.route('/')
            .post(comments.getComments)

module.exports = router;