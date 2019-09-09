const DB = require("../modules/sql.js");

function licensesController() {

  this.createLicense = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      return DB.query("INSERT INTO licenses (`user_id`, `singlecast`, `multicast`) VALUES(:userId, :singlecast, :multicast)", params, 'licenses');
    })
    .then((result) => {
      return DB.query('COMMIT');
    })
    .catch(err => {
      return DB.rollback(() => {
        let message = err.code;
        if (err.code === 'ER_DUP_ENTRY') message = 'This user already have license aggrement';
        return {message};
      });
    });
  }


  this.getAllLicenses = function(params) {
    return Promise.resolve(params)
    .then(() => {
      let promises = [];

      promises.push(DB.query("SELECT * FROM licenses WHERE user_id= :userId", params, 'licenses'));
      promises.push(DB.query(`SELECT users.id, users.tv_limit, users.multicast_limit, tv.guid, tv.settings, ds.limit, ds.is_multicast 
        FROM users as users 
        left JOIN tv as tv ON users.id = tv.user_id 
        left JOIN device_settings as ds ON tv.settings = ds.id 
        WHERE users.id = :userId`, params, 'users'));
      return Promise.all(promises);
    })
    .then(([license, devices]) => {
      const result = {};
      const multicast = JSON.parse(license[0].multicast);
      console.log('[result]', multicast);
      let singlecastDevices = 0;
      let multicastDevices = [];
      devices.forEach(device => {
        if (device.is_multicast == 0) {
          singlecastDevices++;
        } else {
          multicastDevices.push(device);
        }
      })
      result.id = license[0].id;
      result.singlecast = {
        amount: license[0].singlecast,
        used: singlecastDevices,
        available: license[0].singlecast - singlecastDevices
      };
      result.multicast = multicast.map(license => {
        let isFound = false;
        license.available = true;
        let deviceKey;
        multicastDevices.forEach((device, key) => {
          if (license.devices === device.limit && !isFound) {
            deviceKey = key;
            isFound = true;
            license.available = false;
          }
        });
        if (isFound) multicastDevices.splice(deviceKey, 1);
        return license;
      });
      return result;
    })
    .catch(err => {
      return err;
    });
  }

  this.getLicenseById = function(params) {
    return Promise.resolve(params)
    .then((params) => {
      return DB.query("SELECT * FROM licenses WHERE user_id= :id", params, 'licenses');
    })
    .catch(err => {
      return err;
    }); 
  }

  this.updateLicense = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      const query = DB.prepareQuery(`UPDATE ${params.table}`, params);
      const variables = Object.assign({}, params.set, params.where);
      return DB.query(query, variables, 'licenses');
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

  this.removeLicense = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      return DB.query("DELETE FROM licenses WHERE id= :id", params, 'licenses');
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

module.exports = new licensesController();