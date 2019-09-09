const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const {promisify} = require('util');
const ytdl = require('ytdl-core');
const AWS = require('aws-sdk');
const stat = promisify(fs.stat);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const thumb = require('node-thumbnail').thumb;
const gm = require('gm').subClass({imageMagick: true});
const S3BucketController = require('../controllers/uploader.controller.js');
// const getUserFileStorageInUse = require("../controllers/s3controllers/storagestate.controller.js")
const send = require("./logger.service.js");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const ENDPOINT = process.env.ENDPOINT || 's3.amazonaws.com';
const BUCKET_NAME = process.env.BUCKET_NAME || 'dwall-eu';
const IAM_USER_KEY = process.env.AWS_ACCESS_KEY_ID;
const IAM_USER_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
let targetFile, targetFileName

class S3Bucket {

    uploader(data){
        let {request} = data
        return new Promise(function(resolve, reject) {
            try{
                const busboy = new Busboy({ 
                    headers: request.headers, 
                    limits: {
                        fileSize: 1024*1024*1024*2 //2gb limit
                    } 
                });
                busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
                    let targetFile, targetFileName
                    const extname = filename.substring(filename.lastIndexOf(".")).toLowerCase()
                    const hashFileName = Date.now() + await md5(filename.toLowerCase())
                    targetFileName = hashFileName + extname
                    targetFile = path.join(__dirname, "/../tmp/original/" + targetFileName)
                    const target = fs.createWriteStream(targetFile)
                    file.pipe(target)
                    target.on("finish", async () => {
                        var stats = await stat(targetFile);
                        let obj = {...data, filename, targetFileName, hashFileName, mimetype, size: stats.size, name: fieldname}
                        resolve(obj)
                    })
                });
                request.pipe(busboy);
            }catch(e){
                reject(e)
            } 
        })
    }

    youtube(data) {
        let {request} = data
        return new Promise(async (resolve, reject) => {
            try{
                let filename = request.body.name
                const extname = '.mp4'
                const hashFileName = Date.now() + await md5(filename.toLowerCase())
                targetFileName = hashFileName + extname
                targetFile = path.join(__dirname, "/../tmp/original/" + targetFileName)
                const target = fs.createWriteStream(targetFile)
                const video = ytdl(request.body.url, { filter: (format) => format.container === 'mp4' })
                video.pipe(target)
                video.on('finish', () => {
                  console.log("Video was downloaded");
                });
                video.on('progress', (chunkLength, downloaded, total) => {
                  console.log((downloaded / total * 100).toFixed(2) + '% ');
                });
                target.on("finish", async () => {
                    var stats = await stat(targetFile);
                    var size = stats.size;
                    let obj = {...data, filename, targetFileName, hashFileName, mimetype: "video/mp4", size, name: filename}
                    console.log(` ====> YouTube video was saved`);
                    resolve(obj)
                })
            }catch(e){
                stat(targetFile).then(() => fs.unlink(targetFile))
                reject(e)
            }
        })
    }

    checkUserUploadPermit(request, response, userId){
        let result = {
            status:false,
            userId,
            request,
            response
        }
        return new Promise((resolve, reject) => {
            let contentLength = parseInt(request.headers["content-length"]);
            if(!isNaN(contentLength)){
                console.log(" User  " + userId + " is trying to load " + contentLength + " bytes ");
                S3BucketController.getUserFileStorageInUse(userId)
                .then((data) => {
                    console.log(data)
                    if(data && (parseInt(data.limit) >= (parseInt(data.used) + parseInt(contentLength)))){ 
                        result.status = true;
                        resolve(result);
                    }else{ 
                        resolve(result) 
                    }
                })
            }
        });
    };

    thumbinator(data) {
        return new Promise(function(resolve, reject) {
            let {filename, targetFileName, hashFileName} = data
            let targetFolder = path.join(__dirname, "/../tmp/thumb/")
            let incomingFile = path.join(__dirname, "/../tmp/original/", targetFileName)
            let duration = null; 
            let dimensions = null;
            if(data.mimetype.indexOf("video") !== -1){
                ffmpeg(incomingFile)
                    .on('end', function() {
                        console.log('Screenshots taken');
                        let obj = {...data, thumb: "Thumb-" + hashFileName + ".jpg", duration, dimensions}
                        resolve(obj);
                    })
                    .on('error', function(err) {
                        console.log(err);
                        reject("Screenshot error");
                    })
                    .screenshots({
                        timestamps: [ '50%' ],
                        filename: "Thumb-" + hashFileName + ".jpg",
                        size: '600x?',
                        folder: targetFolder,
                    })
                    .ffprobe(incomingFile, function(err, metadata) {
                        duration = metadata.format.duration;
                        dimensions = `${metadata.streams[0].width} × ${metadata.streams[0].height}`
                    })
            }else if(data.mimetype.indexOf("image") !== -1){
                let obj = {...data}
                gm(incomingFile)
                .scale(450)
                .size(function (err, size) {
                    if (!err) obj.dimensions = `${size.width} × ${size.height}`
                })
                .write(targetFolder + "Thumb-" + targetFileName, function (err) {
                    if (!err) {
                        obj.thumb = "Thumb-" + targetFileName
                        resolve(obj);
                    }else{
                        reject(err)
                    }
                });
            }else{
                reject("Ошибка загрузки - неизвестный формат данных") 
            }
        })
    }

    bucketUploader(data) {
        let {filename, targetFileName, thumb} = data
        return new Promise(function(resolve, reject) {
            try{
                const incomingFile = path.join(__dirname, "/../tmp/original/", targetFileName)
                const incomingThumb = path.join(__dirname, "/../tmp/thumb/", thumb)
                const incomingFileStream = fs.createReadStream(incomingFile)
                const incomingThumbStream = fs.createReadStream(incomingThumb)
                const result = {}
                const s3uploader = (incomingStream, incomingFile, filename) => {
                    return new Promise(function(resolve, reject) {
                        const params = {Body: incomingStream, Bucket: BUCKET_NAME, Key: filename, ACL: 'public-read'};
                        const s3bucket = new AWS.S3({
                            params,
                            endpoint: ENDPOINT,
                            s3ForcePathStyle: true,
                            accessKeyId: IAM_USER_KEY,
                            secretAccessKey: IAM_USER_SECRET,
                            Bucket: BUCKET_NAME
                        });
                        s3bucket.upload().on('httpUploadProgress', function (evt) {
                            console.log(evt);
                        }).send(function (e, data) {
                            stat(incomingFile).then(() => fs.unlink(incomingFile))
                            if (e) console.log('s3bucket error: ', e);
                            console.log('Successfully uploaded data'); 
                            resolve(data)
                        });
                    })
                }
                new Promise(function(resolve, reject) {
                    resolve()
                }).then(() => {
                    return s3uploader(incomingFileStream, incomingFile, targetFileName)
                }).then((data) => {
                    result.dataFile = data
                    return s3uploader(incomingThumbStream, incomingThumb, thumb)
                }).then((info) => {
                    result.dataThumb = info
                    return resolve({...data, result})
                }).catch((e) => {
                    reject(e)
                })
            }catch(e){
                reject(e)
            }
        })
    
    }

    remover(Key) { 
        return new Promise(function(resolve, reject) {
            try{
                Key = Key.slice(Key.lastIndexOf("/") + 1)
                console.log(Key) 
                const s3bucket = new AWS.S3({
                    accessKeyId: IAM_USER_KEY,
                    secretAccessKey: IAM_USER_SECRET,
                    Bucket: BUCKET_NAME
                }); 
                const params = {
                    Bucket: BUCKET_NAME,
                    Key
                };
                s3bucket.deleteObject(params, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        reject(err)
                    } 
                    else {
                        console.log(data);
                        resolve(data)
                    }           
                }); 
            }catch(e){
                reject(e)
            }
    
        })
    
    }

    renderer(data) {
        const {request, response, result} = data
        const message = {
            "status":"Saved",
            "url": data.result.dataFile.Location,
            "thumbnail": data.result.dataThumb.Location,
            "name": data.fileName,
            "id": data.id,
            "note": (data.request.query && data.request.query.fileNote) ? data.request.query.fileNote : ""
        }
        // User/DateTime/filename/ IP Address/filesize
        let info = {event: "fileupload", filename: data.fileName, filesize: data.size}
        send.log(request.user.id, "File upload", request, response, message, 200, info)
        // response.status(200).send(message)
    }

    errorHandler(res, error) {
        res.status(500).send(" Error. " + error);
    } 
}

module.exports = new S3Bucket
