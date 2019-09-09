
const DB = require("./sql.js");
const crypto = require('crypto');

var Guid = require("guid");
var path = require("path");
var fs = require('fs');
var Moment = require('moment-timezone');
var formidable = require('formidable');
var helperFunctions = require('./helpers.js')
var mediaControlerFunction = require('../controllers/media.js');
var mController = new mediaControlerFunction();
var userControllerFunction = require('../controllers/user.js');
var uController = new userControllerFunction();
var helpers = new helperFunctions();

const S3BucketServise = require("../services/uploader.service.js");
const S3BucketController = require('../controllers/uploader.controller.js');
var tvDataController = require('../controllers/tvData.controller.js');

Moment.tz(new Date(), "Europe/Kiev").format;
var app = require("../app.js");

var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffprobePath = require('@ffprobe-installer/ffprobe').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
gm = require('gm').subClass({imageMagick: true});

var tvInteractions = function() {
  var module = this;

  //This function has been transfered to the UserController
  this.pullAll = function(userid) {
  // const query = DB.prepareQuery('SELECT * FROM device_settings', userid);
  // let variables = Object.assign({}, params.set, params.where);
  // return DB.query(query, variables);

  return DB.query(`
    SELECT
    users.email,
    tv_data.tv_name,
    tv_data.tv_location,
    tv_data.tv_note,
    tv.input_id,
    tv.guid,
    tv.playlists_status,
    tv.playlist_id,
    tv.constant_play,
    tv.playLocalyStatus,
    tv.orientation,
    tv.on_schedule,
    video.url,
    video.web_page,
    fallback.url f_url
    FROM users
    LEFT JOIN tv
    ON tv.user_id = users.id
    LEFT JOIN video
    ON tv.video_id = video.id
    LEFT JOIN tv_data
    ON tv.guid = tv_data.guid
    LEFT JOIN fallback
    ON fallback.guid = tv.guid
    WHERE users.id = :id)`, {id: userid}, 'users')
  .then((data) => {
    var status = false;
    Object.keys(data[0]).forEach((el) => {
      if(el != "email" && data[0][el] != null){
        status = true;
      }
    });
    if(status){
      return data;
    } else {
      return [];
    }
  })
  .catch(err => {
    return { "Status": "Error while pulling all tv from DB. Drats.", "Error": err };
  });
};

this.getDeviceLimit = function(userId) {
  // DB.query(`
  //     SELECT
  //     tv_limit
  //     FROM users
  //     WHERE id = '${userId}'
  // `)
  return DB.query(`
    SELECT
    tv_limit
    FROM users
    WHERE id = :id)`, {id: userId}, 'users')
  .then((data) => {
    return data[0];
  });
}

this.setMediaNameByURL = function(URL, name, note, size, duration, dimensions, objToPass){
  var urlToPass = URL;
  var nameToPass = name;
  var duration = duration ? duration : 0;
  var note = note || '';
  name = name.replace(/'/g,"\\'").replace(/[^\wа-яА-Я0-9' \\!-?,\u400-\u04F0\']|_/g, '');
  note = note.replace(/'/g,"\\'").replace(/[^\wа-яА-Я0-9' \\!-?,\u400-\u04F0\']|_/g, '');
  let params = {
    set: {
      media_name: name,
      size: size || 0,
      note,
      duration,
      dimensions
    },
    where: {
      url: URL
    }
  }
  const query = DB.prepareQuery(`UPDATE video`, params);
  let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    // UPDATE video
    // SET media_name = '${name}',
    // note = '${note}',
    // duration = '${duration}',
    // size = '${size || 0}',
    // dimensions = '${dimensions}'
    // WHERE url = '${URL}'`)
    return DB.query(query, variables, "video")
    .then((data) => {
      return module.pullMediaIdByURL(URL)
    })
    .then((id) => {
      return {f_url:urlToPass, f_name:nameToPass, f_id:id};
    })
    .catch((error) => {
      return error;
    });
  };

  this.updateMediaName = function(mediaId, newName){
    newName = newName.replace(/'/g,"\\'").replace(/[^\wа-яА-Я0-9' \\!-?,\u400-\u04F0\']|_/g, '');
    let params = {
      set: {
        media_name: newName,
      },
      where: {
        id: mediaId
      }
    }
    const query = DB.prepareQuery(`UPDATE video`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    // UPDATE video
    // SET media_name = '${newName}'
    // WHERE id = ${mediaId}`)
    return DB.query(query, variables, "video");
  };

  this.updateMediaNote = function(mediaId, newNote){
    newNote = newNote.replace(/'/g,"\\'").replace(/[^\wа-яА-Я0-9' \\!-?,\u400-\u04F0\']|_/g, '');
    let params = {
      set: {
        note: newNote,
      },
      where: {
        id: mediaId
      }
    }
    const query = DB.prepareQuery(`UPDATE video`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    // UPDATE video
    // SET note = '${newNote}'
    // WHERE id = ${mediaId}`)
    return DB.query(query, variables, "video");
  };

  this.updateMediaRecords = function(mediaId, newName, newNote){
    newName = newName.replace(/'/g,"\\'").replace(/[^\wа-яА-Я0-9' \\!-?,\u400-\u04F0\']|_/g, '');
    newNote = newNote.replace(/'/g,"\\'").replace(/[^\wа-яА-Я0-9' \\!-?,\u400-\u04F0\']|_/g, '');
    let params = {
      set: {
        media_name: newName,
        note: newNote
      },
      where: {
        id: mediaId
      }
    }
    const query = DB.prepareQuery(`UPDATE video`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    // UPDATE video
    // SET media_name = '${newName}',
    // duration = '${newDuration}',
    // note = '${newNote}'
    // WHERE id = ${mediaId}`)
    return DB.query(query, variables, "video");
  };

  this.updateStripeText = function(stripeId, newText) {
    let params = {
      set: {
        text_data: newText
      },
      where: {
        id: stripeId
      }
    }
    const query = DB.prepareQuery(`UPDATE stripes`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    // UPDATE stripes
    // SET text_data = '${newText}'
    // WHERE id = ${stripeId}`)
    return DB.query(query, variables, "stripes")
    .then((data) => {
      let params = {
        set: {
          size: Buffer.byteLength(newText, 'utf8')
        },
        where: {
          stripe_id: stripeId
        }
      }
      const query = DB.prepareQuery(`UPDATE video`, params);
      let variables = Object.assign({}, params.set, params.where);
      // return DB.query(`
      // UPDATE video
      // SET size = '${Buffer.byteLength(newText, 'utf8')}'
      // WHERE stripe_id = '${stripeId}'`)
      return DB.query(query, variables, "video");
    });
  }

  this.pullAllMyVideo = function(userid) {
    return DB.query(`
      SELECT url,
      update_interval,
      thumbnail,
      media_name,
      note,
      text_data,
      stripe_id,
      size,
      dimensions,
      duration,
      rss,
      web_page,
      overlay,
      stream,
      video.id id
      FROM video
      LEFT JOIN stripes
      ON stripes.id = video.stripe_id
      WHERE user_id = :userid`, {userid}, "video")
    .then(function(rows) {
      var result = []
      if(!rows) return result;
      rows.forEach((row, rowNumber, array) => {
        if(row.text_data){
          result.push({
            mediaType:"stripe",
            text:row.text_data,
            name:row.media_name,
            size: row.size,
            note:row.note,
            stripe_id:row.stripe_id,
            extension:"txt",
            id:row.id
          });
        } else if (row.overlay) {
          result.push({
            mediaType: "overlay",
            name: row.media_name,
            note: row.note,
            overlay: row.overlay,
            id: row.id,
            size: row.size
          });
        } else if (row.stream) {
          result.push({
            mediaType: "stream",
            name: row.media_name,
            note: row.note,
            url: row.stream,
            id: row.id
          });
        } else if (row.web_page) {
          result.push({
            mediaType:"webPage",
            name:row.media_name,
            note:row.note,
            url: row.web_page,
            //duration: row.duration,
            id:row.id
          });
        } else if (row.url && row.url != "undefined" && row.rss == 0){
          var extension = row.url.split(".")[row.url.split(".").length - 1];
          var type = null;
          if(extension == "mp4" ||
            extension == "avi" || 
            extension == "webm" || 
            extension == "mov" || 
            extension == "3gp"
           ){ 
            type = "video" 
          }else{
            type = "image"
          }
          result.push({
            mediaType: type,
            url:row.url,
            thumbnail:row.thumbnail,
            note:row.note,
            extension:extension,
            name:row.media_name,
            id:row.id,
            size: row.size,
            dimensions: row.dimensions,
            duration: row.duration ? row.duration : null
          });
        } else if(row.rss == 1 && row.url){
          result.push({
            mediaType: "rss",
            url:row.url,
            note:row.note,
            name:row.media_name,
            id:row.id,
            update_interval:row.update_interval
          })
        }
      });
      return result;
    })
    .catch((err) => { 
      return { "Status": "Error while pulling all video from DB. Drats.", "Error": err };
    });
  };


  // SELECT
  // list.list_name,
  // list.list_note,
  // list.overlay_id,
  // p_video.url,
  // p_video.v_order,
  // video.size,
  // video.note,
  // video.name,
  // video.thumbnail
  // list.id,
  // p_video.duration,
  // stripe_color,
  // stripe_background,
  // stripe_id,
  // rss_update_interval
  // FROM playlists list
  // LEFT JOIN playlists_video p_video
  // ON list.id = p_video.playlist_id
  // JOIN video ON p_video.url = video.url

//   select a.tab, a.fam, b.dolj, c.otdel
// from a 
// left join b on a.tab=b.tab
// left join c on a.tab=c.tab

  this.pullMyPlaylists = function(userid) {
    return DB.query(`
      SELECT
      list.list_name,
      list.list_note,
      list.overlay_id,
      video.url,
      video.v_order,
      list.id,
      video.duration,
      v.size,
      v.note,
      v.media_name,
      v.thumbnail,
      list.stripe_color,
      list.stripe_background,
      list.stripe_id,
      list.rss_update_interval
      FROM playlists list
      LEFT JOIN playlists_video video
      ON list.id = video.playlist_id
      LEFT JOIN video v
      ON video.url = v.url
      WHERE list.user_id = :userid`, {userid}, "playlists");
  };

  this.createPlayList = function(req_data, userId) {
    if(!req_data.update_interval){
      req_data.update_interval = 900000;
    }
    // DB.query(`
    // INSERT 
    // INTO playlists 
    // (user_id, list_name, list_note, stripe_color, stripe_background, rss_update_interval, overlay_id) 
    // VALUES ('${userId}','${req_data.list_name}', '${req_data.list_note}', '${req_data.stripe_color}', '${req_data.stripe_background}', '${req_data.update_interval}', ${req_data.overlayId})`)
    return DB.query(`
      INSERT INTO playlists
      (user_id, list_name, list_note, stripe_color, stripe_background, rss_update_interval, overlay_id) 
      VALUES
      (:user_id, :list_name, :list_note, :stripe_color, :stripe_background, :rss_update_interval, :overlay_id) `, 
      {user_id: userId, list_name: req_data.list_name, list_note: req_data.list_note, stripe_color: req_data.stripe_color, stripe_background: req_data.stripe_background, rss_update_interval: req_data.update_interval, overlay_id: req_data.overlayId}, "playlists")
    .then((data) => {
      var listId = data.insertId;
      if(req_data.media){
        var media = null;
        if(typeof req_data.media == "string"){
          media = JSON.parse(req_data.media);
        } else if(typeof req_data.media == "object"){
          media = req_data.media;
        } else {
          throw "Media was read neither as string nor as object. Drats.";
        }
        if(media){
          var stripeId = req_data.stripe_id || null;
          return module.updatePlayList({list_name: req_data.list_name, list_note: req_data.list_note, media:media, id:listId, stripe_id:stripeId, userId:userId, rss_update_interval: req_data.update_interval, overlayId: req_data.overlayId});
        }
      } else {
        return;
      }
    })
    .catch( (e) => {return e;});
  };

  this.addOneVideoToPlaylist = function(URL, listID, order, timeout) {
    if (!timeout) { timeout = 0; }
    // DB.query(`
    // INSERT INTO playlists_video (url, playlist_id, v_order, duration)
    // VALUES ('${URL}', '${listID}', '${order}', '${timeout}')`)
    return DB.query(`
      INSERT INTO playlists_video (url, playlist_id, v_order, duration)
      VALUES (:url, :playlist_id, :v_order, :duration)`, 
      {url: URL, playlist_id: listID, v_order: order, duration: timeout}, "playlists")
  };

  this.deleteMedia = function(userId, id){
    if(!userId){throw "No user id for delete media"}
      if(!id){throw "No ids for delete media"}
        id = id.split(",");
      if(Array.isArray(id)){
        var idString = id.reduce((a, b) => `'${a}', '${b}'`);
        return Promise.all(id.map((el) => { helpers.deleteMediaFromRelatedTables(el, userId) }));
      };
    };

    this.deletePlayList = function(userId, listId) {
    // return DB.query(`
    // DELETE FROM playlists
    // WHERE user_id = '${userId}'
    // AND id = '${listId}'`)
    return DB.query(`
      DELETE FROM playlists
      WHERE user_id = :userId
      AND id = :listId`, {userId, listId}, "playlists")
    .then((data) => {
      let params = {
        set: {
          playlist_id: null,
          playlists_status: 0
        },
        where: {
          playlist_id: listId
        }
      }
      const query = DB.prepareQuery(`UPDATE tv`, params);
      let variables = Object.assign({}, params.set, params.where);
      // return DB.query(`
      // UPDATE tv
      // SET playlist_id = null,
      // playlists_status = 0
      // WHERE playlist_id = '${listId}'`)})
      return DB.query(query, variables, "tv")
    })
    .catch(err => {
      console.log('[ERROR]', err)
    });
  };



  this.updatePlayList = function(data) {
    if(!data.id){throw "No list id was given for /updatePlayList endpoint";}
    var rssUpdateInterval = 0;
    if(data.hasOwnProperty('rss_update_interval')) rssUpdateInterval = isNaN(parseInt(data.rss_update_interval)) ? 0 : parseInt(parseInt(data.rss_update_interval));
    var playlistID = data.id;
    const overlayId = data.overlayId
    let stripeId = null;

    return DB.query(`
      DELETE FROM playlists_video
      WHERE playlist_id = :playlistID`, {playlistID}, "playlists_video")
    .then(() => {
      delete data.id;
      var promises = [];
      stripeId  = data.stripe_id;
      var media;
      if (Array.isArray(data.media)) {
        media = data.media;
      } else {
        media = JSON.parse(data.media)
      }

      var queue = media.map((e, i) => {  return module.addOneVideoToPlaylist((e.url), playlistID, i, e.duration); });

      return Promise.all(queue)
      .then(() => {
        return module.addStripeToPlayList(data.userId, playlistID, stripeId, false)
      });
    })
    .then(() => {
      if(!stripeId){stripeId = null}

        let params = {
          set: {
            stripe_id: stripeId,
            list_name: data.list_name,
            list_note: data.list_note,
            rss_update_interval: rssUpdateInterval,
            overlay_id: overlayId
          },
          where: {
            id: playlistID
          }
        }
        const query = DB.prepareQuery(`UPDATE playlists`, params);
        let variables = Object.assign({}, params.set, params.where);
      // return DB.query(`
      //     UPDATE playlists
      //     SET stripe_id = ${stripeId},
      //     list_name = '${data.list_name}',
      //     list_note = '${data.list_note}',
      //     rss_update_interval = '${rssUpdateInterval}',
      //     overlay_id = ${overlayId}
      //     WHERE playlists.id = '${playlistID}'`)
      return DB.query(query, variables, "playlists");
    })
    .then((data) => {
      var guidFromTv = DB.query(`SELECT guid FROM tv
        WHERE playlist_id = :playlistID
        AND playlists_status != 0`, {playlistID}, "tv");

      var guidFromSchedule = DB.query(`SELECT tv_guid as guid, group_id FROM schedule
        WHERE playlist_id = :playlistID`, {playlistID}, "schedule");

      return Promise.all([guidFromTv, guidFromSchedule]);
    })
    .then(([tvList, scheduleList]) => {
      var list = [];
      var promises = [];
      var groupPromises;
      tvList.forEach(item => {
        list.push(item.guid);
      });
      scheduleList.forEach(item => {
        if (item.group_id && item.group_id !== "null") {
          promises.push(DB.query(`SELECT GUID as guid FROM groups
            WHERE group_id= :group_id`, {group_id: item.group_id}, "groups"));
        } else {
          list.push(item.guid);
        }
      });
      groupPromises = Promise.all(promises);
      return Promise.all([list, groupPromises]);
    })
    .then(([list, result]) => {
      result.forEach(items => {
        items.forEach(item => {
          list.push(item.guid);
        });
      });
      return list;
    })
    .then((data) => {
      var GUIDs = data;
      // DB.query(`
      // SELECT GUID guid
      // FROM groups_desc
      // JOIN groups
      // ON groups_desc.group_id = groups.group_id
      // WHERE playlist_id = '${playlistID}'`)
      return DB.query(`
        SELECT GUID guid 
        FROM groups_desc
        JOIN groups
        ON groups_desc.group_id = groups.group_id
        WHERE playlist_id = :playlistID`, {playlistID}, "groups_desc")
      .then((guidArray) => {
        if(guidArray.length > 0){
          GUIDs = GUIDs.concat(guidArray);
        }
        //module.emitRefreshToGivenGUIDs(GUIDs);
        return GUIDs; 
      });
    });
  };

  this.setOrientation = function(event){
    if(event.tv && (event.orientation == "landscape" || event.orientation == "portrait")) {
      let params = {
        set: {
          orientation: event.orientation
        },
        where: {
          guid: event.tv
        }
      }
      const query = DB.prepareQuery(`UPDATE tv`, params);
      let variables = Object.assign({}, params.set, params.where);
      // DB.query(`
      // UPDATE tv
      // SET  tv.orientation = '${event.orientation}'
      // WHERE guid = '${event.tv}'`)
      return DB.query(query, variables, 'tv');
    } else {
      return Promise.resolve("OK");
    }
  };

  this.setLocalstorage = function(event){
    if(!event.tv) return;
    event.playLocalyStatus = "1";

    let params = {
      set: {
        playLocalyStatus: event.playLocalyStatus
      },
      where: {
        guid: event.tv
      }
    }

    const query = DB.prepareQuery(`UPDATE tv`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    //  UPDATE tv
    //  SET tv.playLocalyStatus = '${event.playLocalyStatus}'
    //     WHERE tv.guid = '${event.tv}'`);
    return DB.query(query, variables, event.tv)
    .then(() => {
      // DB.query(`
      //  SELECT user_id FROM tv
      //  WHERE guid = '${event.tv}'`)
      return DB.query(`
        SELECT user_id FROM tv
        WHERE guid = :guid`, {guid: event.tv}, event.tv);
    })      
    .then((data) => {
      if(!data[0].hasOwnProperty('user_id')) return;
      if(event.playFromPlayList == "true") {
        module.runListFromLocalStorage(data[0].user_id, event.tv, event.playListSelect);
        
        let params = {
          set: {
            playlist_id: event.playListSelect,
            playlists_status: 1,
            constant_play: 1,
            playing_fallback: 0,
          },
          where: {
            guid: event.tv
          }
        }
        const query = DB.prepareQuery(`UPDATE tv`, params);
        let variables = Object.assign({}, params.set, params.where);
        // DB.query(`
        // UPDATE tv
        // SET tv.playlist_id = '${event.playListSelect}',
        // tv.playlists_status = 1,
        // tv.constant_play = 1,
        // tv.playing_fallback = '0'
        // WHERE tv.guid = '${event.tv}'`)
        return DB.query(query, variables, event.tv)
        .then(() => {
          return DB.query(`
            DELETE FROM groups
            WHERE GUID = :GUID`, {GUID: event.tv}, "groups");
        })
        .then(() => {
          module.emitRefreshToGivenGUIDs(event.tv);
        });
      } else {
        if(parseInt(event.playing_fallback) == 1) {
          let params = {
            set: {
              video_id: null,
              constant_play: 1,
              playlists_status: 0,
              on_schedule: 0,
              playing_fallback: 1
            },
            where: {
              guid: event.tv
            }
          }
          const query = DB.prepareQuery(`UPDATE tv`, params);
          let variables = Object.assign({}, params.set, params.where);
          // DB.query(`
          // UPDATE tv
          // SET video_id = null,
          // tv.constant_play = '1',
          // tv.playlists_status = '0',
          // tv.on_schedule = '0',
          // tv.playing_fallback = '1'
          // WHERE guid = :tv`, event)
          return DB.query(query, variables, event)
          .then(() => {
            module.emitRefreshToGivenGUIDs(event.tv);
          });
        } else {
          // DB.query(`
          // SELECT id FROM video
          // WHERE url = '${event.media}' OR web_page = '${event.media}'`)
          return DB.query(`
            SELECT id FROM video
            WHERE url = :media OR web_page = :media`, {media: event.media}, "video")
          .then((data) => {
            if(!event.playing_fallback) {
              if(data[0]){
                let params = {
                  set: {
                    constant_play: 1,
                    playlists_status: 0,
                    on_schedule: 0,
                    playing_fallback: 0,
                    video_id: data[0].id
                  },
                  where: {
                    guid: event.tv
                  }
                }
                const query = DB.prepareQuery(`UPDATE tv`, params);
                let variables = Object.assign({}, params.set, params.where);
                // DB.query(`
                // UPDATE tv
                // SET tv.constant_play = '1',
                // tv.playlists_status = '0',
                // tv.on_schedule = '0',
                // tv.playing_fallback = '0',
                // video_id = '${data[0].id}'
                // WHERE tv.guid = '${event.tv}'`)
                return DB.query(query, variables, event.tv)
                .then(() => {
                  return  DB.query(`
                    DELETE FROM groups
                    WHERE GUID = :GUID`, {GUID: event.tv}, event.tv);
                })
                .then(() => {
                  module.emitRefreshToGivenGUIDs(event.tv)
                });
              }
            } else {
              if(data[0]){
                let params = {
                  set: {
                    constant_play: 1,
                    playlists_status: 0,
                    on_schedule: 0,
                    playing_fallback: 1,
                    video_id: data[0].id
                  },
                  where: {
                    guid: event.tv
                  }
                }
                const query = DB.prepareQuery(`UPDATE tv`, params);
                let variables = Object.assign({}, params.set, params.where);
                // DB.query(`
                // UPDATE tv
                // SET tv.constant_play = '1',
                // tv.playlists_status = '0',
                // tv.playing_fallback = '1',
                // tv.on_schedule = '0',
                // video_id = '${data[0].id}'
                // WHERE tv.guid = '${event.tv}'`)
                return DB.query(query, variables, event.tv)
                .then(() => {
                    // return  DB.query(`
                    // DELETE FROM groups
                    // WHERE GUID = '${event.tv}'`);
                    return DB.query(`DELETE FROM groups
                      WHERE GUID = :GUID`, {GUID: event.tv}, event.tv);
                  })
                .then(() => {
                  module.emitRefreshToGivenGUIDs(event.tv)
                });
              }
            }
          });
        }
      }
    });
  };


  this.addNewSheduleEvent = function(event, userId){
    return Promise.all([
      module.setOrientation(event),
      module.setLocalstorage(event)
    ]);
  };

  this.removeEvent = function(data) {
    // DB.query(`
    //   DELETE FROM temp_play
    //   WHERE guid = '${data.guid}'
    //   AND url = '${data.url}'
    //   AND start_date = '${data.start}'
    //   AND end_date = '${data.end}'
    // `)
    return DB.query(`
      DELETE FROM temp_play
      WHERE guid = :GUID
      AND url = :url
      AND start_date = :start_date 
      AND end_date = :end_date 
      `, {GUID: data.guid, url: data.url, start_date: data.start, end_date: data.end}, data.guid);    
  };

  this.getShedule = function(guid) {
    return DB.query(`
      SELECT url, start_date, end_date
      FROM temp_play
      WHERE guid = :guid`, {guid}, guid);
  };

  this.checkUserTVlimit = function(userId){
    var limit = null;
    var quantity = null;

    return DB.query(`
      SELECT tv_limit
      FROM users
      WHERE users.id = :id` , {id: userid}, 'users')
    .then((rows) => {
      if(rows[0].tv_limit){
        limit = rows[0].tv_limit;
        return DB.query(`
          SELECT count(GUID) q
          FROM tv
          WHERE user_id = :id` , {id: userid}, 'tv')
        .then((currentTVQuantity) => {
          if(!isNaN(parseInt(currentTVQuantity[0].q))){
            currentTVQuantity = parseInt(currentTVQuantity[0].q);
            if(parseInt(currentTVQuantity) + 1 > limit){
              return false;
            } else if(parseInt(currentTVQuantity) + 1 <= limit){
              return true;
            }
          }
        });
      } else {
        return false;
      }
    });
  };

  this.addNew = function(userid, body){
    var location = body.location.replace(/'/g,"\\'").replace(/[^\w' \\!-?,]|_/g, '');
    var notes = body.notes.replace(/'/g,"\\'").replace(/[^\w' \\!-?,]|_/g, '');
    var name = body.name.replace(/'/g,"\\'").replace(/[^\w' \\!-?,]|_/g, '');
    return module.checkUserTVlimit(userid)
    .then((status) => {
      if(status){
        var guid = Guid.create().value;
        var idToinput = generateIDtoInput();
        if(body.orientation != "portrait" && body.orientation != "landscape") throw " Wrong orientation type passed. It's either 'portrait' or 'landscape'";
        if(isNaN(parseInt(body.playLocalyStatus))) throw " Wrong type for platfrom localStorage passed. It's either 1 or 0";

        // DB.query(`
        //     INSERT INTO tv
        //     (user_id, guid, input_id, orientation, playLocalyStatus)
        //     VALUES
        //     ('${userid}', '${guid}', '${idToinput}', '${body.orientation}', '${body.playLocalyStatus}')`)
        return DB.query(`INSERT INTO tv
          (user_id, guid, input_id, orientation, playLocalyStatus)
          VALUES
          (:user_id, :guid, :input_id, :orientation, :playLocalyStatus)`, 
          {user_id: userid, guid, input_id: idToinput, orientation: body.orientation, playLocalyStatus: body.playLocalyStatus},guid)
        .then((data) => {
          //  return DB.query(`
          //     INSERT INTO tv_data
          //     (guid ,tv_name, tv_location, tv_note)
          //     VALUES ('${guid}','${name}','${location}','${notes}')`)
          return DB.query(`INSERT INTO tv_data
            (guid ,tv_name, tv_location, tv_note)
            VALUES
            (:guid, :tv_name, :tv_location, :tv_note)`, 
            {guid, tv_name: name, tv_location: location, tv_note: notes}, guid);
        }).then((data) => {
          // return DB.query(`
          //     INSERT INTO fallback
          //     SET guid = '${guid.value}',
          //     url = 'http://dwall.online/views/video/Wallpaper1.png'`
          // )
          return DB.query(`INSERT INTO fallback
            (guid, url)
            VALUES
            (:guid, :url)`, 
            {guid, url: 'http://dwall.online/views/video/Wallpaper1.png'}, guid)
        })
        .then(() => {
          let params = {
            set: {
              video_id: null,
              constant_play: 1,
              playlists_status: 0
            },
            where: {
              guid: guid.value
            }
          }

          const query = DB.prepareQuery(`UPDATE tv`, params);
          let variables = Object.assign({}, params.set, params.where);
          // return DB.query(`
          //     UPDATE tv
          //     SET video_id = null,
          //     constant_play = 1,
          //     playlists_status = 0
          //     WHERE guid = '${guid.value}'
          // `)
          return DB.query(query, variables, guid.value);
        })
        .then(() => {
          return {
            GUID: guid.value,
            location: location,
            notes: notes,
            name: name,
            fallbackURL:"http://dwall.online/views/video/Wallpaper1.png"
          };
        }).catch((err)=>{
          return {"status":"Error while adding new TV. Drats.","Error":err};
        });
      } else {
        throw {"status":" This user is not allowed to have more TV "};
      }
    });
  }


  this.remove = function(userid, guid) {
    let promises = [];
    promises.push(DB.query(`
      DELETE FROM tv
      WHERE tv.guid = :guid`, 
      {guid}, guid
      ));

    promises.push(DB.query(`
      DELETE FROM schedule
      WHERE tv_guid = :guid`, 
      {guid}, guid
      ));

    promises.push(DB.query(`
      DELETE FROM groups
      WHERE GUID = :guid`, 
      {guid}, guid
      ));

    promises.push(uController.resetTVbyGUID(guid));

    // DB.query(`
    //     DELETE FROM tv
    //     WHERE tv.guid = '${guid}'`)
    // .then(() => {
    //     return DB.query(`
    //     DELETE FROM schedule
    //     WHERE tv_guid = '${guid}'`)})
    // .then(() => {
    //     return DB.query(`
    //     DELETE FROM groups
    //     WHERE GUID = '${guid}'`)
    // })
    // .then(() => {
    //     return uController.resetTVbyGUID(guid);
    // })
    // .then(() => { resolve(); })
    // .catch((error) => { reject(error); })
    return Promise.all(promises);
  };

  this.pullMediaIdByURL = function(URL){
    // DB.query(`SELECT id from video where URL = '${URL}'`)
    return DB.query(`
      SELECT
      id
      FROM video
      WHERE URL = :URL`, {URL}, 'video')
    .then((rows) => {
      if(rows[0]){
        return rows[0].id;
      } else {
        return null;
      }
    });
  };

  this.getThumbByURL = function(URL){
    return DB.query(`
      SELECT thumbnail
      FROM video
      WHERE url = :URL`, {URL}, "video")
    .then((rows) => {
      if(rows[0] && rows[0].thumbnail){
        return rows[0].thumbnail;
      } else {
        return null;
      }
    });
  };

  this.saveThumbNailsForURL = function(URL, thumb){
    if(URL && thumb){
      let params = {
        set: {
          thumbnail: thumb
        },
        where: {
          url: URL
        }
      }

      const query = DB.prepareQuery(`UPDATE video`, params);
      let variables = Object.assign({}, params.set, params.where);
      // DB.query(`
      // UPDATE video
      // SET thumbnail = '${thumb}'
      // WHERE url = '${URL}'`)
      DB.query(query, variables, "video")
      .then(() => {
        return thumb;
      })
      .catch((error) => {
        return error    
      });
    } else {
      throw ` Some required parameters are not defined URL:${URL} thumb:${thumb}. Drats. `;
    }
  };

  this.saveVideoUrl = function(urlToAdd, userid) {
    // DB.query(`SELECT checkIfVideoThere(:urlToAdd, :userid)`, {urlToAdd, userid})
    // WHERE users.id = :id)`, {id: userid}, 'users'
    return DB.query(`SELECT checkIfVideoThere(':urlToAdd}', :userid)`, {urlToAdd, userid}, "video")
    .then((data) => {
      var value = 1;
      Object.keys(data[0]).map((e) => {
        value = data[0][e];
      })
      if (value > 0) {
        return urlToAdd;
      }
      if (value == 0) {
        return urlToAdd;
      }
    })
    .catch((error) => {
      return error;
    });
  };

  this.addVideo = function(userid, guid, videoId) {
    return DB.query(`
      INSERT INTO tv
      (video_id, guid, user)
      VALUES
      (:videoId, :guid, :userid)
      `, {videoId, guid, userid}, guid);
  };

  this.addFallBack = function(URL, guid) {
      // DB.query(`
      //   INSERT INTO fallback (guid, url)
      //   VALUES ('${guid}', '${URL}')
      //   ON DUPLICATE KEY UPDATE
      //   url = '${URL}'
      // `)
      return DB.query(`
        INSERT INTO fallback (guid, url)
        VALUES (:guid, :URL)
        ON DUPLICATE KEY UPDATE
        url = :URL
        `, {URL, guid}, guid);
    };

    this.getFallback = function(guid) {
      return DB.query(`SELECT url
        FROM fallback
        WHERE guid = :guid
        `, {guid}, guid)
      .then((data) => {
        if (data[0] && data[0].url) {
          return data[0].url;
        } else {
          throw "No url was found in database responce";
        }
      })
      .catch( (err) => {
        return err;
      });
    };

    this.removeVideo = function(userid, tvData) {
      return DB.query(`DELETE FROM tv
        WHERE tv.video_id = :video_id
        `, {video_id: tvData.videoId}, "tv");
    };

    this.removeVideoURL = function(url) {
    // deleting media content
    var itIsStripe = !isNaN(parseInt(url));

    if (!itIsStripe) { url = url.trim();}
    var url = url;
    var user = null;
    var size = null;
    var thumbnail = null;

    return mController.getWhoMediaBelongsTo(url)
    .then((userId) => {
      user = userId;
      if (itIsStripe) {

      // return DB.runQuery(`
      //     DELETE video, stripes FROM video
      //     JOIN stripes
      //     ON video.stripe_id = stripes.id
      //     WHERE video.id = ${url};`)
      // .then(() => {
      //     return DB.runQuery(`
      //     UPDATE playlists
      //     SET stripe_id = NULL
      //     WHERE stripe_id = ${url}`)})
      // .then(() => {
      //     resolve();})
      // .catch((error) => {
      //     reject(error);
      // })

      let params = {
        set: {
          stripe_id: null
        },
        where: {
          stripe_id: url
        }
      }
      const query = DB.prepareQuery(`UPDATE playlists`, params);
      let variables = Object.assign({}, params.set, params.where);

      return DB.query(`
          DELETE video, stripes FROM video
          JOIN stripes
          ON video.stripe_id = stripes.id
          WHERE video.id = :url
      `, {url} , "video")
      .then(() => {
        return DB.query(query, variables, "playlists")
      })
      .then(() => {
          resolve();})
      .catch((error) => {
          reject(error);
      })


        // let params = {
        //   set: {
        //     stripe_id: null
        //   },
        //   where: {
        //     stripe_id: url
        //   }
        // }
        // const query = DB.prepareQuery(`UPDATE playlists`, params);
        // let variables = Object.assign({}, params.set, params.where);
        
        // return Promise.all([
        //   DB.query(`
        //     DELETE video, stripes FROM video
        //     JOIN stripes
        //     ON video.stripe_id = stripes.id
        //     WHERE video.id = :url ;
        //     `, {video_id: url}, "video"),
        //   DB.query(query, variables, "playlists")
        // ]);




      } else {
        let videoIdToDelete = null
        // return DB.query(`
        // SELECT id FROM video
        // WHERE url = '${url}'`)
        return DB.query(`
          SELECT id, size, thumbnail
          FROM video
          WHERE url = :url
          `, {url}, 'video')
        .then((data) => {

          size = data[0].size
          thumbnail = data[0].thumbnail

          if(data[0].id){ 
            return videoIdToDelete = data[0].id; 
          } else {
            return null;
          }
        })
        .then((videoId) => {
          console.log("REMOVE fallback media if belongs to user")
          return S3BucketController.fallbackRemover(videoIdToDelete)
        })
        .then(() => {
          return DB.query(`
            UPDATE tv
            SET video_id = null
            WHERE video_id = :id`,{id: videoIdToDelete},"tv");
        })
        .then(() => {
          let promises = [];
          // return  DB.query(`
          // DELETE FROM playlists_video
          // WHERE url = '${url}'`)})

          // return DB.query(`
          // DELETE FROM video WHERE url = '${url}'`)})
          promises.push(DB.query(`
            DELETE FROM playlists_video
            WHERE url = :url
            `, {url}, "playlists_video"));

          promises.push(DB.query(`
            DELETE FROM video
            WHERE url = :url
            `, {url}, "video"));
          return Promise.all(promises);
        })
        .then(() => {
          console.log("REMOVE url")
          return S3BucketServise.remover(url)
        })
        .then(() => {
          console.log("REMOVE thumbnail")
          return S3BucketServise.remover(thumbnail)
        })
        .then(() => {
          return mController.expandUserFreeStorage(user, size);
        })

      //   .then(() => {
      //     var fileName = url.split("/")[url.split("/").length - 1];
      //     var extension = fileName.split(".")[fileName.split(".").length - 1];
      //     console.log(" ===> Deleting file...");
      //     console.log(" ===> FileName:" + __dirname + "/../views/video/" + fileName);
      //     console.log(" ");
      //     if(fs.existsSync(__dirname + "/../views/video/" + fileName)){
      //      var stats = fs.statSync(__dirname + "/../views/video/" + fileName);
      //      var fileSize = stats.size;
      //      ;
      //      fs.unlinkSync(__dirname + "/../views/video/" + fileName);
      //      mController.expandUserFreeStorage(user, fileSize);
      //      console.log(" ===> File deleted. ");
      //    };
      //    if(fs.existsSync(__dirname + "/../views/video/thumb-" + fileName.replace(extension, "jpg"))){
      //     var stats = fs.statSync(__dirname + "/../views/video/thumb-" + fileName.replace(extension, "jpg"));
      //     var fileSize = stats.size;
      //     fs.unlinkSync(__dirname + "/../views/video/thumb-" +  fileName.replace(extension, "jpg"));
      //     console.log(" ===> Thumbnail for file also deleted. ");
      //   };
      // })
        .catch((error) => {
          return error;
        });
      }
    });
  };



  this.tempUpdate = function(tvName, tvLocation, tvNote, guid, url, userId, start, end) {
    var url = url.trim();
    module.update(tvName, tvLocation, tvNote, guid, url, userId);

    // DB.query(`
    //  INSERT INTO temp_play (guid, url, start_date, end_date)
    //  VALUES (${guid}, ${url}, ${start}, ${end})
    // `).then(() => resolve(), (e) => reject(e));
    return DB.query(`
      INSERT INTO temp_play (guid, url, start_date, end_date)
      VALUES (:guid, :url, :start_date, :end_date)
      `, {guid, url, start_date: start, end_date: end}, guid);
  };

  this.getPlayInTimeList = () => {
    return DB.query(`SELECT * FROM temp_play`, {}, 'temp_play');
  };

  this.getCurrentPlayInTimeList = (playInTimeList) => {
    var data = {
      playInTimeList: playInTimeList
    }
    return DB.query(`
      SELECT tv.guid, video.url FROM tv
      JOIN video
      ON tv.video_id = video.id;`, {}, 'tv');
  };

  this.updatePlayInTimeList = (data) => {
    // building playlist object
    var playInTimeData = {};
    Object.keys(data.currentPlayList).forEach((e) => {
      playInTimeData[data.currentPlayList[e].guid] = {
        currentURL: data.currentPlayList[e].url,
        shedule: {}
      }
      Object.keys(data.playInTimeList).forEach((e) => {
        Object.keys(data.currentPlayList).forEach((a) => {
          if (data.playInTimeList[e].guid == data.currentPlayList[a].guid) {
            if (playInTimeData[data.playInTimeList[e].guid]) {
              playInTimeData[data.playInTimeList[e].guid].shedule[data.playInTimeList[e].url] = {
                start: data.playInTimeList[e].start_date,
                end: data.playInTimeList[e].end_date
              }
            }
          }
        })
      });
    });
    return playInTimeData;
  };

  this.minorTVupdate = (data, userId) => {
    if(!data.guid) return "Not valid guid has been passed to smallUpdate function. Drats.";
    var guid = data.guid;
    var name = data.name || " ";
    var location = data.location || " ";
    var notes = data.notes || " ";
    var fallBackURL = data.fallbackURL || " ";
    var playLocalyStatus = data.playLocalyStatus || 1;
    var orientation = data.orientation || "landscape";

    let params = {
      set: {
        tv_name: name,
        tv_location: location,
        tv_note: notes
      },
      where: {
        guid
      }
    }

    let params2 = {
      set: {
        playLocalyStatus,
        orientation
      },
      where: {
        guid
      }
    }

    let params3 = {
      set: {
        url: fallBackURL
      },
      where: {
        guid
      }
    }
    let promises = [];
    const query = DB.prepareQuery(`UPDATE tv_data`, params);
    let variables = Object.assign({}, params.set, params.where);
    promises.push(DB.query(query,variables,guid));

    const query2 = DB.prepareQuery(`UPDATE tv`, params2);
    let variables2 = Object.assign({}, params2.set, params2.where);
    promises.push(DB.query(query2,variables2,guid));

    const query3 = DB.prepareQuery(`UPDATE fallback`, params3);
    let variables3 = Object.assign({}, params3.set, params3.where);
    promises.push(DB.query(query3,variables3,guid));
    // DB.query(`
    //  UPDATE tv_data, tv
    //      SET tv_data.tv_name = '${name}',
    //  tv_data.tv_location = '${location}',
    //  tv_data.tv_note = '${notes}',
    //  tv.playLocalyStatus = '${playLocalyStatus}',
    //  tv.orientation = '${orientation}'
    //  WHERE tv_data.guid = '${guid}'
    //  AND tv.guid = '${guid}'`)
    // .then(DB.query(`
    //  UPDATE fallback
    //  SET url = '${fallBackURL}'
    //  WHERE guid = '${guid}'`))
    //     .then(resolve("ok"));
    return Promise.all(promises);
  };

  this.checkTVforConstantPlay = (guid) => {
    if (!guid) {
      return "GUID is not set for checking status function";
    }

    // DB.query(`
    //  SELECT constant_play
    //  FROM tv
    //  WHERE guid = '${guid}'
    // `)
    return DB.query(`
      SELECT constant_play FROM tv
      WHERE guid = :guid`, {guid}, guid)
    .then((d) => {
      if (d[0]) {
        return d[0].constant_play;
      } else {
        throw "Constant play status wasn't found for GUID:" + guid;
      }
    });
  };

  this.checkTVstatus = (guid) => {
    return DB.query(`SELECT
      playlists_status,
      constant_play,
      playing_fallback,
      on_schedule
      FROM tv
      WHERE guid = :guid`, {guid}, guid)
    .then((data) => {
      if (data[0]) {
        return {
          playlists_status: data[0].playlists_status,
          constant_play: data[0].constant_play,
          playing_fallback: data[0].playing_fallback,
          on_schedule: data[0].on_schedule
        };
      } else {
        return {
          playlists_status: false,
          constant_play: false,
          playing_fallback: false,
          on_schedule: data[0].false
        };
      }
    });
  };

  this.emitUpdatesToTV = (data) => {
    var currentDate_string = new Date().toLocaleString();
    console.log("Current date string");

    var date = new Date();

    var videoToPlayInTime = [];
    Object.keys(data).forEach((guid) => {
      var tvName = null;
      var tvLocation = null;
      var tvNote = null;
      var userId = null;
      DB.query(`SELECT tv_name, tv_location, tv_note, user_id FROM tv
        JOIN tv_data
        ON tv.guid = tv_data.guid
        WHERE tv.guid = :guid
        `, {guid}, guid)
      .then((data) => {
        var data = data[0];
        tvName = data.tv_name;
        tvLocation = data.tv_location;
        tvNote = data.tv_note;
        userId = data.user_id;
      });
      if (!Object.keys(data[guid].shedule).length) {
        module.noVideoSheduledHandler(guid);
      } else {
        Object.keys(data[guid].shedule).forEach((url) => {
          var startDate = new Date(data[guid].shedule[url]['start']);
          var endDate = new Date(data[guid].shedule[url]['end']);
          console.log("          NOW: => " + date);
          console.log("  VIDEO_START: => " + startDate);
          console.log("    VIDEO_END: => " + endDate);
          if (date >= startDate && date < endDate) {
            videoToPlayInTime.push(url);
          }
        });
        console.log(videoToPlayInTime);
        if (videoToPlayInTime.length > 1) {
          console.log(" -------- WARNING. OVERLAPS IN SHEDULE for TV " + tvName + " --------");
          console.log(" -------- INFO -------");
          console.log(" GUID:" + guid);
          console.log(" OVERLAPS with videos " + videoToPlayInTime);
          console.log(" Playing the first one ");
          console.log(" ---------- ");
          _videoToPlayInTime = []
          _videoToPlayInTime.push(videoToPlayInTime.shift());
          videoToPlayInTime = _videoToPlayInTime;
          module.checkTVstatus(guid)
          .then((status) => {
            if (!status.constant_play && !status.playlists_status) {
              module.update(tvName, tvLocation, tvNote, guid, url, userId, false);
            } else {
              console.log(`Looks like this TV (${guid}) has some constant content running`);
              console.log(' --------- No further updates -------');
            }
          })
        } else if (videoToPlayInTime.length == 0) {
          module.noVideoSheduledHandler(guid)
        } else if (videoToPlayInTime.length == 1) {
          console.log(" -------- Got video sheduled for now --------");
          console.log(" --- " + videoToPlayInTime[0] + " --- ");
          module.checkIfCurrentVideoTheSame(guid, videoToPlayInTime[0])
          .then((status) => {
            if (status) {
              console.log("That video is already running on TV");
              console.log("NO further update");
              console.log(" --------------------------------- ");
            } else {
              module.checkTVstatus(guid)
              .then((status) => {
                if (!status.constant_play && !status.playlists_status) {
                  module.playInTimeUpdate(guid, videoToPlayInTime[0]);
                } else {
                  console.log(" ------------------------------------  ");
                  console.log(` Looks like this TV (${guid}) has some constant content running`);
                  console.log(' --------- No further updates -------  ');
                }
              })
            }
          })
        }
      }
    });
  };

  this.addNewStripe = (userId, body) => {
    body.text = body.text.replace(/'/g,"\\'");
    //body.text = body.text.replace(/'/g,"\\'").replace(/[^\w' \\!-?,]|_/g, '');
    var stripeName = body.name;
    var stripeNote = body.note;

    // DB.query(`
    //  INSERT INTO stripes (text_data)
    //  VALUES ('${body.text}')`)
    return DB.query(`
      INSERT INTO stripes (text_data)
      VALUES (:text_data)
      `, {text_data: body.text}, "stripes")
    .then((data) => {
      // DB.query(`
      // INSERT INTO video (stripe, stripe_id, user_id, media_name, note, size)
      // VALUES ('1', ${data.insertId}, '${userId}', '${stripeName}', '${stripeNote}', '${Buffer.byteLength(body.text, 'utf8')}')`)
      return DB.query(`
        INSERT INTO video (stripe, stripe_id, user_id, media_name, note, size)
        VALUES ('1', :stripe_id, :user_id, :media_name, :note, :size) 
        `,
        {stripe_id: data.insertId, user_id: userId, media_name: stripeName, note: stripeNote, size: Buffer.byteLength(body.text, 'utf8')}, "video");
    });
  };


  this.pullMyStripes = (userId) => {
    return DB.query(`
      SELECT video.id, stripes.text_data
      FROM video
      JOIN stripes
      ON stripes.id = video.stripe_id
      WHERE video.user_id = :user_id`, {user_id: userId}, "video")
    .then((data) => {
      return data;
    })
    .catch((e) => {return e;});
  };


  this.setStripeColors = (userID, playlistID, stripeColor, stripeBG) => {

    let params = {
      set: {
        stripe_color: stripeColor,
        stripe_background: stripeBG 
      },
      where: {
        id: playlistID,
        user_id: userID
      }
    }

    const query = DB.prepareQuery(`UPDATE playlists`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    //  UPDATE playlists
    //  SET stripe_color = '${stripeColor}',
    //  stripe_background = '${stripeBG}'
    //  WHERE id = '${playlistID}'
    //  AND user_id = '${userID}'`)
    return DB.query(query, variables, "playlists");
  };

  this.deleteStripe = (userId, stripeID) => {
    let params = {
      set: {
        stripe_id: null
      },
      where: {
        user_id: userId,
        stripe_id: stripeID
      }
    }

    const query = DB.prepareQuery(`UPDATE playlists`, params);
    let variables = Object.assign({}, params.set, params.where);
    //   DB.query(`
    //   UPDATE playlists
    //   SET stripe_id = null
    //   WHERE user_id = '${userId}'
    //   AND stripe_id = '${stripeID}'`)
    //   .then(DB.query(`
    //   DELETE video, stripes from video
    //   JOIN stripes
    //   ON video.stripe_id = stripes.id
    //   WHERE stripe_id is not null
    //   AND video.id = ${stripeID}`))
    return Promise.all([
      DB.query(query, variables, "playlists"),
      DB.query(`
        DELETE video, stripes from video
        JOIN stripes
        ON video.stripe_id = stripes.id
        WHERE stripe_id is not null
        AND video.id = :stripeID
        `,{stripeID},"video")
      ]);
  };


  this.addStripeToPlayList = (userID, playlistID, stripeID, emitNotify = true ) => {

    let params = {
      set: {
        stripe_id: stripeID
      },
      where: {
        id: playlistID
      }
    }

    const query = DB.prepareQuery(`UPDATE playlists`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    //  UPDATE playlists
    //  SET stripe_id = :stripe
    //  WHERE id = :id`, {id: playlistID, stripe: stripeID})
    return DB.query(query, variables, "playlists")
    .then(() => {
      return DB.query(`SELECT input_id, guid FROM tv
        JOIN playlists
        ON playlists.id = tv.playlist_id
        WHERE tv.playlists_status = 1
        AND tv.playlist_id = :id
        AND tv.user_id = :user`, {id: playlistID, user: userID}, "tv");
    })
    .then((data) => {
      if (data.length && emitNotify) module.emitRefreshToGivenGUIDs(data[0].guid);
      return;
    });
  };

  this.checkIfCurrentVideoTheSame = (guid, url) => {
    return module.getUserIDfromGUID(guid)
    .then((id) => {
      var videoToPlayID = null;
      var currentVideoID = null;
      return module.getVideoIDbyURLandUser(url, id)
    })
    .then((id) => {
      videoToPlayID = id;
      return module.getCurretVideoID(guid)
    })
    .then((currentID) => {
      if (currentID == videoToPlayID) {
        return true;
      } else {
        return false;
      }
    })
  }

  this.getCurretVideoID = (guid) => {
    return DB.query(`SELECT video_id
      FROM tv
      WHERE guid = :guid`, {guid}, guid)
    .then((d) => {
      if (d[0] && d[0].video_id) {
        return d[0].video_id;
      } else {
        return null;
      }
    });
  }

  this.noVideoSheduledHandler = (guid) => {
    return module.checkingFallbackNecessity(guid)
    .then((status) => {
      if (status) return module.getFallback(guid);
      return null;
    })
    .then((url) => {
      if (url) return module.emitFallBack(url, guid);
      return null;
    });
  };

  this.emitFallBack = (url, guid) => {
    return module.getUserIDfromGUID(guid)
    .then((id) => {
      return module.getVideoIDbyURLandUser(url, id)
    })
    .then((id) => {
      let params = {
        set: {
          on_schedule: null,
          playlists_status: 0,
          constant_play: null,
          playing_fallback: 1
        },
        where: {
          id: id 
        }
      }

      const query = DB.prepareQuery(`UPDATE tv`, params);
      let variables = Object.assign({}, params.set, params.where);
      // return DB.query(`
      // UPDATE tv
      // SET on_schedule = null,
      // playlists_status = 0,
      // constant_play = null,
      // playing_fallback = 1,
      // video_id = '${id}'
      // `)
      return DB.query(query, variables, "tv");
    })
    .then(() => {
      module.emitToTV(guid, "URL", { URL: url });
      return;
    });
  };

  this.checkingFallbackNecessity = (guid) => {
    return DB.query(`SELECT
      playlists_status,
      constant_play,
      on_schedule,
      playing_fallback
      FROM tv
      WHERE guid = :guid `, {guid}, guid)
    .then((d) => {
      if (d[0]) {
        if (d[0].playlists_status == "0" && d[0].constant_play == "0" && d[0].playing_fallback == "0" && d[0].on_schedule == "1") {
          return true;
        }
        if (d[0].playlists_status == "0" && d[0].constant_play == "0" && d[0].playing_fallback == "0" && d[0].on_schedule == "0") {
          return true;
        } else {
          return false;
        }
      } else {
        return "NO TV was found under GUID " + guid;
      }
    });
  };

  this.pullTVconnection = (guid) => {
    return new Promise((resolve, reject) => {
      var connectionStore = require("../app.js");
      if (connectionStore[guid].connection) {
        resolve(connectionStore[guid].connection);
      } else {
        reject();
      }

    })
  };

  this.emitToTV = (guid, event, data) => {
    return module.pullTVconnection(guid);
  };

  this.playInTimeUpdate = (guid, url) => {
    return module.getUserIDfromGUID(guid)
    .then((id) => {
      return module.getVideoIDbyURLandUser(url, id)
    })
    .then((id) => {
      let params = {
        set: {
          on_schedule: 1,
          playlists_status: 0,
          constant_play: null,
          playing_fallback: null,
          playlists_status: 0,
          video_id: id
        },
        where: {
          id: playlistID
        }
      }

      const query = DB.prepareQuery(`UPDATE tv`, params);
      let variables = Object.assign({}, params.set, params.where);
      //     return DB.query(`
      //  UPDATE tv
      //  SET on_schedule = 1,
      //  playlists_status = 0,
      //  constant_play = null,
      //     playing_fallback = null,
      //     playlists_status = 0,
      //  video_id = '${id}'
      // `)
      return DB.query(query, variables, guid);
    })
    .then(() => {
      module.emitToTV(guid, "URL", { URL: url })
    });
  };

  this.getVideoIDbyURLandUser = (url, userId) => {
    return DB.query(`
     SELECT id
     FROM video
     WHERE url = :url
     AND user_id = :userId 
     `, {url, userId}, 'video')
    .then((d) => {
      if (d[0] && d[0].id) {
        return d[0].id;
      } else {
        return null;
      }
    });
  };

  this.getUserIDfromGUID = (guid) => {
    return DB.query(`
      SELECT user_id
      FROM tv
      WHERE guid = :guid
      `, {guid}, guid)
    .then((d) => {
      if (d[0] && d[0].user_id) {
        return d[0].user_id;
      } else {
        return null;
      }
    });
  };

  this.getPlaylistStatus = (guid) => {
    return DB.query(`
      SELECT playlists_status
      FROM tv
      WHERE guid = :guid
      `, {guid}, guid)
    .then((data) => {
      if (data[0]) {
        return data[0].playlists_status;
      } else {
        return 0;
      }
    });
  };

  this.stashPreviousURL = (guid) => {
    return DB.query(`
      SELECT video.url,
      tv.guid
      FROM tv
      JOIN video
      ON tv.video_id = video.id
      WHERE tv.guid = :guid
      `, {guid}, guid)
    .then((data) => {
      return module.putURLinStash(data)
    });
  };

  this.addVideoToTempPlay = (guid, url, start, end) => {
    // DB.query(`
    //  INSERT INTO temp_play (guid, url, start_date, end_date)
    //  VALUES ('${guid}', '${url}', '${start}', '${end}')
    // `)
    return DB.query(`INSERT INTO temp_play (guid, url, start_date, end_date)
      VALUES (:guid, :url, :start_date, :end_date)
      `, {guid, url, start_date: start, end_date: end}, guid);
  };

  this.putURLinStash = (data) => {
    var url = data[0].url;
    var guid = data[0].guid;
    return DB.query(`
     SELECT * FROM stash_video
     WHERE guid = :guid
     `, {guid}, guid)
    .then((data) => {
      if (data.length == 0) {
        return DB.query(`
         INSERT INTO stash_video (guid, url)
         VALUES (:guid, :url)
         `, {guid, url}, guid);
      } else {
        let params = {
          set: {
            url
          },
          where: {
            guid
          }
        }

        const query = DB.prepareQuery(`UPDATE stash_video`, params);
        let variables = Object.assign({}, params.set, params.where);
        // DB.query(`
        //  UPDATE stash_video
        //  SET url = '${url}'
        //  WHERE guid = '${guid}'
        // `)
        return DB.query(query, variables, guid);
      }
    });
  };

  this.update = function(tvName, tvLocation, tvNote, guid, url, userId, partialUpdate, playList_status, playList_id, constant_play, orientation) {
    var playListStatus = playList_status == "true" ? 1 : 0;
    constant_play = (constant_play == "true" ? 1 : 0);
    var playList_id = isNaN(playList_id) ? 0 : playList_id;
    var orientation = orientation ? orientation : 'landscape';


    let params_tv_data = {
      set: {
        tv_name: tvName,
        tv_location: tvLocation,
        tv_note: tvNote,
      },
      where: {
        guid
      }
    }

    let params_tv = {
      set: {
        orientation
      },
      where: {
        guid 
      }
    }

    const query_tv = DB.prepareQuery(`UPDATE tv`, params_tv);
    let variables_tv = Object.assign({}, params_tv.set, params_tv.where);
    const query_tv_data = DB.prepareQuery(`UPDATE tv_data`, params_tv_data);
    let variables_tv_data = Object.assign({}, params_tv_data.set, params_tv_data.where);


    Promise.all([
      DB.query(query_tv, variables_tv, guid),
      DB.query(query_tv_data, variables_tv_data, guid)
      ])
    .then(() => {
      if (partialUpdate) {
        let params = {
          set: {
            playlists_status: playListStatus,
            playlist_id,
            constant_play
          },
          where: {
            guid
          }
        }

        let query = DB.prepareQuery(`UPDATE tv`, params);
        let variables = Object.assign({}, params.set, params.where);
        // DB.query(`
        //       UPDATE tv
        //       SET
        //       playlists_status = '${playListStatus}',
        //       playlist_id = '${playList_id}',
        //       constant_play = '${constant_play}'
        //       WHERE guid = '${guid}'
        //         `)
        return DB.query(query, variables, guid);
      } else {
        // involves play video right now or run playlist right now
        return DB.query(`select checkIfVideoThere(:url, :userId)`, {url, userId}, "video")
        .then((data) => {
          var value = 1;
          Object.keys(data[0]).map((e) => {
            value = data[0][e];
          })
          if (value > 0) {
            return true;
          }
          if (value == 0) {
            console.log(` ------ Subscribing ${url} video to user ${userId} ------`)
            return true;
          }
          return false;
        })
        .then((data) => {
          return DB.query(`
            select id from video
            where url = :url
            `, {url}, "video")
        })
        .then((d) => {
          var video_id = d[0].id || 0;

          let params = {
            set: {
              video_id: video_id,
              playlists_status: playListStatus,
              playlist_id: playList_id || 0,
              constant_play: constant_play,
              on_schedule: null,
              playing_fallback: 0
            },
            where: {
              guid
            }
          }

          let query = DB.prepareQuery(`UPDATE tv`, params);
          let variables = Object.assign({}, params.set, params.where);

          //  DB.query(`
          //  UPDATE tv
          //  SET video_id: video_id}',
          //  playlists_status = '${playListStatus}',
          //  playlist_id = '${playList_id || 0}',
          //  constant_play = '${constant_play}',
          //  on_schedule = null,
          //  playing_fallback = 0
          //  WHERE guid = '${guid}'
          // `)
          return DB.query(query, variables, guid);
        });
      }
    });
  };

  this.notifyTv = function(guid, url, order, duration) {
    //DEPRICATED
    return;
  };

  this.sendScheduleToGroup = function(GROUP_ID, schedule, DUID){
    pullAllGUIDFromGroup(GROUP_ID)
    .then((data) => {
      if(data.length > 0){
        data.map((el) => {
          module.sendScheduleToTv(el.GUID, schedule, DUID);
        })
      }
    })
  };

  this.sendScheduleToTv = function(GUID, schedule, DUID){
    //DEPRICATED
    return;
  };

  this.createIdToInput = function(userid) {
    var idToinput = generateIDtoInput();


    let params = {
      set: {
        id_to_input: idToinput
      },
      where: {
        id: userid
      }
    }

    let query = DB.prepareQuery(`UPDATE users`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    //  UPDATE users
    //  SET id_to_input = '${idToinput}'
    //  WHERE id = '${userid}'
    //     `)
    return DB.query(query, variables, "users");

  };

  this.runScheduleOnTV = function(GUID, DUID){

    var GROUP_ID = null;
    const pullSchedule_ = (GUID, group_id) => {
      return new Promise((resolve, reject) => {
        var bufferResult = [];

        let myQuery;
        let mask;

        if (GUID){
          myQuery = `SELECT * FROM schedule WHERE tv_guid = :GUID`;
          mask = GUID;
        } else {
          myQuery = `SELECT * FROM schedule WHERE group_id = :group_id`
          mask = "schedule";
        }

        // DB.query(`
        // SELECT * FROM schedule
        // WHERE ${ GUID ? " tv_guid = '" + GUID + "'": " group_id = '" + group_id + "'" }`)
        DB.query(myQuery, {GUID, group_id}, mask)
        .then((data) => {
          if(data.length > 0){
            data.forEach((el) => {
              if(el.playlist_id){
                bufferResult.push(module.pullAllVideosFromPlayList(el.user_id, el.playlist_id))
              } else if(!el.playlist_id){
                bufferResult.push({
                  "URL":el.URL,
                  "mediaType": this.detectMediaType({
                    url: el.URL
                  }),
                  "start":el.start,
                  "end":el.end
                });
              }
            });
            bufferResult.push({data});
            Promise.all(bufferResult)
            .then((values) => {
              var playListInfo = values.pop().data;
              playListInfo = playListInfo.filter((el) => {if(el.playlist_id){return el}});
              playListInfo.forEach((el) => {el["stripe"] = ""});

              values.unshift([]);
              var stripesQueue = [];
              var overlayQueue = [];
              var videos = values.reduce((a,b) => a.concat(b)).map((el) => {if(!el.list_id){return el}}).filter((el) => el !== undefined);
              var playlistData = values.reduce((a,b) => a.concat(b)).map((el) => {if(el.list_id){return el}}).filter((el) => el !== undefined);
              playlistData = playlistData.map(el => JSON.stringify(el)).filter((elem, index, array) => {return index == array.indexOf(elem)}).map(el => JSON.parse(el));
              playListInfo.forEach(function(el){
                if(el.playlist_id){
                  stripesQueue.push(pullStripeDataForPlayList(el.playlist_id));
                  stripesQueue.push(mController.playlistHasRSS(el.playlist_id));
                  overlayQueue.push(module.determinePlaylistsOverlay(el.playlist_id));
                }
              });
              playListInfo.forEach((el) => {
                if(el.playlist_id){
                  playlistData.forEach((elem) => {
                    if(elem.list_id == el.playlist_id){
                     if(el["playList"]){
                       el["playList"].push(elem);
                     } else {
                       el["playList"] = [];
                       el["playList"].push(elem);
                     }
                   }
                 })
                }
              });

              Promise.all(overlayQueue)
              .then(overlays => {
                playListInfo.forEach(playlist => {
                  if (playlist.playlist_id) {
                    const overlay = overlays.find(o => o.playlistId === playlist.playlist_id) || {};
                    playlist.overlay = overlay;
                  }
                })
                var time = new Date();
                Promise.all(stripesQueue)
                .then((values) => {
                  values.forEach((el, i, a) => {
                    if(!Array.isArray(el)){ a[i] = [el]; }
                  })
                  var stripeInfo = {};
                  ;
                  values.forEach((el) => {
                    el.forEach((e) => {
                      if(e.playlist_id){
                        stripeInfo[e.playlist_id] = e;
                      }
                      if(e.rss){
                        stripeInfo[e.id] = e;
                      }
                    })
                  })
                  playListInfo.forEach((el) => {
                    if(el.playlist_id){
                      if(stripeInfo[el.playlist_id]){
                        if(!stripeInfo[el.playlist_id].rss){
                          el.stripe = {
                            text:stripeInfo[el.playlist_id].text_data,
                            color:stripeInfo[el.playlist_id].stripe_color,
                            bg_color:stripeInfo[el.playlist_id].stripe_background
                          }
                          el.rss = {}
                        } else {
                          ;
                          el.rss = {
                            url:stripeInfo[el.playlist_id].url,
                            color:stripeInfo[el.playlist_id].stripe_color,
                            bg_color:stripeInfo[el.playlist_id].stripe_background,
                            rss_update_interval:stripeInfo[el.playlist_id].rss_update_interval
                          }
                          el.stripe = {}
                        }
                      }
                    }
                  })
                  var result = videos.concat(playListInfo);
                  result = result.sort((a,b) => { return new Date(a.start) - new Date(b.start)});
                  console.log(" === Schedule to send ===");
                  console.log(JSON.stringify([time.toUTCString()].concat(result)));
                  console.log(" === === === === ");
                  resolve([time.toUTCString()].concat(result));
                })
              })
            })
.catch((error) => {
  console.log(" Error ");
  reject(error);
})
} else {
  var now = new Date();
  var nowPlusYear = new Date();
  ;
  nowPlusYear = new Date(nowPlusYear.setFullYear(nowPlusYear.getFullYear() + 1));
  tvDataController.getFallbackForTVbyGUID(GUID)
  .then((media) => {
    console.log('[TRY MEDIA FALLBACK]')
    if(media && media.url){
      var inCaseOfEmtySchedule = {
        URL: media.url,
        mediaType: this.detectMediaType({
          url: media.URL
        }),
        end:nowPlusYear.toISOString(),
        start:now.toISOString()
      }
    } else {
      var inCaseOfEmtySchedule = {
        URL: process.env.fallbackURL,
        mediaType: this.detectMediaType({
          url: process.env.fallbackURL
        }),
        end:nowPlusYear.toISOString(),
        start:now.toISOString()
      }
    }
    resolve([now.toUTCString(), inCaseOfEmtySchedule]);
  })
}
})
.catch((error) => {
  console.log(error);
  reject(error);
});
})
};
return new Promise((resolve, reject) => {
  module.checkGroupStatus(GUID)
  .then((data) => {
    var dProp = Object.keys(data).map((el) => { return data[el] })
    if(dProp.length > 0){
      GROUP_ID = data.group_id;
      return pullSchedule_(null, data.group_id);
    } else {
      return pullSchedule_(GUID, null);
    }
  })
  .then((schedule) => {
    if(schedule && !GROUP_ID){
      module.sendScheduleToTv(GUID, schedule, DUID)
    }
    if(schedule && GROUP_ID){
      module.sendScheduleToGroup(GROUP_ID, schedule, DUID);
    }
    resolve();
  })
  .catch((error) => reject(error))
});

function pullScheduleByGroupId(groupId){
  var result  = {}
  return DB.query(`
    SELECT * FROM schedule
    WHERE group_id = :groupId`, {groupId}, "schedule");
};
};
  //
  this.addPlayList = function(userid, tvData) {
    // coming soon...
    return new Promise(function(resolve, reject) {;
    });
    //thanks God that you protect me at this case.
  };

  this.playInTime = (userid, tvData) => {
    var url = tvData.url;
    var start = tvData.start_date;
    var end = tvData.end_date;
    var guid = tvData.guid;

    return DB.query(`
      INSERT INTO playlist
      (guid, url, start_date, end_date)
      VALUES
      (:guid, :url, :start_date, :end_date)
      `, {guid, url, start_date: start, end_date: end}, guid);
  };

  this.removePlayList = function(userid, tvData) {
    // coming soon...
    return new Promise(function(resolve, reject) {;
    });
  };

  this.placeHolder = function(req, res) {
    res.send({ "Status": "Placeholder function was triggered" });
  };

  this.pullInputFromGUID = function(guid) {
    return DB.query(`
      SELECT input_id
      FROM tv
      WHERE
      guid = :guid
      `, {guid}, guid)
    .then((d) => {
      if (d[0] && d[0].input_id) {
        return d[0].input_id;
      } else {
        return null;
      }
    });
  };

  this.giveMeStripe = function(id) {
    return DB.query(`
      SELECT playlists_status, playlist_id FROM tv
      WHERE input_id = :id`, {id}, "tv")
    .then((data) => {
      if (data[0].playlists_status != 0) {
        var listID = data[0].playlist_id;
        return DB.query(`
          SELECT stripes.text_data, video.id, playlists.id list_id, playlists.stripe_color, playlists.stripe_background
          FROM video
          JOIN stripes
          ON video.stripe_id = stripes.id
          LEFT join playlists
          ON playlists.stripe_id = video.id
          WHERE playlists.id is not null
          AND playlists.id = :listID;
          `, {listID}, "video");
      } else {
        return [];
      }
    })
    .then((data) => {
      if (data.length) {
        return {
          text: data[0].text_data,
          color: data[0].stripe_color,
          bg_color: data[0].stripe_background
        };
      }
    });
  }

  this.giveMeVideoURL = function(id, lastVideoId) {
    // Analise if this tv have a playlist subscribed to
    // and give either next video from list
    // or regular URL video
    var regularURL = null;
    if (!lastVideoId && lastVideoId != "0") {
      lastVideoId = -1;
    }
    return new Promise((resolve, reject) => {
      DB.query(`
       SELECT video.url,
       tv.playlists_status
       FROM tv
       INNER JOIN video
       ON tv.video_id = video.id
       WHERE input_id = :id;
       `, {id}, "tv").then((d) => {
        console.log(`URL for user ${id} is ${d[0].url}`);
        var regularURL = d[0].url;
        var playListStatus = d[0].playlists_status;
        if (!playListStatus) {
          resolve(({ URL: regularURL }))
        } else {
          DB.query(`
            SELECT DISTINCT(playlists_video.url) playlist_url,
            playlists_video.v_order,
            playlists_video.duration
            FROM tv
            JOIN video
            ON tv.video_id = video.id
            JOIN playlists
            ON tv.playlist_id = playlists.id
            JOIN playlists_video
            ON playlists.id = playlists_video.playlist_id
            WHERE v_order >= :lastVideoId 
            AND tv.input_id = :id 
            ORDER BY playlists_video.v_order ASC
            LIMIT 1;
            `, {lastVideoId, id}, "tv").then((d) => {
              if (d[0]) {
                var order = d[0].v_order;
                var newURL = d[0].playlist_url;
                var duration = d[0].duration;
              }
              if (!newURL && playListStatus) {
                DB.query(`
                  SELECT DISTINCT(playlists_video.url) playlist_url,
                  playlists_video.v_order,
                  playlists_video.duration
                  FROM tv
                  JOIN video
                  ON tv.video_id = video.id
                  JOIN playlists
                  ON tv.playlist_id = playlists.id
                  JOIN playlists_video
                  ON playlists.id = playlists_video.playlist_id
                  WHERE v_order = 0
                  AND tv.input_id = :id 
                  ORDER BY playlists_video.v_order ASC
                  LIMIT 1;
                  `, {id}, "tv").then((d) => {
                    if (d[0]) {
                      var order = d[0].v_order;
                      var newURL = d[0].playlist_url;
                      var duration = d[0].duration;
                    }
                    if (!newURL) {
                      newURL = regularURL;
                    }
                    resolve({ URL: newURL, order: order, duration: duration });
                  });
                } else {
                  resolve({ URL: newURL, order: order, duration: duration });
                }
              })
          }
        });
     });
  }

  this.giveMeGuid = function(input) {
    return DB.query(`
      SELECT guid
      FROM tv
      WHERE input_id = :input
      `, {input}, 'tv')
    .then((data) => {
      if(data[0] && data[0].guid){
        return data[0].guid;
      } else {
        return null;
      }
    });
  };

  this.giveMeUserId = function(email) {
    return DB.query(`
     SELECT id
     FROM users
     WHERE email = :email 
     `, {email}, "users")
    .then((data) => {
      return data[0].id;
    });
  };

  this.pullAllMediaURLForUser = function(userID){
    return DB.query(`
      SELECT url FROM video
      WHERE user_id = :userID`, {userID}, "video");
  };

  this.saveThumbNailURL = function(){

  };

  this.localMeidaUpload = function(req) {
    return new Promise((resolve, reject) => {
      var form = new formidable.IncomingForm();
      var mediaName = null;
      var fileName = null;
      var thumbFileName = null;
      var generatedID;
      var filePath = null;
      var size = null;
      var duration = null;
      var dimensions = null
      form.parse(req);
      form.on('fileBegin', function(name, file) {
        generatedID = generateIDtoInput();
        file.path = "views/video/" +  generatedID + file.name.replace(/[^\w' \\!-?,]|_/g, '');
        fileName = file.path;
        mediaName = name;
        thumbFileName = "views/video/" + "thumb-" + generatedID + file.name.replace(/[^\w' \\!-?,]|_/g, '');

      });
      form.on('file', function(name, file) {
        size = file.size;
        filePath = file.path;
        console.log('Uploaded: ' + file.name);
        console.log('With Name: ' + name);
        var adress = "http://" + req.headers.host + "/";
        console.log(" ---- ---- ---- ");
        console.log(` Media content URL is set to ${adress}/${fileName}`);
        console.log(" ---- ---- ---- ");
        return new Promise((resolve, reject) => {
          if (file.type.startsWith("image")) {
            gm(file.path)
            .size(function(err, size) {
              dimensions = `${size.width} × ${size.height}`;
            })
            .scale(450)
            .quality(70)
            .write(thumbFileName, function (err) {
              if (err) {
                console.log('error: ', err);
                reject();
              } else {
                console.log('Done')
                resolve();
              };
            });
          }  else if (file.type.startsWith("video")) {
            var noExt = file.name.replace(/[^\w' \\!-?,]|_/g, '').slice(0, file.name.replace(/[^\w' \\!-?,]|_/g, '').lastIndexOf('.'));
            var thumbName = 'thumb-' + generatedID + noExt + '.jpg';
            thumbFileName = 'views/video/' + thumbName;
            ffmpeg(file.path)
            .on('filenames', function(filenames) {
              console.log('Will generate ' + filenames.join(', '))
            })
            .on('end', function() {
              console.log('Screenshots taken');
              resolve();
            })
            .on('error', function(err) {
              console.log(err);
              reject();
            })
            .screenshots({
              timestamps: [ '50%' ],
              filename: thumbName,
              size: '600x?',
              folder: './views/video/',
            })
            .ffprobe(file.path, function(err, metadata) {
              duration = metadata.format.duration;
              dimensions = `${metadata.streams[0].width} × ${metadata.streams[0].height}`
            })
          }
        }).then((data) => {
          console.log({duration, dimensions, size, name: mediaName, fileLocation: adress + fileName + "", thumbFileLocation: adress + thumbFileName + ""})
          resolve({duration, dimensions, size, name: mediaName, fileLocation: adress + fileName + "", thumbFileLocation: adress + thumbFileName + ""});
        }).catch((err) => {
          console.log('error: ', err)
        })
      });
    });
  };

  this.runVideoFromLocalStorageOnTV = function(URL, GUID, DUID) {
    return module.runVideoLocallyFromTV(URL, GUID, DUID);
  };

  this.runVideoLocallyFromTV = function(URL, GUID, DUID) {
    return;
  };

  this.pullStripeForList = function(listId){
    return DB.query(`
      SELECT stripes.text_data, video.id, playlists.id list_id, playlists.stripe_color, playlists.stripe_background
      FROM video
      JOIN stripes
      ON video.stripe_id = stripes.id
      LEFT join playlists
      ON playlists.stripe_id = video.id
      WHERE playlists.id is not null
      AND playlists.id = :listId`, {listId}, "video")
    .then((data) => {
      if(data[0]){
        return {
          text:data[0].text_data, 
          color:data[0].stripe_color, 
          bg_color:data[0].stripe_background
        };
      } else {
        return " ";
      }
    });
  };

  this.runListFromLocalStorage = function(userId, GUID, listID, DUID){
    var result = {
      playList:null,
      stripe:null,
      rss:{},
      overlay: {}
    };
    return module.determinePlaylistsOverlay(listID)
    .then(overlay => {
      result.overlay = overlay || {};
      return module.pullAllVideosFromPlayList(userId, listID);
    })
    .then((videos) => {
      videos = videos.filter((el) => {
        if(el.url != "null"){return el}
      });
      result.playList = videos;
      return mController.playlistHasRSS(listID);
    })
    .then((rssInfo) => {
      if(!rssInfo){
        return module.pullStripeForList(listID);
      }
      else {
        return(rssInfo)
      }
    })
    .then((info) => {
      if(info.rss == 1){
        info["color"] = info.stripe_color;
        info["bg_color"] = info.stripe_background;
        result.rss = info;
      } else { result.stripe = info; }
      result.playList = videos;
      module.emitRefreshToGivenGUIDs(GUID);
      return result;
    })
    .catch((error) => {
      return error;
    });
  };

  this.pullMediaFromGroup = function(groupId){
    if(!groupId) return "No groupId was passed to pullMediaFromGroup. Drats.";
    return DB.query(`
      SELECT url, playlist_id FROM groups
      JOIN groups_desc
      ON groups.group_id = groups_desc.group_id
      WHERE groups.group_id = :groupId`, {groupId}, "groups")
    .then((data) => {
      if(data[0]){ return data[0];}
      else { return {playlistId:null, url:null};}
    });
  };

  this.detectMediaType = (item) => {
    const types = {
      webPage: 'webPage',
      image: 'image',
      video: 'video'
    }
    const formats = {
      image: ['jpg', 'jpeg', 'png', 'tiff', 'bmp'],
      video: ['mp4', 'avi', 'ogg', 'webm', 'mpg', 'mov' , '3gp']
    }
    var type;
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

  this.pullAllVideosFromPlayList = function(userId, listId){       
    return DB.query(
      `SELECT PLV.url, PLV.v_order, PLV.playlist_id as list_id, PLV.duration AS timeout, video.web_page
      FROM playlists_video AS PLV 
      LEFT JOIN video
      ON PLV.url = video.url AND PLV.url = video.web_page
      WHERE playlist_id = :listId
      ORDER BY v_order ASC;`, {listId}, 'playlists_video'
      ) 
    .then((data) => {
      if(data.length > 0){
        const mapped = data.map((item) => {
          return {
            url: item.url,
            v_order: item.v_order,
            list_id: item.list_id,
            mediaType: this.detectMediaType(item),
            timeout: item.timeout
          }
        })
        return mapped;
      }
      else{
        return [];
      }
    });
  };

  this.determinePlaylistsOverlay = function(listId) {
    return DB.query(`
      SELECT overlay_id
      FROM playlists
      WHERE id = :listId`, {listId}, "playlists")
    .then((overlay) => {
      if (!overlay || !overlay.length) {
        return Promise.resolve({});
      };
      const overlayId = overlay[0].overlay_id;
      return DB.query(`
        SELECT overlay, id, url
        FROM video
        WHERE id = :overlayId`, {overlayId}, "video")
    })
    .then(result => {
      const overlay = result && result[0] ? result[0] : {};
      if (Object.keys(overlay).length) {
        overlay.overlayType = overlay.url ? 'image' : 'overlay';
        overlay.playlistId = listId;
      }
      return overlay;
    });
  }

  this.checkGroupStatus = function(GUID){
    return DB.query(`
     SELECT groups_desc.url, groups_desc.playlist_id, groups_desc.group_id
     FROM groups_desc
     JOIN groups
     ON groups.group_id = groups_desc.group_id
     WHERE groups.guid = :GUID`, {GUID}, GUID)
    .then((data) => {
     if(data.length > 0){
       return data[0];
     } else {
       return {};
     }
   });
  };

  this.pullMyGroups = function(userId){
    return DB.query(`
      SELECT
      groups_desc.group_id,
      url,
      playlist_id,
      name,
      description,
      user_id,
      id,
      groups_desc.on_schedule on_schedule,
      GUID,
      playing_fallback,
      userId,
      groups.group_id tvGroup
      FROM groups_desc
      LEFT JOIN groups
      ON groups_desc.group_id = groups.group_id
      WHERE groups_desc.user_id = :userId`, {userId})
    .then((data) => {
      if(!data.length) return [];
      var result = {};
      data.forEach((element) => {
        if(!result[element.group_id]){
          result[element.group_id] = {
            tvList:{}
          };
        };
        if(!result[element.group_id].playing_fallback){
          result[element.group_id]["playing_fallback"] = element.playing_fallback;
        }
        if(!result[element.group_id].URL){
          result[element.group_id]["URL"] = element.url;
          if(!result[element.group_id].playlist_id){
            result[element.group_id]["playlist_id"] = element.playlist_id;
          }
        };
        if(!result[element.group_id].id){ result[element.group_id]["id"] = element.group_id };
        if(!result[element.group_id].name){ result[element.group_id]["name"] = element.name; };
        if(!result[element.group_id].on_schedule){ result[element.group_id]["on_schedule"] = element.on_schedule; };
        result[element.group_id].tvList[element.GUID] = element.GUID;
      });
      return result;
    });
  };

  this.createGroup = function(userId, groupData){
    if(!userId) return " userId wasn't found ";
    return uController.getFallbackByUserId(userId)
    .then((userFallBack) => {
      if(!groupData.url && !groupData.playlist_id && userFallBack && userFallBack.url){ 
        groupData.url = userFallBack.url
       }
        return DB.query(`
          INSERT INTO groups_desc (url, playlist_id, name, description, user_id, playing_fallback)
          VALUES (:url, :playlist_id, :name, :description, :userId, 1)`,
          {url: groupData.url, playlist_id: groupData.playlist_id, name: groupData.name, description: groupData.description, userId},
          "groups_desc"

        )
    })
    .then((data) => {
      return data.insertId;
    });
  };

  this.setUserFallBackOnTV = function(GUID, DUID){
    return;
  };

  this.removeTVfromGroup = function(userId, groupData){
    var GUIDtoRefresh = groupData.GUID;
    if(!groupData.GUID || !groupData.group_id) return "Not enough data was passed. Endpoint requires tv.GUID and tv.groupId";
    if(!userId) return " userId wasn't found ";

    return DB.query(`
      DELETE FROM groups
      WHERE GUID = :GUID 
      AND group_id = :group_id 
      AND userId = :userId`, {GUID: groupData.GUID, group_id: groupData.group_id, userId}, groupData.GUID)
    .then((status) => {
      let params = {
        set: {
          constant_play: 0,
          playing_fallback: 1,
          on_schedule: 0,
          video_id: null
        },
        where: {
          guid: GUIDtoRefresh
        }
      }
      let query = DB.prepareQuery(`UPDATE tv`, params);
      let variables = Object.assign({}, params.set, params.where);
      //     return DB.query(`
      //     UPDATE tv
      //     SET constant_play = 1,
      //     playing_fallback = 1,
      //     on_schedule = 0,
      //     video_id = 0
      //     WHERE guid = :GUIDtoRefresh`, {GUIDtoRefresh}, GUIDtoRefresh)
      return DB.query(query, variables, GUIDtoRefresh)
    })
    .then(() => {
      let connectionStore = require("../app.js");
      connectionStore.leaveGroup(GUIDtoRefresh);
      return;
    })
    .catch((error) => { return error; });   
  }

  this.insertTVIntoGroup = function(userId, groupData){
    if(!groupData.GUID || !groupData.group_id) return "Not enough data was passed. Endpoint requires tv.GUID and tv.groupId";

    var GROUP_IS_ON_SCHEDULE = 0;
    var GROUP_IS_ON_CONSTANT_PLAY = 1;
    if(!userId) throw " userId wasn't found ";
    return DB.query(`SELECT * FROM schedule
      WHERE group_id = :group_id`, {group_id: groupData.group_id}, "schedule")
    .then((data) => {
     if(data.length > 0){ GROUP_IS_ON_SCHEDULE = 1;GROUP_IS_ON_CONSTANT_PLAY = 0 }
     let params = {
      set: {
        on_schedule: GROUP_IS_ON_SCHEDULE,
        constant_play: GROUP_IS_ON_CONSTANT_PLAY,
        video_id: null
      },
      where: {
        guid: groupData.GUID
      }
    }

    let query = DB.prepareQuery(`UPDATE tv`, params);
    let variables = Object.assign({}, params.set, params.where);
      //      return DB.query(`
      //      UPDATE tv
      //      SET on_schedule = ${GROUP_IS_ON_SCHEDULE},
      //      constant_play = ${GROUP_IS_ON_CONSTANT_PLAY},
      //      video_id = null
      //      WHERE guid = '${groupData.GUID}'`)
      return DB.query(query, variables, groupData.GUID)
    })
    .then(() => {
      return DB.query(`
        DELETE FROM groups
        WHERE GUID = :GUID`, {GUID: groupData.GUID}, groupData.GUID)
    })
    .then(() => {
      return DB.query(`
        INSERT INTO groups (GUID, userId, group_id)
        VALUES(:GUID, :userId, :group_id)
        `, {GUID: groupData.GUID, userId, group_id: groupData.group_id}, groupData.GUID)
    })
    .then(() => { return pullAllGUIDFromGroup(groupData.group_id) })
    .then((GUIDs) => {
      if(GUIDs){
        var GUIDs = GUIDs.map((el) => { return el.GUID })
        emitRefreshToGivenGUIDs(GUIDs);
      }
      return;
    });
  };

  this.deleteGroup = function(userId, groupData){
    console.log(groupData.groupId, userId);
    var groupID = groupData.groupId;
    var GUIDsToRefresh;

    if(!userId){reject(" userId wasn't found ")}
      if(!groupData){reject("groupData wasn't found")};
    return pullAllGUIDFromGroup(groupID)
    .then((GUIDs) => {
      return (GUIDsToRefresh = GUIDs);
    })
    .then(() => {
      return  DB.query(`
        DELETE FROM groups_desc
        WHERE group_id = :group_id
        AND user_id = :user_id`,
        {group_id: groupData.groupId, user_id:userId},
        "groups_desc")
    })
    .then(() => {
      return DB.query(`
        DELETE FROM groups
        WHERE group_id = :group_id
        AND user_id = :user_id`,
        {group_id: groupData.groupId, user_id:userId},
        "groups")
    })
    .then(() => {
      return DB.query(`
        DELETE FROM schedule
        WHERE group_id = :group_id
        AND user_id = :user_id`,
        {group_id: groupData.groupId, user_id:userId},
        "schedule")
    })
    .then(() => {
      if(GUIDsToRefresh){
        var GUIDs = GUIDsToRefresh.map((el) => { return el.GUID })
        emitRefreshToGivenGUIDs(GUIDs);
      }
      return;
    });
  };

  this.refreshGroup = function(groupId, notifyRoom = true){
    return DB.query(`
      SELECT GUID FROM groups
      WHERE group_id = :groupId`, {groupId}, "groups")
    .then((rows) => {
      if(rows.length > 0){
        if (notifyRoom) rows.forEach((row) => {emitRefreshToGivenGUIDs(row.GUID);});
      };
      return;
    });
  };

  this.addInfoToGroup = function(userId, groupData, notifyRoom = true){

    var groupURLorListIDChanged = false;
    return new Promise((resolve, reject) => {
      if(!userId){reject(" userId wasn't found ")};
      if(!groupData){reject(" groupData wasn't found ")};
      
      if(groupData["playlist_id"] && (groupData["URL"] && groupData["URL"] !== '0')){
        reject(" You got both URL and playlist ID set for group. Only one thing at time. ");
      } else {
        if(isNaN(parseInt(groupData["playlist_id"]))){
          groupData["playlist_id"] = 0;
        };
        if(!groupData["URL"] || groupData["URL"].length == 0){
          groupData["URL"] = 0;
        };
        
        DB.query(`
          SELECT * FROM groups_desc
          WHERE group_id = :group_id`, {group_id: groupData.groupId}, "groups_desc")
        .then((data) => {
          if(data[0]){
            // IF GROUP CONSTANT DATA WAS CHAGED REMOVE ALL SCHEDULE EVENTS FOR THIS GROUP
            if(data[0].playlist_id != groupData["playlist_id"] && groupData["playlist_id"])
            {
              groupURLorListIDChanged = true;
              groupData["on_schedule"] = 0;
            }
            if(data[0].url != groupData["URL"] && groupData["URL"])
            {
              groupURLorListIDChanged = true;
              groupData["on_schedule"] = 0;
            }
          } else {
            throw " Group with given ID wasn't found. Check groupId please. "
          }
        })
        .then(() => {
          return DB.query(`UPDATE groups_desc
            SET ${buildQuery(groupData)}
            WHERE group_id = :groupId`, {groupId: groupData.groupId}, "groups_desc");

        })
        .then(() => {
          // IF CASE GROUP WAS SET TO PLAY CONSTANTLY
          // SET DEVICES SCHEDULE STATUS TO null THEN REFRESH
          if(groupURLorListIDChanged){
           return setGroupdDevicesScheduleStatusTonull(groupData.groupId);
         } else {
          return true;
        }
      })
        .then(() => {
          module.refreshGroup(groupData.groupId, notifyRoom);
          resolve()
        })
        .catch((error) => {reject(error)})
      }
    });

    function buildQuery(groupData){
      var resultQuery = " ";
      Object.keys(groupData).forEach((el) => {
        if(el != "groupId"){resultQuery += `${el} = '${groupData[el]}' ,`}
      });
      resultQuery = resultQuery.replace(/,\s*$/, "");
      return resultQuery;
    };

    function setGroupdDevicesScheduleStatusTonull(groupdId){
      // AND REMOVE ALL SHEDULE EVENTS FOR THIS GROUPD
      var groupId = groupdId;
      console.log(" ====> Got new content for group setting schedule status for TV inside group to 0 <===== ");
      return new Promise((resolve, reject) => {
        DB.query(`
          DELETE FROM schedule
          WHERE group_id = :groupId`, {groupId}, "schedule")
        .then(() => {
          return DB.query(`
            SELECT GUID FROM groups
            WHERE group_id = :groupId`, {groupId}, "groups")
        })
        .then((rows) => {
          if(rows.length > 0){
            return DB.query(`
              UPDATE tv
              SET on_schedule = 0,
              constant_play = 1
              WHERE guid IN (:string)`, {string: rows.map((row) => {return "'" + row.GUID + "'"}).join(",")})
          }
          else
          {
            return true;
          }
        })
        .then(() => resolve())
        .catch((error) => reject(error))
      })
    }
  };

  this.pullSchedule = function(userID){
    /*DB.query(`
     SELECT * FROM schedule
     JOIN video
     ON schedule.URL  = video.url
     WHERE schedule.user_id = ${userID}`)*/
     return DB.query(`
       SELECT * FROM schedule
       WHERE schedule.user_id = :userID`, {userID}, "schedule")
     .then((rows) => {
      if(rows.length > 0){
        console.log(JSON.stringify(formatSchedule(rows)))
        return formatSchedule(rows);
      } else {
        return [];
      }
    });

     function formatSchedule(rawSchedule){
      var result = {}
      rawSchedule.forEach((element) => {
        if(element.tv_guid){
          if(!result[element.tv_guid]){
            result[element.tv_guid] = {
              tv_guid:element.tv_guid,
              group_id:null,
              events:[]
            }
          };
          result[element.tv_guid].events.push({
            "URL":element.URL,
            "event_id":element.ID,
            "media_id":element.id,
            "playlist_id":element.playlist_id,
            "start":element.start,
            "end":element.end,
            "event_status":element.event_status
          });
        };
        if(element.group_id){
          if(!result[element.group_id]){
            result[element.group_id] = {
              events:[],
              tv_guid:null,
              group_id:element.group_id,
            }
          };
          result[element.group_id].events.push({
            "URL":element.URL,
            "event_id":element.ID,
            "media_id":element.id,
            "playlist_id":element.playlist_id,
            "start":element.start,
            "end":element.end,
            "event_status":element.event_status,
          });
        };
      });
      var valueToReturn = [];
      Object.keys(result).forEach((el) => {
        valueToReturn.push(result[el]);
      });
      return valueToReturn;
    };
  }

  this.deleteScheduleEvent = function(userId, body){
    var query = buildScheduleDeleteQuery(JSON.parse(body.schedule), userId);
    return DB.query(query, {}, "schedule");

    function buildScheduleDeleteQuery(rawSchedule){
      var query = `
      DELETE FROM schedule
      WHERE ID IN (
      `
      Object.keys(rawSchedule).forEach((el, i, a) => {
        query += "'" + rawSchedule[el].id + "'";
        if(i != a[a.length - 1]){
          query += ",";
        };
      });
      query = query.replace(/,\s*$/, "");
      query += ")";
      return query;
    };
  };

  this.updateEvent = function(userId, body){
    var eventID = body.ID;
    var GUIDs = null;
    if(!eventID) throw "No event ID was given for updateEvent endpoint ";

    let params = {
      set: {
        tv_guid: body.tv_guid && (body.tv_guid != "null") ? body.tv_guid : null,
        URL: body.URL && (body.URL != "null") ? body.URL : null,
        group_id: body.group_id && (body.group_id != "null") ? body.group_id : null,
        playlist_id: body.playlist_id && (body.playlist_id != "null") ? body.playlist_id : null,
        start: body.start,
        end: body.end,
        event_status: 1,
        repeat_event: 0,
        user_id: userId
      },
      where: {
        ID: eventID
      }
    }
    let query = DB.prepareQuery(`UPDATE schedule`, params);
    let variables = Object.assign({}, params.set, params.where);
    // DB.query(`
    // UPDATE schedule
    // SET tv_guid = ${body.tv_guid && (body.tv_guid != "null") ? "'" + body.tv_guid + "'" : null },
    // URL = ${body.URL && (body.URL != "null") ? "'" + body.URL + "'" : null },
    // group_id = ${body.group_id && (body.group_id != "null") ? "'" + body.group_id + "'" : null },
    // playlist_id = ${body.playlist_id && (body.playlist_id != "null") ? "'" + body.playlist_id + "'" : null },
    // start = ${"'" + body.start + "'" },
    // end = ${"'" + body.end + "'"},
    // event_status = '1',
    // repeat_event = '0',
    // user_id = ${userId}
    // WHERE ID = '${eventID}'`)
    return DB.query(query, variables, "schedule")
    .then(() => { return pullAllGUIDFromGroup(body.group_id) })
    .then((values) => {
      if(values.length > 0){
        GUIDs = [body.tv_guid]
        values.forEach((el) => { GUIDs.push(el.GUID) });
      } else if(values.length == 0){
        GUIDs = [body.tv_guid];
      }
      return GUIDs;
    })
    .then((GUIDs) => {
      emitRefreshToGivenGUIDs(GUIDs);
      return;
    });
  }

  this.saveSchedule = function(userId, body){
    var GUIDs = null;
    return Promise.all(JSON.parse(body.schedule).map((el) => { return setGroupsToSchedule(el.group_id) }))
    .then(() => {
      return Promise.all(JSON.parse(body.schedule).map((el) => { return pullAllGUIDFromGroup(el.group_id) }))
    })
    .then((values) => {
      ;
      GUIDs = JSON.parse(body.schedule).map((el) => el.tv_guid).concat(values.reduce((a, b) => a.concat(b)).map((el) => el.GUID));
      return GUIDs;
    })
    .then((GUIDs) => {
      return DB.query(buildSwitchQueryForSchedule(GUIDs), {}, "tv")
    })
    .then(() => {
      return DB.query(buildScheduleUpdateQuery(JSON.parse(body.schedule), userId),  {}, "schedule");
    })
    .then(() => {
      emitRefreshToGivenGUIDs(GUIDs);
    });

    function setGroupsToSchedule(group_id){
      // DB.query(`
      //     UPDATE groups_desc
      //     SET on_schedule = 1,
      //     playing_fallback = 0
      //     WHERE group_id = ${group_id}`)

      let params = {
        set: {
          on_schedule: 1,
          playing_fallback: 0
        },
        where: {
          group_id
        }
      }
      let query = DB.prepareQuery(`UPDATE groups_desc`, params);
      let variables = Object.assign({}, params.set, params.where);
      return DB.query(query, variables, "groups_desc");
    };

    function buildSwitchQueryForSchedule(GUIDs){

      var query = `
      UPDATE tv SET
      on_schedule = 1,
      constant_play = null,
      playing_fallback = 0,
      playlists_status = 0
      WHERE guid IN (
      `
      GUIDs.forEach((el, i, a) => {
        query += "'" + el + "'";
        if(i != a[a.length - 1]){
          query += ",";
        };
      });
      query = query.replace(/,\s*$/, "");
      query += ")";
      return query;
    };

    function buildScheduleUpdateQuery(rawSchedule, userId){
      var query = `
      INSERT INTO schedule (tv_guid, group_id, URL, playlist_id, start, end, event_status, repeat_event, user_id)
      VALUES
      `;
      Object.keys(rawSchedule).forEach((el) => {
        el = rawSchedule[el];
        query += `(
        ${el.tv_guid ? "'" + el.tv_guid + "'" : null},
        ${el.group_id ? "'" + el.group_id + "'" : null},
        ${el.URL ? "'" + el.URL + "'" : null},
        ${el.playlist_id ? "'" + el.playlist_id + "'" : null},
        ${el.start ? "'" + el.start + "'" : null},
        ${el.end ? "'" + el.end + "'" : null},
        1,
        ${el.repeat_event ? el.repeat_event : 0},
        ${userId}
        ),`
      });
      query = query.replace(/,\s*$/, "");
      return query;
    };
  };

  this.saveUserTimeZone = function(reqBody, userId){
    return DB.query(`
      INSERT INTO users (timezone, id)
      VALUES('I am test timeZone', :userId)
      ON DUPLICATE KEY UPDATE
      timezone = :timezone`, {userId, timezone: reqBody.timezone}, "users");
  };

  this.pullUserTimeZone = function(userId){
    return DB.query(`
      SELECT timezone
      FROM users
      WHERE id = :userId`, {userId}, "users")
    .then((data) => { 
      if(data[0]) { 
        return data[0].timezone; 
      } else { 
        return null;
      } 
    });
  };

  this.checkRunFromLocalStorage = function(GUID){
    var result = {
      runFromLocalStorage:false,
      runVideoFromLocalStorageOnTV:false,
      runListFromLocalStorage:false,
      runScheduleOnTV:false,
      userId:null,
      listId:null,
      URL:null,
      GUID:GUID
    };
    return DB.query(`
      SELECT
      playLocalyStatus,
      constant_play,
      on_schedule,
      playlists_status,
      playlist_id,
      video_id,
      user_id
      FROM tv WHERE guid = :GUID`,{GUID}, GUID)
    .then((data) => {
      if(data.length) return false;
      if(data[0].playLocalyStatus != 1) return false;
      result.runFromLocalStorage = true;
      if(data[0].constant_play == 1) {
        result.runVideoFromLocalStorageOnTV = true;
        result.runListFromLocalStorage = false;
        result.userId = data[0].user_id;
        return DB.query(`
          SELECT url from video
          WHERE id = :id`, {id: data[0].video_id}, "video")
        .then((urlData) => {
          if(urlData[0]){result.URL = urlData[0].url}
            return result;
        });
      }
      if(data[0].on_schedule == 1) {
        result.runVideoFromLocalStorageOnTV = false;
        result.runListFromLocalStorage = false;
        result.runScheduleOnTV = true;
        return result;
      }
      if(data[0].playlists_status == 1) {
        result.runVideoFromLocalStorageOnTV = false;
        result.runListFromLocalStorage = true;
        result.userId = data[0].user_id;
        result.listId = data[0].playlist_id;
        return result;
      }
    });
  };

  this.nullScheduleForGroupIfLastEventDeleted = function(groupdId){
    return DB.query(`SELECT group_id FROM schedule
      WHERE group_id = :groupdId limit 1`, {groupdId}, "schedule")
    .then((data) => {
      if(data.length == 0){
        let params = {
          set: {
            on_schedule: 2
          },
          where: {
            group_id: groupdId
          }
        }
        let query = DB.prepareQuery(`UPDATE groups_desc`, params);
        let variables = Object.assign({}, params.set, params.where);
        return DB.query(query, variables, "groups_desc");
      } else {
        return;
      }
    });
  }

  this.emitRefreshToGivenGUIDs = emitRefreshToGivenGUIDs;
  this.pullAllGUIDFromGroup = pullAllGUIDFromGroup;
}

function emitRefreshToGivenGUIDs(GUIDs){
  var connectionStore = require("../app.js");
  if(typeof GUIDs == "string"){
    GUIDs = [GUIDs];
  } else if(!Array.isArray(GUIDs)){throw " emitRefreshToGivenGUIDs requires array or string argument"}
  GUIDs = GUIDs.filter((v, i, a) => a.indexOf(v) === i);
  GUIDs.forEach((oneGUID) => {
    if (oneGUID && oneGUID !== 'null') connectionStore.notifyRoom(oneGUID);
  });
};

function pullAllGUIDFromGroup(groupId){
  if(!groupId){ 
    return []; 
  } else {
    return DB.query(`
      SELECT GUID from groups
      JOIN groups_desc
      ON groups.group_id = groups_desc.group_id
      WHERE groups.group_id = :groupId ;`, {groupId}, "groups")
    .then((data) => {
      if(data.length > 0) { 
        return data;
      } else {
        return [];
      } 
    })
  }
};

// tvInteractions.emitRefreshToGivenGUIDs = emitRefreshToGivenGUIDs;
// tvInteractions.pullAllGUIDFromGroup = pullAllGUIDFromGroup;
module.exports = tvInteractions;


// some toolbelt functions
// --- **** -- **** -- **** ---


function pullStripeDataForPlayList(listID){
  if(listID){
    return DB.query(`
      SELECT video.id, video.stripe_id, playlists.list_name , playlists.stripe_background, playlists.stripe_color, stripes.text_data, playlists.id 'playlist_id'
      FROM video
      LEFT JOIN stripes
      ON video.stripe_id = stripes.id
      LEFT JOIN playlists
      ON playlists.stripe_id = video.id
      WHERE playlists.stripe_id IS NOT null
      AND playlists.id = :listID`, {listID}, "video");
  } else {
    return [];
  }
};


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
