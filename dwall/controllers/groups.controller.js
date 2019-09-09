const DB = require("../modules/sql.js");
const tvDataController = require("../controllers/tvData.controller.js");
const fallbackController = require("../controllers/fallback.controller.js");
const settingsController = require("../controllers/settings.controller.js");
const UserController = require("../controllers/user.js");
const userController = new UserController();
var Guid = require("guid");


function groupsController() {
  this.createGroupDevice = function() {

  }

  this.getAllGroupsDevices = function() {

  }

  this.getGroupDeviceByGuid = function(params, mask) {
    return Promise.resolve()
    .then(() => {
      return DB.query("SELECT * FROM groups WHERE userId= :userId AND GUID= :guid", params, mask);
    })
    .catch(err => {
        return err;
    });
  }

  this.getSocGroupDeviceByGuid = function(params, mask) {
    return Promise.resolve()
    .then(() => {
      return DB.query("SELECT * FROM groups JOIN groups_desc as gd ON groups.group_id = gd.group_id WHERE GUID = :guid ", params, mask);
    })
    .catch(err => {
        return err;
    });
  }

  this.updateGroupDevice = function() {

  }

  this.deleteGroupDevice = function() {

  }
}

module.exports = new groupsController();