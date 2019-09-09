
var fs = require('fs');
var youtubedl = require('youtube-dl');
var path = require('path');
var appDir = path.dirname(require.main.filename);
const ytdl = require('ytdl-core');
var tvDB = require("./tv.js");
const crypto = require('crypto');
tvDB = new tvDB;
var downloaded = 0;

var yt = function(){

 this.getInfo = function(urlToGet){
   return ytdl.getInfo(urlToGet);
 }

 this.download = function(urlToGet, userID, req, res, userStorageInfo){
   return new Promise((mainResolve, mainReject) => {
     ;
     var fileSize = null;
       if(!urlToGet || !userID)
       {
       console.log(`  ------   Error. Not enough data provided for download from youtube function
         urlToGet=${urlToGet} userID=${userID}. Drats.   ------  `);
         mainReject("Not enough data provided to download function. Drats.");
       }
            tvDB.pullAllMediaURLForUser(userID)
            .then((data) => {
              var status = true;
              var fileName = urlToGet.split('//')[1].replace(/\/|\?\s/g,"_");
              fileName = generateIDtoInput();
              console.log(" ");
              console.log(' ====> Uploaded ' + fileName);
              var adress = "http://" + req.headers.host + "/";
                
              Object.keys(data).forEach((e) => {
                if(data[e].url == adress + "video/" + fileName + '.mp4')
                {
                  console.log(" User " + userID + " already got video " + urlToGet);
                  status = false;
                }
              })
              if(status)
              {
                return new Promise((resolve, reject) => {
                  console.log("Attempt to donwload video " + urlToGet);
                  var video = ytdl(urlToGet, { filter: (format) => format.container === 'mp4' })
                  fileName = fileName.replace(/[www.youtube.com | \?]/g,"_");
                  video.pipe(fs.createWriteStream('views/video/' + fileName + '.mp4'))
                  video.on('finish', () => {
                    console.log("Video was downloaded");
                  });
                  video.on('progress', (chunkLength, downloaded, total) => {
                    // in case we need send back downloading progress
                    // res.write((downloaded / total * 100).toFixed(2) + '% ');
                    if(userStorageInfo.limit < parseInt(userStorageInfo.used) + parseInt(total)){
                      ;
                      video.destroy();
                      res.status(507).send(" User storage limit exceeded "); 
                      reject(" User storage limit exceeded ");
                    }
                    console.log((downloaded / total * 100).toFixed(2) + '% ');
                    fileSize = total;
                  });
                  video.on('end', () => {
                    console.log(" ");
                    console.log(` ====> YouTube video was saved as ${adress}views/video/yt_video/${fileName}.mp4'`);
                    // res.end();
                    mainResolve({url: adress + "views/video/" + fileName + '.mp4', name:fileName + '.mp4', fileSize:fileSize});
                  });
                })
              }
              else {
                mainReject("User already have video " + urlToGet);
              }
            })
            .catch((err) => {
              console.log(` Error while pulling all media data for user
                Error:${err} .Drats. `);
                mainReject("Error" + err);
             })
         })
 }
}

function generateIDtoInput() {
  var chars = "1234567890";
  var value = new Array(20);
  var len = chars.length;
  var data = crypto.randomBytes(20);
  for (var i = 0; i <= 20; i++) {
      value[i] = chars[data[i] % len];
  }
  return value.join("");
}

module.exports = yt;
