const helpersController = require("../controllers/helpers.js");
const uController = require("../controllers/user.js");
const userController = new uController();

function helpersServices(){
  this.getStatuses = function(req, res, next) {
    var userId = req.user.id;
    return new Promise(function(resolve, reject) {
      resolve(userId);
    })
    .then(function(userId) {
      return userController.pullAll(userId);
    })
    .then(function(devices) {
      return helpersController.getStatuses(devices);
    })
    .then(function(response) {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }
}

module.exports = new helpersServices();