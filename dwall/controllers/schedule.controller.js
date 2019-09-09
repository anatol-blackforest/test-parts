const DB = require("../modules/sql.js");

function scheduleController() {
  this.createSchedule = function() {
    //TO DO
  }

  this.getScheduleById = function(params, mask) {
    return DB.query("SELECT * FROM schedule WHERE id = :id", params, mask)
  }

  this.getScheduleByGroupId = function(params, mask) {
    return DB.query("SELECT * FROM schedule WHERE group_id = :groupId", params, mask)
  }

  this.getScheduleByGuid = function(params, mask) {
    return DB.query("SELECT * FROM schedule WHERE tv_guid = :tvGuid", params, mask)
  }

  this.updateSchedule = function(id, params, mask) {
    //TO DO
  }

  this.deleteSchedule = function(id) {
    //TO DO
  }
}

module.exports = new scheduleController();