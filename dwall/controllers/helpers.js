const DB = require("../modules/sql.js");

function helpersController() {
  this.getStatuses = function(devices) {
    let SocketService = require("../app.js");
    let statuses = [];
    let status;
    let hdmi;
    let rooms = SocketService.io.sockets.adapter.rooms;
    let connections  = SocketService.connections;
    devices.forEach(function(item) {
      if (!rooms.hasOwnProperty(item.guid)) {
        status = false;
        hdmi = false;
      } else {
        status = true;
        hdmi = rooms[item.guid].hdmiStatus ? true : false;
      }
      statuses.push({
        guid: item.guid,
        status,
        hdmi 
      });
    });
    return statuses;
  }
}

module.exports = new helpersController();