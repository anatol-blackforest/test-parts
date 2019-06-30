// сводим роуты
//главная страница
const express = require('express');
const router = express.Router();
const tovars = require('../controllers');

/* GET home page. */

router.route('/')
            .get((req, res) => res.render('index'))
            .post(tovars)

module.exports = router;
