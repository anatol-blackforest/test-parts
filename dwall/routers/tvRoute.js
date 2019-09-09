var express = require('express');
var router = express.Router();
var tvInteractions = require("../modules/tv.js");
var tvServices = require("../modules/tvServises.js");
var userServices = require("../services/userServ.js")
// const getFromS3 = require("../services/s3service/getter.service.js")

var tvInt = new tvInteractions();
var tv = new tvServices;
var uSerices = new userServices();
const JwtCipher = require('../modules/pass.js');
var multer = require('multer');
var upload = multer({ dest: './' });

// TO DO 
// separate routes to different modules

router.get("/myTv", JwtCipher.isAuthenticated(), tv.pullAll); //ok
router.post("/addTv", JwtCipher.isAuthenticated(), tv.addNew); //maybe ok
router.post("/removeTv", JwtCipher.isAuthenticated(), tv.remove); //maybe ok

router.post("/saveVideoUrl", JwtCipher.isAuthenticated(), tv.saveVideoUrl);
router.post("/addVideo", JwtCipher.isAuthenticated(), tv.addVideo);
router.delete("/removeVideo", JwtCipher.isAuthenticated(), tv.removeVideo);
router.post("/removeUrl", JwtCipher.isAuthenticated(), tv.removeVideoURL);
router.post("/update", JwtCipher.isAuthenticated(), tv.update);
router.get("/createIdToInput", JwtCipher.isAuthenticated(), tv.createIdToInput);
router.post("/video/upload", JwtCipher.isAuthenticated(), tv.uploadVideo);
router.get("/video/myVideo", JwtCipher.isAuthenticated(), tv.pullAllMyVideo);
// router.get("/video/getFromS3/:key", JwtCipher.isAuthenticated(), getFromS3);
// /tv/video/getFromS3/:key

// router.post("/video/localMeidaUpload", JwtCipher.isAuthenticated(), tv.localMeidaUpload);
router.post("/video/localMeidaUpload", JwtCipher.isAuthenticated(), uSerices.uploadMediaToS3);
// router.post("/video/localMeidaUpload", JwtCipher.isAuthenticated(), uSerices.uploadMediaFromUserPC);
router.post("/video/loadFromYouTube", JwtCipher.isAuthenticated(), tv.loaderFromYouTube);
// router.post("/video/loadFromYouTube", JwtCipher.isAuthenticated(), tv.loadFromYouTube);

router.post("/video/playInTime", tv.playInTime);
router.post("/video/getShedule", JwtCipher.isAuthenticated(), tv.getShedule);

router.get("/myPlayLists", JwtCipher.isAuthenticated(), tv.pullMyPlaylists)
router.post("/video/createPlayList", JwtCipher.isAuthenticated(), tv.createPlayList);
router.post("/video/updatePlayList", JwtCipher.isAuthenticated(), tv.updatePlayList);
router.post("/video/deletePlayList", JwtCipher.isAuthenticated(), tv.deletePlayList);
router.post("/video/sheduleMedia", JwtCipher.isAuthenticated(), tv.addNewSheduleEvent);
router.post("/video/removeEvent", JwtCipher.isAuthenticated(), tv.removeEvent);

router.post("/video/minorTVupdate", JwtCipher.isAuthenticated(), tv.minorTVupdate);
router.post("/addStripe", JwtCipher.isAuthenticated(), tv.saveStripe);
router.post("/addStripeToPlayList", JwtCipher.isAuthenticated(), tv.addStripeToPlayList)
router.get("/pullStripes", JwtCipher.isAuthenticated(), tv.pullStripes);
router.post("/setStripeColors", JwtCipher.isAuthenticated(), tv.setStripeColors);
router.post("/deleteStripe", JwtCipher.isAuthenticated(), tv.deleteStripe);

router.post("/playVideoFromLocalStorage", JwtCipher.isAuthenticated(), tv.playVideoFromLocalStorage);
router.post("/playImgFromLocalStorage", JwtCipher.isAuthenticated(), tv.playImgFromLocalStorage);
router.post("/playPlayListFromLocalStorage", JwtCipher.isAuthenticated(), tv.playPlayListFromLocalStorage);

router.get("/myGroups", JwtCipher.isAuthenticated(), tv.pullMyGroups);
router.post("/createGroup", JwtCipher.isAuthenticated(), tv.createGroup);
router.post("/deleteGroup", JwtCipher.isAuthenticated(), tv.deleteGroup);
router.post("/addTVtoGroup", JwtCipher.isAuthenticated(), tv.insertTVIntoGroup);
router.post("/addInfoToGroup", JwtCipher.isAuthenticated(), tv.addInfoToGroup);
router.post("/removeTVfromGroup", JwtCipher.isAuthenticated(), tv.removeTVfromGroup);

router.post("/updateMediaName", JwtCipher.isAuthenticated(), tv.updateMediaName);
router.post("/updateMediaNote", JwtCipher.isAuthenticated(), tv.updateMediaNote);
router.post("/updateMediaRecords", JwtCipher.isAuthenticated(), tv.updateMediaRecords);
router.post("/updateStripeText", JwtCipher.isAuthenticated(), tv.updateStripeText)

router.get("/schedule", JwtCipher.isAuthenticated(), tv.pullSchedule);
router.post("/schedule", JwtCipher.isAuthenticated(), tv.validateSchedule, tv.saveSchedule);
router.delete("/schedule", JwtCipher.isAuthenticated(), tv.deleteEvent);
router.put("/schedule", JwtCipher.isAuthenticated(), tv.updateEvent);
router.delete("/media", JwtCipher.isAuthenticated(), tv.deleteMedia);
router.post("/timezone", JwtCipher.isAuthenticated(), tv.saveUserTimeZone);
router.get("/timezone", JwtCipher.isAuthenticated(), tv.pullUserTimeZone);

router.get("/deviceLimit", JwtCipher.isAuthenticated(), tv.getDeviceLimit);

router.post('/testrss', tv.testRss);
router.post('/checkUrl', tv.testUrl);
// router.post("/emitNewPlayListEvent", JwtCipher.isAuthenticated(), tv.emitNewPlayListEvent);
module.exports = router;
