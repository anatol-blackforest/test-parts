// сводим роуты
//главная страница
const express = require('express');
const router = express.Router();
const comments = require('../controllers/comments');

/* GET home page. */

router.route('/')
            .post(comments.saveComments)

module.exports = router;
