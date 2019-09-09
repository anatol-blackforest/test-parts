const DB = require("../modules/sql.js");
const crypto = require('crypto');
var resolvePath = require('path').resolve;
var formidable = require('formidable');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffprobePath = require('@ffprobe-installer/ffprobe').path;
var ffmpeg = require('fluent-ffmpeg');
var ffprobe = require('ffprobe');
var ffprobeStatic = require('ffprobe-static');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
var gm = require('gm').subClass({imageMagick: true});

function mediaController(){
    var _mController = this;
    this.pullMedia = function(mediaID){
        var mediaResult = {
            id:null,
            extension:null,
            mediaType:null,
            name:null,
            note:null,
            size:null,
            thumbnail:null,
            url:null
        };

        if(!mediaID){ throw " mediaID to pull is not valid. Recieved " +  mediaID; }
        return DB.query(`
        SELECT * FROM video
        WHERE id = :mediaID`, {mediaID}, 'video')
        .then((data) => {
            if(data.length > 0){
                mediaResult.id = data[0].id;
                mediaResult.extension = getMediaExtension(data[0].url);
                mediaResult.mediaType = determineMediaType(mediaResult.extension);                    
                mediaResult.name = data[0].media_name;
                mediaResult.note = data[0].note;
                mediaResult.size = data[0].size;
                mediaResult.thumbnail = data[0].thumbnail;
                mediaResult.url = data[0].url;
                mediaResult.update_interval = data[0].update_interval;
                if(!isNaN(parseInt(data[0].stripe_id))){ mediaResult.mediaType = "text" };
            }
            return mediaResult;
        });
        function getMediaExtension(url){
            var result;
            try {
                result = url.split(".")[url.split(".").length - 1];
            } catch(e) {
                console.log('ERR', e)
                result = null;
            }
            return result;
        }
        function determineMediaType(ext){
            ext = ext.toLowerCase();
            switch (ext)
            {
                case "jpg":
                 return "image";
                break;
                case "png":
                 return "image";
                break;
                case "jpeg":
                 return "image";
                break;
                case "gif":
                 return "image";
                break;
                case "mp4":
                 return "video";
                break;
                case "avi":
                 return "video";
                break;
                case "webm":
                 return "video";
                break;
                case "3gp":
                 return "video";
                break;
                case "mov":
                 return "video";
                break;
                default:
                 return " not determined "                    
            }

        }
    };

    this.checkUserUploadPermit = function(request, userId){
        var result = {
            status:false,
            request:request
        }
        return new Promise((resolve, reject) => {
            var contentLength = parseInt(request.headers["content-length"]);
            if(!isNaN(contentLength)){
                console.log(" User  " + userId + " is trying to load " + contentLength + " bytes ");
                _mController.getUserFileStorageInUse(userId)
                .then((data) => {
                    ;
                    if(data && (parseInt(data.limit) >= (parseInt(data.used) + parseInt(contentLength)))){ 
                        result.status = true;
                        resolve(result);
                    }
                    else { resolve(result) }
                })
            }
        });
    };

    this.getUserFileStorageInUse = function(userId){
        
        if(!userId){ throw " No user id specified " }
        
        return DB.query(`
         SELECT file_storage_byte lim, file_storage_used_byte used
         FROM users
         WHERE id = :userId`, {userId}, 'users')
         .then((data) => {
            if(data.length > 0){ return {limit:data[0].lim, used:data[0].used} } 
            else { return null; }
         })
         .catch((error) => { reject(error) });
    };

    this.reduceUserFreeStorage = function(userId, reduceFor, objectToPass){
        if(!userId){ throw " User parameter in empty " }
        if(!reduceFor){ throw " ReduceFor paramter in empty" }
        return DB.query(`
        UPDATE users
        SET file_storage_used_byte = file_storage_used_byte + :reduceFor
        WHERE id = :userId `, {userId, reduceFor}, 'users')
        .then(() => resolve(objectToPass))
        .catch((error) => reject(error));
    };

    this.expandUserFreeStorage = function(userId, expandFor){
        if(!userId){ throw " User parameter is empty " }
        if(!expandFor){ throw " ExpandFor parameter is empty " }
        return DB.query(`
        UPDATE users
        SET file_storage_used_byte = file_storage_used_byte - :reduceFor
        WHERE id = :userId `, {userId, reduceFor}, 'users')
        .then(() => resolve())
        .catch((error) => reject(error));
    };


    this.getWhoMediaBelongsTo = function(URL){
        if(!URL){ throw " URL parameter is empty "};
        return DB.query(`
        SELECT user_id
        FROM video
        WHERE url = :URL`, {URL}, 'video')
        .then((data) => {
            if(data.length > 0){ return data[0].user_id; } 
            else { return null;}
        });
    };

    this.saveRSSfeed = function(userId, RSSURL, mediaName, note = "", refresInterval = 600000){
        if(!userId){ throw " RSS feed has no user assinged to it. Not cool, man. " };
        if(!RSSURL){ throw " No RSS URL was given to saveRSSfeed method. Not cool, man.  " };
        return DB.query(`
            INSERT INTO video (url, user_id, rss , media_name, note, update_interval)
            VALUES (:RSSURL, :userId, 1 ,:mediaName, :note, :refresInterval)
        `, {RSSURL, userId, mediaName, note, refresInterval}, 'video')
        .then(() => {
            return {status: "OK"};
        })
        .catch((error) => {
            return(error);
        });
    };

    this.removeRSSfeed = function(id) {
        return new Promise((resolve, reject) => {
            if (!id) {
                throw "No RSS id was provided";
            }
            return DB.query(`
                DELETE FROM video WHERE id = :id
            `, {id}, 'video')
            .then((result) => {
                console.log(result)
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
        })    
    }

    this.updateRSSfeed = function(id, url, name, note) {
        if (!id || !url || !name) {
            throw new Error(' provided RSS data was not correct');
        }
        return DB.query(`
            UPDATE video
            SET url = :url, media_name = :name, note = :note
            WHERE id = '${id}'
        `,{url, name, note, id}, 'video')
        .then(() => {
            return {message: "OK"};
        })
        .catch(err => {
            return err;
        });
    }

    this.updateRSSInterval = function(id, interval) {
        if (!id) {
            throw new Error(' No RSS id was provided ');
        }
        if (!+interval) {
            throw new Error(' Invalid RSS updating interval was provided ');
        }
        return DB.query(`
            UPDATE video
            SET update_interval = :interval
            WHERE id = :id
        `, {interval, id}, 'video')
        .then(() => {
            return {message: "OK"};
        })
        .catch(err => {
            return err;
        });
    }

    this.playlistHasRSS = function(playlistId){
        if(!playlistId){ throw " playlistHasRSS requires list id to check it. "}
        return DB.query(`
        SELECT rss, url , playlists.* FROM playlists
        JOIN video
        ON playlists.stripe_id = video.id
        WHERE playlists.id = :playlistId`, {playlistId}, 'video')
        .then((data) => {
            if(data[0]){
                if(data[0].rss == 1){
                    return data[0];
                } else {
                    return false;
                }
            } else {
                return false;
            }
        })
        .catch((error) => {
            reject(error);
        });
    };

    this.uploadFileFromUserPC = function(req, userId, directoryToUpload = "views/video/"){
        // DIRECTORY to upload example "views/video/"
        // FORMIDABLE PARSES THE WHOLE REQUEST NOT JUST FORM 
        if(!req){ throw " Request parameter in empty "};
        if(!userId){ throw " User parameter is empty "};
        var generatedID = null;
        var mediaStats = {
            size : null,
            filePath : null,
            host : null,
            image : null,
            video : null,
            name : null,
            thumbFileName : null,
            generatedID : null
        }
        return new Promise((resolve, reject) => {
            var form = new formidable.IncomingForm();
            form.maxFileSize = 1024 * 1024 * 1024 * 2;
            var fileName;
            form.parse(req);
            form.on('fileBegin', function(name, file) {
                fileName = file.name.replace(/[^!a-zA-Zа-яА-Я0-9-.\u400-\u04F0\']|\s/g, "_");
                var re = /(?:\.([^.]+))?$/;
                var ext = re.exec(fileName)[1].toLowerCase();
                fileName = fileName.slice(0, -ext.length).concat(ext);

                generatedID = generateIDtoInput();
                mediaStats.generatedID = generatedID;
                file.path = directoryToUpload +  generatedID + fileName;
                mediaStats.filePath = file.path;
                mediaStats.name = name;
                mediaStats.thumbFileName = directoryToUpload + "thumb-" + generatedID + fileName;
            });
            form.on('file', (name, file) => {
                mediaStats.size = file.size;
                mediaStats.filePath = file.path;
                mediaStats.host = "http://" + req.headers.host + "/";
                console.log(` ----- Media content URL set to ${mediaStats.host}/${mediaStats.filePath} ------ `);
                mediaStats.image = file.type.startsWith("image");
                mediaStats.video = file.type.startsWith("video");
                resolve(mediaStats);
            });
        });
    };


    this.saveMediaUrl = function(urlToAdd, userid, fileData) {
        DB.query(`SELECT checkIfVideoThere(:urlToAdd, :userid})`, {urlToAdd, userid}, 'video')
        .then((data) => {
            var value = 1;
            Object.keys(data[0]).map((e) => { value = data[0][e];})
            if (value > 0) { return urlToAdd;}
            if (value == 0) {
                fileData["fullUrl"] = urlToAdd;
                return fileData;
            }
        })
        .catch((error) => {
            return error;
        });
    };

    this.getMediaIdByURL = function(URL){
        return DB.query(` 
        SELECT id FROM video
        WHERE url = :URL`, {URL}, 'video')
        .then((data) => {
            if(data.length > 0){ return data[0].id }
            else { return null; }
        });
    };

    this.saveThumbNailsForURL = function(fileUrl, thumb, fileData){
        if(fileUrl && thumb){
            return DB.query(`
            UPDATE video
            SET thumbnail = :thumb
            WHERE url = :fileUrl`, {thumb, fileUrl}, 'video')
            .then(() => {
                return fileData;
            })
            .catch((error) => error);
        } else {
            throw ` Some required parameters are not defined URL:${fileUrl} thumb:${thumb}. Drats. `;
        }
    };


    this.updateMediaMetadata = function(id, size, duration, dimensions) {
        return DB.query(`
            UPDATE video
            SET size = :size,
            duration = :duration,
            dimensions = :dimensions
            WHERE id = :id
        `, {size, duration, dimensions, id}, 'video')
        .then(() => {
            return {message: "OK"};
        })
        .catch(err => {
            return err;
        });
    }

    this.updateMediaNameByURL = function(URL, name = "", note = "", size = 0, duration = 0, dimensions = 0, fileData){
        var urlToPass = URL;
        var nameToPass = name;
        var duration = duration ? duration : 0;
        return DB.query(`
        UPDATE video
        SET media_name = :name,
        note = :note,
        duration = :duration,F
        size = :size,
        dimensions = :dimensions
        WHERE url = :URL`, {name, note, duration, size, dimensions, URL}, 'video')
        .then((data) => {
            return module.pullMediaIdByURL(URL)
        })
        .then((id) => {
            return {f_url:urlToPass, f_name:nameToPass, f_id:id, fileData:fileData};
        })
        .catch((error) => {
            return error;
        });
    };


    this.createThumbForImage = function(pathToImage, pathToStoreThumb, objToPass){
        objToPass["dimensions"] = null;
        return new Promise((resolve, reject) => {
            gm(pathToImage)
            .size(function(err, size) {
                    if(!err){
                        console.log(` Error while creating thumb for image, ${err} `);
                        objToPass["dimensions"]  = `${size.width} × ${size.height}`;
                    } else {
                        objToPass["dimensions"] = null; 
                        objToPass.thumbFileName = pathToImage;
                        resolve(objToPass)
                    }
                })
            .scale(450)
            .quality(70)
            .write(pathToStoreThumb, function (err) {
            if (err) {
                console.log('error: ', err);
                reject(err);
            } else {
                console.log('Done');
                resolve(objToPass);
                };
            });
        });
    };

    this.createThumbForVideo = function(pathToVideo, videoFileName, generatedID, pathToStoreThumb, fileSize, objToPass){
        return new Promise((resolve, reject) => {
            var fName = pathToStoreThumb.replace('views/video/', '');
            var thumbName = fName.slice(0, fName.lastIndexOf('.mp4')).concat('.jpg');
            var duration = null;
            var dimensions = null;
            var size = fileSize;
            var name = videoFileName;
            var fileLocation = resolvePath(pathToVideo);
            var thumbFileLocation = resolvePath(pathToStoreThumb.slice(0, pathToStoreThumb.lastIndexOf('.mp4')).concat('.jpg'));

            //;
            const options = {
                source: fileLocation,
                target: thumbFileLocation,
                width: 100,   
                height: 50, 
                seconds: 30
            }

            ffmpeg(pathToVideo)
            .on('filenames', function(filenames) {
                console.log('Will generate ' + filenames.join(', '))
            })
            .on('end', function() {
                console.log('Screenshots taken');
                resolve({duration, dimensions, size, name: name, fileLocation, thumbFileLocation, fileData:objToPass});
            })
            .on('error', function(err) {
                console.log(err);
                reject({duration, dimensions, size, name: name, fileLocation, thumbFileLocation, fileData:objToPass});
            })
            .screenshots({
                timestamps: [ '50%' ],
                filename: thumbName,
                size: '600x?',
                folder: './views/video/',
            })
            .ffprobe(pathToVideo, function(err, metadata) {
                duration = metadata.format.duration;
                dimensions = `${metadata.streams[0].width} × ${metadata.streams[0].height}`
            })
        })
    }

    this.addUrlMedia = function(data) {
      const params = {
        userId: data.user,
        webPage: data.url,
        mediaName: data.mediaName,
        duration: data.duration,
        note: data.note
      }
      return Promise.resolve()
      .then(() => {
        return DB.query('START TRANSACTION');
      })
      .then(() => {
        return DB.query("INSERT INTO video (`user_id`,`media_name`, `duration`, `note`, `web_page`) VALUES(:userId, :mediaName, :duration, :note, :webPage)", params, 'video');
      })
      .then((data) => {
        return Promise.all([DB.query('COMMIT'), data]);
      })
      .then(([commit, data]) => {
        return data;
      })
      .catch(err => {
        return DB.rollback(() => {
          let message = err.code;
          return {message};
        });  
      });
    }

    this.getUrlMediaById = function(params) {
      return Promise.resolve(params)
      .then((params) => {
        return DB.query("SELECT * FROM video WHERE id= :id AND user_id= :userId", params, 'video');
      })
      .catch(err => {
        return err;
      }); 
    }

    this.updateUrlMedia = function(params) {
      return Promise.resolve()
      .then(() => {
        return DB.query('START TRANSACTION');
      })
      .then(() => {
        const query = DB.prepareQuery(`UPDATE ${params.table}`, params);
        const variables = Object.assign({}, params.set, params.where);
        return DB.query(query, variables, params.table);
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

    this.deleteUrlMedia = function(params) {
      return Promise.resolve(params)
      .then((params) => {
        return DB.query("DELETE FROM video WHERE id= :id AND user_id= :userId", params, 'video');
      })
      .catch(err => {
        return err;
      }); 
    }

    this.addOverlay = function(data) {
        return Promise.resolve()
        .then(() => {
          return DB.query('START TRANSACTION');
        })
        .then(() => {
            return DB.query("INSERT INTO video (`user_id`,`media_name`, `note`, `size`, `overlay`) VALUES(:userId, :mediaName, :note, :size, :html)", data, 'video');
          })
        .then((result) => {
            return Promise.all([DB.query('COMMIT'), DB.query(`SELECT * FROM video WHERE id= :id`, {id: result.insertId}, 'video')]); 
        })
        .then(([commit, result]) => {
            return result;
        })
        .catch(err => {
          return DB.rollback(() => {
            return err;
          });
        });
    }

    this.deleteHTMLOverlay = function(params) {
        return Promise.resolve(params)
        .then(() => {
            return DB.query('START TRANSACTION');
        })
        .then(() => {
          return DB.query("DELETE FROM video WHERE id= :id AND user_id= :userId", params, 'video');
        })
        .then(res => {
            return DB.query('COMMIT');
        })
        .catch(err => {
            return DB.rollback(() => {
                return err;
            });
        }); 
    }

    this.addStream = function(data) {
        return DB.query('START TRANSACTION')
        .then(() => {
            return DB.query("INSERT INTO video (`user_id`,`media_name`, `note`, `stream`) VALUES(:userId, :mediaName, :note, :stream)", data, 'video');
        })
        .then((result) => {
            return Promise.all([DB.query('COMMIT'), DB.query(`SELECT * FROM video WHERE id= :id`, {id: result.insertId}, 'video')]); 
        })
        .then(([commit, result]) => {
            return result;
        })
        .catch(err => {
          return DB.rollback(() => {
            return err;
          });
        });
    }

    this.deleteStream = function(params) {
        return DB.query('START TRANSACTION')
        .then(() => {
          return DB.query("DELETE FROM video WHERE id= :id AND user_id= :userId", params, 'video');
        })
        .then(res => {
            return DB.query('COMMIT');
        })
        .catch(err => {
            return DB.rollback(() => {
                return err;
            });
        }); 
    }

    this.getStream = function(params) {
        return DB.query("SELECT * FROM video WHERE id= :id AND user_id= :userId", params, 'video')
        .catch(err => {
            return DB.rollback(() => {
                return err;
            });
        }); 
    }

    function generateIDtoInput() {
        // GENERATE RANDOM ID FOR MEDIA FILES
        var chars = "1234567890";
        var value = new Array(12);
        var len = chars.length;
        var data = crypto.randomBytes(12);
        for (var i = 0; i <= 12; i++) {
            value[i] = chars[data[i] % len];
        }
        return value.join("");
    }
}

module.exports = mediaController;
