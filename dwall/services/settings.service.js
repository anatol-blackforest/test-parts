const settingsController = require("../controllers/settings.controller");
const devicesController = require("../controllers/devices.controller");

function settingsServices(){
  this.createSetting = function(req, res, next) {
    if (!req.user.id) res.status(400).send({message: "Unavtorized"});
    const insertBody = {
      limit: req.body.limit,
      isMulticast: req.body.isMulticast
    }
    return new Promise((resolve, reject) => {
      resolve({userId: req.user.id, guid: req.params.guid});
    })
    .then(params => {
      return devicesController.getDeviceByGuid(params);
    })
    .then(device => {
      if (device[0].user_id !== req.user.id) return {status: false, message: "wrong guid has been provided"};
      return settingsController.createSetting(insertBody);
    })
    .then(response => {
      res.status(201).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.getAllSettings = function(req, res, next) {
    var userId = req.user.id;
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      return settingsController.getAllSettings(userId);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.getSettingById = function(req, res, next) {
    if (!req.user.id) res.status(400).send({message: "Unavtorized"});
    return new Promise((resolve, reject) => {
      resolve({userId: req.user.id, guid: req.params.guid});
    })
    .then(params => {
      return devicesController.getDeviceByGuid(params);
    })
    .then(device => {
      if (device[0].user_id !== req.user.id) return {status: false, message: "wrong guid has been provided"};
      let params = {
        id: device[0].settings
      }
      return settingsController.getSettingById(params);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.updateSetting = function(req, res, next) {
    if (!req.user.id) res.status(400).send({message: "Unavtorized"});
    return new Promise((resolve, reject) => {
      resolve({userId: req.user.id, guid: req.params.guid});
    })
    .then(params => {
      return devicesController.getDeviceByGuid(params);
    })
    .then(device => {
      if (device[0].user_id !== req.user.id) return {status: false, message: "wrong guid has been provided"};
      const updateParams = {
        set: {
          limit: req.body.limit,
          is_multicast: req.body.isMulticast
        },
        where: {
          id: device[0].settings
        }
      }
      return settingsController.updateSetting(updateParams);
    })
    .then(response => {
      res.status(200).send({message: "updated"});
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }


  this.removeSetting = function(req, res, next) {
    if (!req.user.id) res.status(400).send({message: "Unavtorized"});
    return new Promise((resolve, reject) => {
      resolve({userId: req.user.id, guid: req.params.guid});
    })
    .then(params => {
      return devicesController.getDeviceByGuid(params);
    })
    .then(device => {
      if (device[0].user_id !== req.user.id) return {status: false, message: "wrong guid has been provided"};
      let params = {
        id: device[0].settings
      }
      return settingsController.removeSetting(params);
    })
    .then(response => {
      res.status(204).send({message: "deleted"});
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }
}

module.exports = new settingsServices();