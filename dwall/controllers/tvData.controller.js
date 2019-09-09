const DB = require("../modules/sql.js");
let uControllerConstructor = require("./user.js");
let uController = new uControllerConstructor();

function tvDataController() {

  this.createDeviceData = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      return DB.query(`INSERT INTO tv_data
                      (guid ,tv_name, tv_location, tv_note)
                      VALUES (:guid, :name, :location, :notes)`, params, params.guid);
    })
    .then((result) => {
      return DB.query('COMMIT');  
    })
    .catch(err => {
      return DB.rollback(() => {
        return err;
      });
    });
  }

  this.getFallbackForTVbyGUID = function(GUID){
    ;
    return DB.query(`
      SELECT user_id FROM tv
      WHERE guid = :GUID`, { GUID:GUID }, GUID)
    .then((data) => {
      if(data[0]){
        uController.getFallbackByUserId(data[0].user_id)
        .then((fallBackInfo) => {
          return fallBackInfo;
        })
      } else {
        return null;
      }
    })
    .catch(e => {
      return null
    });
  }
}

module.exports = new tvDataController();