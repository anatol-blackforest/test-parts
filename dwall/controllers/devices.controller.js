const DB = require("../modules/sql.js");
const tvDataController = require("../controllers/tvData.controller.js");
const fallbackController = require("../controllers/fallback.controller.js");
const settingsController = require("../controllers/settings.controller.js");
const licensesController = require("../controllers/licenses.controller.js");
const UserController = require("../controllers/user.js");
const userController = new UserController();
var Guid = require("guid");
const crypto = require('crypto');

function tvController() {
  this.createDevice = function(params) {
    var guid = Guid.create();
    var idToinput = generateIDtoInput();
    return DB.query('START TRANSACTION')
    .then(() => {
      return licensesController.getAllLicenses({userId: params.id});
    })
    .then((licenses) => {
      let multicast = licenses.multicast;
      let singlecats = licenses.singlecast;
      let availableList = []; 
      if(params.isMulticast){
        multicast.forEach((license, key) => {
          if (license.available === true && license.devices === params.limit) {
            availableList.push(license);
            license.available = false;
            multicast[key] = license;
          }
        });
      } else {
        if(singlecats.available){
          availableList.push({
            devices:1,
            available:false
          });
        };
      }
      if (!availableList.length) throw new Error('Wrong license properties');
      const setLicense = {};
      setLicense.multicast =  JSON.stringify(multicast);
      const updateParamsLicense = {
        set: setLicense,
        where: {
          id: licenses.id
        },
        table: 'licenses'
      }
      return licensesController.updateLicense(updateParamsLicense);
    })
    .then(() => {
      if (!params.hasOwnProperty('limit')) throw new Error('`limit` is required.');
      if (!params.hasOwnProperty('isMulticast')) throw new Error('`isMulticast` is required.');
      if (!params.isMulticast) params.limit =  1;
      return settingsController.createSetting({
        limit: params.limit,
        isMulticast: params.isMulticast !== 0 ? 1 : 0
      });
    })
    .then((result) => {
      return Promise.all([
        userController.getUserDataById(params.id),
        this.getAllDevices({userId: params.id}),
        result.insertId
      ]);
    })
    .then(([user, devices, settingId]) => {
      var single = 0;
      var multy = 0;
      devices.forEach(device => {
        if (device.is_multicast) {
          multy++;
        } else {
          single = single + 1;
        }
      });

      if (user.tv_limit <= single && !params.isMulticast) {
        throw new Error('Singlecast devices limit has been reached.');
      }

      if (user.multicast_limit <= multy && params.isMulticast) {
        throw new Error('Multicast devices limit has been reached.');
      }

      if (params.orientation != "portrait" && params.orientation != "landscape") {
        throw new Error(" Wrong orientation type passed. It's either 'portrait' or 'landscape'");
      }

      if (isNaN(parseInt(params.playLocalyStatus))) {
        throw new Error(" Wrong type for platfrom localStorage passed. It's either 1 or 0");
      }

      return DB.query(`INSERT INTO tv
                (user_id, guid, input_id, orientation, playLocalyStatus, video_id, constant_play, playlists_status, settings, playing_fallback)
                VALUES
                (:userId, :guid, :idToInput, :orientation, :playLocalyStatus, NULL, 1, 0, :settings, :playing_fallback)`, {
                  userId: params.id,
                  guid: guid.value,
                  idToInput: idToinput,
                  orientation: params.orientation,
                  playLocalyStatus: params.playLocalyStatus,
                  settings: settingId,
                  playing_fallback: 1
                }, guid.value);
    })
    .then(() => {
      if (!params.hasOwnProperty('name')) throw new Error('`name` is required.');
      const model = {
        guid: guid.value,
        name: params.name.replace(/'/g,"\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '')
      };

      model.notes = params.hasOwnProperty('notes') ? params.notes.replace(/'/g,"\'").replace(/[^\wa-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '') : null;
      model.location = params.hasOwnProperty('location') ? params.location.replace(/'/g,"\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '') : null;
      return tvDataController.createDeviceData(model);
    })
    .then(() => {
      return fallbackController.createFallback({
        guid: guid.value
      });
    })
    .then(() => {
      return DB.query('COMMIT');  
    })
    .then(() => {
      return this.getDeviceByGuid({userId: params.id, guid: guid.value});
    })
    .catch(err => {
      ;
      return DB.rollback()
      .then(() => {
        return err;
      });
    });
  }

this.getAllDevices = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query(`SELECT 
              tv.input_id,
              tv.guid,
              tv.playlists_status,
              tv.playlist_id,
              tv.constant_play,
              tv.playLocalyStatus,
              tv.orientation,
              tv.on_schedule, 
              tv.playing_fallback,
              tv_data.tv_name,
              tv_data.tv_location,
              tv_data.tv_note,
              COALESCE(video.url, video.web_page) AS url,
              fallback.url f_url,
              ds.is_multicast,
              ds.limit
              FROM tv 
              LEFT JOIN device_settings AS ds ON tv.settings = ds.id 
              LEFT JOIN tv_data ON tv.guid = tv_data.guid 
              LEFT JOIN video ON tv.video_id = video.id 
              LEFT JOIN fallback ON fallback.guid = tv.guid
              WHERE tv.user_id=:userId`, params);
    })
    .catch(err => {
        return err;
    });
  }

  this.getDeviceByGuid = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query("SELECT * FROM tv WHERE user_id= :userId AND guid= :guid", params, params.guid);
    })
    .catch(err => {
        return err;
    });
  }

  this.getDeviceByInputId = function(params) {
    return DB.query("SELECT ds.limit, ds.is_multicast, tv.* FROM tv JOIN device_settings AS ds ON tv.settings = ds.id WHERE tv.input_id= :inputId", params, 'tv')
    .catch(err => {
        return err;
    });
  }

  this.getSocDeviceByGuid = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query(`SELECT tv.*, video.url, video.web_page, ds.limit, ds.is_multicast FROM tv 
        LEFT JOIN device_settings AS ds ON tv.settings = ds.id 
        LEFT JOIN video AS video ON tv.video_id = video.id 
        WHERE guid= :guid`, params, params.guid);
    })
    .catch(err => {
        return err;
    });
  }

  this.updateDevice = function({userId, guid, params}) {
    return Promise.resolve({userId, guid, params})
    .then(({userId, guid, params}) => {
      var paramsTv = {set: {}, where: {}};
      var paramsSettings = {set: {}, where: {}};
      var paramsTvData = {set: {}, where: {}};
      var promise = [];
      if (params.hasOwnProperty('isMulticast') ) paramsSettings.set.is_multicast = params.isMulticast;
      if (params.limit)  paramsSettings.set.limit = params.limit;
      if (params.location)  paramsTvData.set.tv_location = params.location.replace(/'/g,"\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
      if (params.orientation)  paramsTv.set.orientation = params.orientation;
      if (params.hasOwnProperty('playLocalyStatus'))  paramsTv.set.playLocalyStatus = params.playLocalyStatus;
      if (params.name)  paramsTvData.set.tv_name = params.name.replace(/'/g,"\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
      if (params.hasOwnProperty('notes'))  paramsTvData.set.tv_note = params.notes.replace(/'/g,"\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
      paramsTv.where.user_id = userId;
      paramsTv.where.guid = guid;
      paramsTvData.where.guid = guid;
      promise.push(paramsTv);
      promise.push(paramsTvData);
      if (Object.keys(paramsSettings.set).length !== 0) {
        promise.push(paramsSettings);
        promise.push(DB.query("SELECT * FROM tv WHERE user_id= :userId AND guid= :guid", {userId, guid}, guid));
      }
      return Promise.all(promise);
    })
    .then(([paramsTv, paramsTvData, paramsSettings={}, tvEntity=[]]) => {
      var promise = [];
      var queryTv = DB.prepareQuery('UPDATE tv', paramsTv);
      var variablesTv = Object.assign({}, paramsTv.set, paramsTv.where);
      promise.push(DB.query(queryTv, variablesTv));

      if (tvEntity.length) {
        paramsSettings.where.id = tvEntity[0].settings
        querySet = DB.prepareQuery('UPDATE device_settings', paramsSettings, tvEntity[0].guid);
        variablesSet = Object.assign({}, paramsSettings.set, paramsSettings.where);
        promise.push(DB.query(querySet, variablesSet));
      }

      queryData = DB.prepareQuery('UPDATE tv_data', paramsTvData, paramsTvData.where.guid);
      variablesData = Object.assign({}, paramsTvData.set, paramsTvData.where);
      promise.push(DB.query(queryData, variablesData));

      return Promise.all(promise);
    })
    .then((result) => {
      return {status: 'ok'};
    })
    .catch(err => {
      return err;
    });
  }

  this.removeDevice = function({userId, guid}) {
    let SocketService = require("../app.js");
    return Promise.resolve({userId, guid})
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      var getDevice =  DB.query("SELECT * FROM tv WHERE user_id= :userId AND guid= :guid", {userId, guid}, guid);
      var getLicense = DB.query("SELECT * FROM licenses WHERE user_id= :userId", { userId}, 'licenses');
      return Promise.all([getDevice, getLicense]);
    })
    .then(([devices, licenses]) => {
      var device = devices[0];
      var license = licenses[0];
      return Promise.all([
        license,
        DB.query("SELECT * FROM device_settings WHERE id= :id", { id: device.settings}, 'device_settings'),
        DB.query("DELETE FROM tv WHERE user_id= :userId AND guid= :guid", {userId, guid}, guid)
        ]);
    })
    .then(([license, settings]) => {
      var setting = settings[0];
      var promises = [];
      if (setting.is_multicast) {
        var notFound = true;
        var multicast = JSON.parse(license.multicast).map(item => {
          if (item.devices === setting.limit && !item.available && notFound) {
            notFound = false;
            item.available = true;
          }
          return item;
        });
        multicast = JSON.stringify(multicast);
        var paramsSettings = {
          set: {},
          where: {}
        }

        paramsSettings.set.multicast = multicast;
        paramsSettings.where.id = license.id;
        querySet = DB.prepareQuery('UPDATE licenses ', paramsSettings, 'licenses');
        variablesSet = Object.assign({}, paramsSettings.set, paramsSettings.where);
        promises.push(DB.query(querySet, variablesSet));
      }
      promises.push(DB.query("DELETE FROM device_settings WHERE id= :id", {id: setting.id}, 'device_settings'));
      return Promise.all(promises);
    })
    .then(() => {
      return DB.query(`
        DELETE FROM schedule
        WHERE tv_guid = :guid`, {guid}, guid);
    })
    .then(() => {
      return DB.query(`
        DELETE FROM groups
        WHERE GUID = :guid`, {guid}, guid)
    })
    .then(() => {
      return DB.query('COMMIT');  
    })
    .then(() => {
      console.log('[SOCKET]', SocketService.leaveRoom);
      return SocketService.leaveRoom(guid);
    })
    .then(() => {
      console.log('[RETURN]');
      return {status: 'ok'};
    })
    .catch(err => {
        return err;
    });
  }

  this.detectMediaType = (item) => {
      const types = {
          webPage: 'webPage',
          image: 'image',
          video: 'video'
      }
      const formats = {
          image: ['jpg', 'jpeg', 'png', 'tiff', 'bmp'],
          video: ['mp4', 'avi', 'ogg', 'webm', 'mpg', '3gp', 'mov']
      }
      //if (item.web_page) return types.webPage;
      let type;
      try {
          const ext = item.url.slice(item.url.lastIndexOf('.') + 1);
          if (formats.image.indexOf(ext) !== -1) {
              type = types.image
          } else if (formats.video.indexOf(ext) !== -1) {
              type = types.video
          } else {
              type = types.webPage;
          }
      } catch(e) {
          type = null;
      }
      return type;
  }

  this.detectLayerMediaType = (item) => {
      const types = {
          webPage: 'overlay',
          image: 'image',
          video: 'video'
      }
      const formats = {
          image: ['jpg', 'jpeg', 'png', 'tiff', 'bmp'],
          video: ['mp4', 'avi', 'ogg', 'webm', 'mpg']
      }
      //if (item.web_page) return types.webPage;
      let type;
      try {
          const ext = item.url.slice(item.url.lastIndexOf('.') + 1);
          if (formats.image.indexOf(ext) !== -1) {
              type = types.image
          } else if (formats.video.indexOf(ext) !== -1) {
              type = types.video
          } else {
              type = types.webPage;
          }
      } catch(e) {
          type = null;
      }
      return type;
  }
}

function generateIDtoInput() {
    var chars = "1234567890";
    var value = new Array(12);
    var len = chars.length;
    var data = crypto.randomBytes(12);
    for (var i = 0; i <= 12; i++) {
        value[i] = chars[data[i] % len];
    }
    return value.join("");
}

module.exports = new tvController();