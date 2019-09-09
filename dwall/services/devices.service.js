const tvController = require("../controllers/devices.controller");
const userControllerClass = require("../controllers/user.js");
const uController = new userControllerClass();
const send = require("./logger.service.js");

function tvServices(){
  this.createDevice = function(req, res, next) {
    ;
    let info = {event: "create device", name: req.body.name} 
    var userId = req.user.id;
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      const params = {
        id: userId
      }
      
      if (req.body.orientation) params.orientation = req.body.orientation;
      if (req.body.hasOwnProperty('playLocalyStatus')) params.playLocalyStatus = req.body.playLocalyStatus;
      if (req.body.name) params.name = req.body.name;
      if (req.body.location) params.location = req.body.location;
      if (req.body.notes) params.notes = req.body.notes;
      if (req.body.hasOwnProperty('isMulticast')) params.isMulticast = req.body.isMulticast;
      if (req.body.limit) params.limit = req.body.limit;
      return tvController.createDevice(params);
    })
    .then(response => {
      if (response instanceof Error) throw response;

      send.log(userId, "Create device", req, res, response, 200, info)
      // User/DeviceName/TimeStamp/IP Address

      // res.status(200).send(response);
    })
    .catch(err => {
      send.error(userId, "Create device", req, res, response, 404, info)
      // res.status(404).send(err.message);
    });
  }

  this.getAllDevices = function(req, res, next) {
    var userId = {userId: req.user.id};
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      return tvController.getAllDevices(userId);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.getDeviceByGuid = function(req, res, next) {
    var userId = req.user.id;
    var guid = req.params.guid;
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      return tvController.getDeviceByGuid({userId, guid});
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.updateDevice = function(req, res, next) {
    var userId = req.user.id;
    var guid = req.params.guid;
    let info = {event: "update device", guid} 
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      return tvController.updateDevice({userId, guid, params: req.body});
    })
    .then(response => {
      send.log(userId, "Update device", req, res, response, 200, info)
      // res.status(200).send(response);
    })
    .catch(function(err) {
      send.error(userId, "Update device", req, res, response, 404, info)
      // res.status(404).send(err);
    });
  }


  this.removeDevice = function(req, res, next) {
    var userId = req.user.id;
    var guid = req.params.guid;
    let info = {event: "remove device", guid} 
    return new Promise((resolve, reject) => {
      resolve(userId);
    })
    .then(userId => {
      return tvController.removeDevice({userId, guid});
    })
    .then(response => {
      uController.resetTVbyGUID(guid);
      send.log(userId, "Remove device", req, res, response, 200, info)
      //res.status(200).send(response);
    })
    .catch(function(err) {
      send.error(userId, "Remove device", req, res, response, 404, info)
      //res.status(404).send(err);
    });
  }

  this.muteDevice = function(req, res, next) {
    let SocketService = require("../app.js");
    var userId = req.user.id;
    var guid = req.params.guid;
    return new Promise((resolve, reject) => {
      resolve(guid);
    })
    .then(guid => {
      return SocketService.muteRoom(guid);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.unmuteDevice = function(req, res, next) {
    let SocketService = require("../app.js");
    var userId = req.user.id;
    var guid = req.params.guid;
    return new Promise((resolve, reject) => {
      resolve(guid);
    })
    .then(guid => {
      return SocketService.unmuteRoom(guid);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.restartDevice = function(req, res, next) {
    let SocketService = require("../app.js");
    var userId = req.user.id;
    var guid = req.params.guid;
    return new Promise((resolve, reject) => {
      resolve(guid);
    })
    .then(guid => {
      return SocketService.restartRoom(guid);
    })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(function(err) {
      res.status(404).send(err);
    });
  }

  this.previewDevice = function(req, res, next) {
    const SocketService = require("../app.js");
    const userId = req.user.id;
    const guid = req.params.guid;
    return new Promise((resolve, reject) => {
      resolve(SocketService.getClientFromRoom(guid));
    })
    .then(client => {
      if (!client) {
        res.status(200).send({img: null}); 
      } else {
        client.once('preview', function (data) {
          if (data.error) {
              res.status(400).send(data);
          } else {
              res.status(200).send(data);
          }
        });
        client.emit('getPreview', {message: 'please, provide me `data.img=base64`'});
      }
    })
    .catch(err => {
      console.log('[Error]', err);
    });
  }
}

module.exports = new tvServices();