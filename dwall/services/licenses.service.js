const licensesController = require("../controllers/licenses.controller");
const usrCtrl = require("../controllers/user");
const userController = new usrCtrl();

function licensesService() {
  this.createLicense = function(req, res, next) {
    ;
    if (!req.session.passport || !req.user.id) res.status(400).send({message: "Unavtorized"});
    if (!req.body.userId) req.body.userId = req.user.id;
    const insertBody = {
      userId: req.body.userId,
      singlecast: req.body.singlecast,
      multicast: JSON.stringify(req.body.multicast),
    };
    return new Promise((resolve, reject) => {
      resolve(insertBody);
    })
    .then(license => {
      var promises = [];
      promises.push(licensesController.createLicense(license));
      promises.push(userController.updateUser(license.userId, {
        tv_limit: license.singlecast,
        multicast_limit: req.body.multicast.length
      }));
      return Promise.all(promises);
    })
    .then(response => {
      res.status(201).send({message: 'created'});
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
  }

  this.getAllLicenses = function(req, res, next) {
    //var userId = {userId: req.user.id};
    var userId = {userId: req.user.id};
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      return licensesController.getAllLicenses(userId);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
  }

  this.getLicenseById = function(req, res, next) {
    if (!req.session.passport || !req.user.id) res.status(400).send({message: "Unavtorized"});
    return new Promise((resolve, reject) => {
      resolve({id: req.params.id});
    })
    .then(params => {
      return licensesController.getLicenseById(params);
    })
    .then(response => {

      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
  }

  this.updateLicense = function(req, res, next) {
    if (!req.session.passport || !req.user.id) res.status(400).send({message: "Unavtorized"});
    return new Promise((resolve, reject) => {
      resolve({id: req.params.id});
    })
    .then(params => {
      return licensesController.getLicenseById(params);
    })
    .then(license => {
      let promises = [];
      const setLicense = {};
      const setUser = {};
      if (req.body.singlecast) {
        setLicense.singlecast =  req.body.singlecast;
        setUser.tv_limit =  req.body.singlecast;
      } 
      if (req.body.multicast) {
        setLicense.multicast =  JSON.stringify(req.body.multicast); 
        setUser.multicast_limit =  req.body.multicast.length; 
      }
      const updateParamsLicense = {
        set: setLicense,
        where: {
          id: license[0].id
        },
        table: 'licenses'
      }
      promises.push(licensesController.updateLicense(updateParamsLicense));

      const updateParamsUser = {
        set: setUser,
        where: {
          id: license[0].user_id
        },
        table: 'users'
      }
      promises.push(licensesController.updateLicense(updateParamsUser));

      return Promise.all(promises);
    })
    .then(response => {
      res.status(200).send({message: "updated"});
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
  }


  this.removeLicense = function(req, res, next) {
    if (!req.session.passport || !req.user.id) res.status(400).send({message: "Unavtorized"});
    return new Promise((resolve, reject) => {
      resolve({id: req.params.id});
    })
    .then(params => {
      return licensesController.getLicenseById(params);
    })
    .then(license => {
      let params = {
        id: license[0].id
      }
      return licensesController.removeLicense(params);
    })
    .then(response => {
      res.status(204).send({message: "deleted"});
    })
    .catch(function(err) {
      res.status(400).send(err);
    });
  }
}

module.exports = new licensesService();