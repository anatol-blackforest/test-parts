const DB = require("../modules/sql.js");

function settingController() {

  this.createSetting = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query("INSERT INTO device_settings (`limit`, `is_multicast`) VALUES(:limit, :isMulticast)", params, 'device_settings');
    })
    .catch(err => {
      return DB.rollback(() => {
        return err;
      });
    });
  }


  this.getAllSettings = function(params) {
    return Promise.resolve(params)
    .then(() => {
      const query = DB.prepareQuery('SELECT * FROM device_settings', params, 'device_settings');
      const variables = Object.assign({}, params.set, params.where);
      return DB.query(query, variables);
    })
    .catch(err => {
      return err;
    });
  }

  this.getSettingById = function(params) {
    return Promise.resolve(params)
    .then((params) => {
      return DB.query("SELECT * FROM device_settings WHERE id= :id", params, 'device_settings');
    })
    .catch(err => {
      return err;
    }); 
  }

  this.updateSetting = function(params) {
    return Promise.resolve()
    .then(() => {
      const query = DB.prepareQuery('UPDATE device_settings', params, 'device_settings');
      const variables = Object.assign({}, params.set, params.where);
      return DB.query(query, variables);
    })
    .catch(err => {
      return DB.rollback(() => {
        return err;
      });
    });
  }

  this.removeSetting = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      return DB.query("DELETE FROM device_settings WHERE id= :id", params, 'device_settings');
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
}

module.exports = new settingController();