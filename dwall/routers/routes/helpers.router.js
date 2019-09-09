var express = require('express');
var router = express.Router();
var helpersServ = require('../../services/helpersServ.js');

router.get("/status", helpersServ.getStatuses);

module.exports = router;


/*function getStatuses(req, res, next) {
    helpersServ.getStatuses()
    .then(function(response) {
        res.status(200).send(response);
    })
    .catch(function(err) {
        next(err);
    });
}*/