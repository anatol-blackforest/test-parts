const fs = require("fs");
const DB = require("../modules/sql.js");
const path = require("path");
const getDuration = require('get-video-duration');
const gm = require('gm').subClass({imageMagick: true});
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


var fsCheck = function(){
    if (arguments.callee._singletonInstance) 
    return arguments.callee._singletonInstance;

    arguments.callee._singletonInstance = this;
    
    var current = this;

    this.getUsersFileNames = function(){
        var result = {};
        return new Promise((resolve, reject) => {
            DB.query(`
            SELECT * FROM video
            WHERE rss = 0
            AND stripe = 0`)
            .then((data) => {
               data.forEach((el) => {
                   if(result[el.user_id]){ result[el.user_id].files.push(el) }
                   else {
                    result[el.user_id] = { files : [] };
                    result[el.user_id].files.push(el);
                    resolve(result);
                   }
               })
            })
            .catch((error) => {
                reject(error);
            })
        });
    };
    
    this.getFilesActualSize = function(filesArray){
        if(!Array.isArray(filesArray)){ throw " Array expected for getFilesActualSize" };
        filesArray.forEach((elem) => {
            var nameToLookFor = elem.url.split("/")[elem.url.split("/").length - 1];
            try {
                var stats = fs.statSync(`${__dirname}/../views/video/${nameToLookFor}`);
                elem["actualSize"] = stats.size; // bytes
            } catch(error){
                 console.log(`File ${nameToLookFor} wasn't found on this machine`);
            }  
        })
    };

    this.getVideoDuration = function(filesArray){
        return new Promise((resolve, reject) => {
            if(!Array.isArray(filesArray)){ throw " Array expected for getFilesActualSize" };
            Promise.all(filesArray.map((elem) => {
                return new Promise((resolve, reject) => {
                    var nameToLookFor = elem.url.split("/")[elem.url.split("/").length - 1];
                    var fileToLookFor = `${__dirname}/../views/video/${nameToLookFor}`;
                    var ext = path.extname(fileToLookFor);
                    if(ext == ".mp4"){
                        current.getFileDuration(fileToLookFor)
                        .then((time) => {
                            if(time){ elem["actualDuration"] = time; }
                            resolve();
                        })
                        .catch((error) => {
                            console.log(error);
                            resolve();
                        })
                    } else {
                        resolve();
                    }
                })
            }))
            .then(() => {
                resolve();
            })
        });
    };

    this.getFileDuration = function(filePath){
        return new Promise((resolve, reject) => {
            var fPath = path.normalize(filePath);
            getDuration(fPath)
            .then((duration) => {
                if(!isNaN(parseInt(duration))){
                    resolve(duration);
                }
            })
            .catch((error) => {
                console.log(error);
                resolve(null);
            })
        })
    };

    this.calculateTotalFileSize = function(userObject){
        userObject["actualTotalFileSize"] = 0;
        userObject.files.forEach((el) => {
            if(!isNaN(parseInt(el.actualSize))){
                userObject["actualTotalFileSize"] += parseInt(el.actualSize);
            }
        }); 
    };


    this.updateThumbNail = function(fileName, newThumb){
        var domainName = "";
        if(process.env.environment == "stage"){
            domainName = "http://stage.dwall.online/views/video/" + newThumb;
        }
        if(process.env.environment == "dev"){
            domainName = "http://dev.dwall.online/views/video/" + newThumb;         
        }
        if(process.env.environment == "prod"){
            domainName = "http://dwall.online/views/video/" + newThumb;            
        }
        return DB.query(`
        UPDATE video
        SET thumbnail = :domainName
        WHERE url like '*:fileName*'`, {domainName, fileName}, 'video')
        .then(() => {
            return {message: 'OK'};
        })
        .catch((err) => {
            return err;
        });
    };

    this.setFileSize = function(URL, size){
        return DB.query(`
        UPDATE video
        SET size = :size
        WHERE URL = :URL`, {size, URL}, 'video')
        .then(() => {
            return {message: 'OK'};
        })
        .catch((err) => {
            return err;
        });
    };

    this.setUserUsedSpace = function(id, bytes){
        return DB.query(`
        UPDATE users
        SET file_storage_used_byte = :bytes
        WHERE id = :id
        `, {bytes, id}, 'users')
        .then(() => {
            return {message: 'OK'};
        })
        .catch((err) => {
            return err;
        });
    };


    this.generateThumbsForFiles = function(filesArray){
        // wait for array with files
        // create thumbnail and write name in file object if thumb was created
        // in property "actualThumbName"
        return new Promise((resolve, reject) => {
            if(!Array.isArray(filesArray)){ throw " Array expected for getFilesActualSize" };
            Promise.all(filesArray.map((file) => {
                return new Promise((resolve, reject) => {
                    var nameToLookFor = file.url.split("/")[file.url.split("/").length - 1];
                    var pathToFile = path.resolve(`${__dirname}/../views/video/${nameToLookFor}`);
                    var ext = path.extname(pathToFile);
                    if(fs.existsSync(pathToFile) && nameToLookFor){
                        if(ext == ".mp4"){
                            current.crateThumbForVideo(pathToFile)
                            .then((pathToThumb) => {
                                if(pathToThumb){ 
                                    file["actualThumbName"] = path.basename(pathToThumb)
                                }
                                resolve();
                            })
                            .catch((error) => {
                                resolve();
                            })
                        } else {
                            var folder = path.dirname(pathToFile);
                            var pathToThumb = path.join(folder, "thumb-" + nameToLookFor);
                            current.createThumbForImage(pathToFile, pathToThumb)
                            .then((pathToThumb) => {
                                if(pathToThumb){ 
                                    file["actualThumbName"] = path.basename(pathToThumb)
                                }
                                resolve();
                            })
                            .catch((error) => {
                                resolve();
                            })
                        }
                    } else {
                        console.log(` File ${nameToLookFor} is not present in filesystem `);
                        resolve();
                    }
                })
            }))
            .then(() => resolve());
        })
    };

    this.createThumbForImage = function(pathToFile, pathToStoreThumb){
        var folder = path.dirname(pathToFile);
        var fileName = path.basename(pathToFile);
        return new Promise((resolve, reject) => {
            gm(pathToFile)
            .scale(450)
            .quality(70)
            .write(pathToStoreThumb, function(err){
                if(err){
                    console.log(" Error while creating image thumb ");
                    resolve(null);
                } else {
                    resolve(pathToStoreThumb);
                }
            })

        });
    };


    this.crateThumbForVideo = function(pathToFile){
        return new Promise((resolve, reject) => {
        var _folder = path.dirname(pathToFile);
        var _fileName = path.basename(pathToFile);
            ffmpeg(pathToFile)
            .on('end', function(){
                console.log(` Thumb for video ${_fileName} created`);
                resolve(path.join(_folder, "thumb-" + _fileName));
            })
            .screenshots({
                count:1,
                timestamps: [ '50%' ],
                filename: `thumb-${_fileName}`,
                size: '600x?',
                folder: _folder
            });
        });
    };

    this.filesMetaDataUpdate = function(userObj, userId){
        return new Promise((resolve, reject) => {
                if(userObj.actualTotalFileSize > 0){
                    current.setUserFileUsage(userId, userObj.actualTotalFileSize)
                };
                userObj.files.forEach((file) => {
                    if(file.actualThumbName && file.url){
                        var domainName = file.url.split("/");
                        domainName.pop();
                        domainName = domainName.join("/") + "/";
                        current.setThumbNail(file.url, domainName + file.actualThumbName);
                    };
                    if(file.duration > 0){
                        current.setDuration(file.url, file.duration);
                    };
                    if(file.actualSize > 0){
                        current.setFileSize(file.url, file.actualSize);
                    }
                });
        });
    };

    this.setThumbNail = function(URL, thumbURL){
        return DB.query(`
        UPDATE video
        SET thumbnail = :thumbURL
        WHERE url = :URL`, { URL, thumbURL} , 'video');
    };

    this.setDuration = function(URL, duration){
        return DB.query(`
        UPDATE video
        SET duration = :duration
        WHERE url = :URL`, {URL, duration}, 'video');
    };

    this.setFileSize = function(fileURL, fileSize){
        return DB.query(`
        UPDATE video
        SET size = :fileSize
        WHERE url = :fileURL`, {fileURL, fileSize}, 'video');
    };

    this.setUserFileUsage = function(userId, fileUsage){
        return DB.query(`
        UPDATE users
        SET file_storage_used_byte = :fileUsage
        WHERE id = :userId
        `, {userId,  fileUsage }, 'users');
    };

    this.runFileSizeCheck = function(){
        return new Promise((resolve, reject) => {
            current.getUsersFileNames()
            .then((files) => {
                Object.keys(files).map((el) => current.getFilesActualSize(files[el].files));
                return files;
            })
            .then((files) => {
                return new Promise((resolve, reject) => {
                    Promise.all(Object.keys(files).map((el) => current.getVideoDuration(files[el].files)))
                    .then(() => {  resolve(files); })
                })
            })
            .then((files) => {
                return new Promise((resolve, reject) => {
                    Promise.all(Object.keys(files).map((el) => current.generateThumbsForFiles(files[el].files)))
                    .then(() => { resolve(files); })                
                })
            })
            .then((files) => {
                return new Promise((resolve, reject) => {
                    Object.keys(files).map((el) => current.calculateTotalFileSize(files[el]));
                    resolve(files);
                });
            })
            .then((files) => {
                return new Promise((resolve, reject) => {
                    Object.keys(files).map((el) => {
                        current.filesMetaDataUpdate(files[el], el);
                    });
                    resolve(files);
                })
            })
            .then((files) => {
                // FILES UPDATED;
            });
        });
    };

    this.runThumbFileCheck = function(){
        return new Promise((resolve, reject) => {
            current.getUsersFileNames()
            .then((files) => {

            });
        });
    };
};

module.exports = new fsCheck();