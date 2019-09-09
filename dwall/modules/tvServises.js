
var multer = require('multer');
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var upload = multer({ dest: './' });
var yt = require('./youTubeDownloader.js');
var tvDB = require("./tv.js");
var helperFunctions = require('./helpers.js')
var mControlModule = require('../controllers/media.js')
var mControl = new mControlModule();
var helpers = new helperFunctions();
const send = require("../services/logger.service.js");
// setting ffmpeg lib (for making thumbnails from YouTube video)
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffprobePath = require('@ffprobe-installer/ffprobe').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const DB = require("./sql.js");

const S3BucketServise = require("../services/uploader.service.js");
const S3BucketController = require('../controllers/uploader.controller.js');

tvDB = new tvDB;
// var youtube = new yt;

// var helperFunctions = require('./helpers.js')
// var helpers = new helperFunctions();

 function tvServices(){
 	currentModule = this;

 	this.pullAll = function(req, res){
 		return new Promise(function(resolve, reject){
 			var userId = req.user.id;
 			tvDB.pullAll(userId).then((d) => {
 				res.send({"Res":d});
 				resolve(d);
 			},(e) => {
 				res.send({"Err":e});
 				reject(e);
 			});
 		})
 	};


  this.saveStripe = function(req, res){
    console.log(" ");
    console.log(" Attempt to add new stripe ");
    return new Promise((resolve, reject) => {
      var userId = req.user.id;
      tvDB.addNewStripe(userId, req.body)
      .then((d) => {
        res.send({"status":"new stripe was saved to media"});})
      .catch((e) => {
        res.send({"status":"error", "err":e});
      })
    })
  };

  this.deleteMedia = function(req, res){
	  console.log(" Deleting media ");
	  var userId = req.user.id;
	  return new Promise((resolve, reject) => {
		tvDB.deleteMedia(userId, req.body.id)
		.then(() => {
			res.status(200).send("media was deleted")})
		.catch((error) => {
			res.status(500).send({"status":"Error while deleting media", "error": error})
	  });
  })};


  this.deleteStripe = function(req, res){
    console.log(" ");
    console.log(" Deleting stripe ");
    var userId = req.user.id;
    var stripeID = req.body.stripe;
    return new Promise((resolve, reject) => {
      var userId = req.user.id;
      tvDB.deleteStripe(userId, stripeID)
      .then(() => {res.status(200).send({"status":"stripe deleted"})})
      .catch((error) => {
        console.log(" --- Error while deleting stripe ---");
        console.log(error);
        console.log("   ------------  ");
        res.status(500).send(({"status":"error", "error":error}));
      })
    });
  };


  this.addNew = function(req, res){
	console.log(" ");
	console.log(" ===> New tv <=== ");
	console.log(" ");
 	return new Promise(function(resolve, reject){
 			var userId = req.user.id;
 			tvDB.addNew(userId, req.body).then((tvData) => {
        		res.send(tvData);
 				resolve(tvData);
 			},(e) => {
 				res.status(501).send({"Err": e});
 				console.log("Error while adding new TV");
 				console.log("------ Details -------");
 				console.log(e);
 				console.log("----------------------");
 			});
 		})
	 };
	
	this.getDeviceLimit = function(req, res) {
		var userId = req.user.id;
		console.log(" ");
		console.log(`Attempt to get device limit for user with id ${userId}`);
		return new Promise((resolve, reject) => {
			tvDB.getDeviceLimit(userId)
				.then((data) => {
					console.log(`Data recieved: ${data}`)
					res.send(data);
					resolve();
				}, (err) => {
					console.log(`Error occured: ${err}`)
					res.send(err);
					reject();
				})
		})
	}

 	this.remove = function(req, res){
 		return new Promise(function(resolve, reject){
 			var userId = req.user.id;
 			var guid = req.body.guid;
 			tvDB.remove(userId, guid).then((d) => {
 				res.send({"Status":"Tv was deleted"});
 				resolve(d);
 			},(e) => {
 				res.send({"Err":e});
 				reject(e);
 			})
 		})
 	};

 	this.saveVideoUrl = function(req, res){
 		var userId = req.user.id;
 		var videoURL = req.body.videoURL;
 		return new Promise(function(resolve, reject){
 			tvDB.saveVideoUrl(videoURL, userId).then((d) => {
 				res.send({"Status":"Video url was uploaded"});
 				resolve(d);
 			}, (e) => {
 				res.send({"Err":e});
 				reject(e);
 			}
		)
 	 })
 	};

 	this.uploadVideo = function(req, res){
 		var userId = req.user.id;
 		var fileName = req.body.fileName;
 		var video_data = req.body.data;
 		tvDB.uploadVideo(fileName, video_data, userId);
 		res.status(200);
 		res.end();
 	};

 	this.addVideo = function(req, res){
 		var userId = req.user.id;
 		var guid = req.body.guid;
 		var videoId = req.body.videoId;
 		return new Promise(function(resolve, reject){
 			tvDB.addVideo(userId, guid, videoId).then(() => {
 				res.send({"Status":"Video was subscribed to tv"});
 				resolve();
 			}), (e) => {
 				res.send({"Err":e});
 				reject(e);
 			}
 		})
	 };
	 
	this.updateMediaName = function(req, res){
		return new Promise((resolve, reject) => {
			tvDB.updateMediaName(req.body.id, req.body.newName)
			.then(() => {res.status(200).send({"Status":"media was updated"})})
			.catch((error) => {res.status(502).send({"Status" : error})});
		})
	};

	this.updateMediaNote = function(req, res){
		console.log(" Attempt to update media note ");
		return new Promise((resolve, reject) => {
			tvDB.updateMediaNote(req.body.id, req.body.newNote)
			.then(() => {res.status(200).send({"Status":"media was updated"})})
			.catch((error) => {res.status(502).send({"Status":error})})
		})
	};

	this.updateMediaRecords = function(req, res) {
		console.log(" Attempt to update media records ");
		return new Promise((resolve, reject) => {
			tvDB.updateMediaRecords(req.body.id, req.body.newName, req.body.newNote)
			.then(() => {res.status(200).send({"Status":"media was updated"})})
			.catch((error) => {res.status(502).send({"Status":error})})
		})
	}

	this.updateStripeText = function(req, res) {
		console.log(" Attempt to update stripe text ");
		return new Promise((resolve, reject) => {
			tvDB.updateStripeText(req.body.id, req.body.newText)
			.then(() => {res.status(200).send({"Status":"media was updated"})})
			.catch((error) => {res.status(502).send({"Status":error})})
		})
	}

 	this.pullAllMyVideo = function(req, res){
 		var userId = req.user.id;
 		return new Promise(function(resolve, reject){
 			tvDB.pullAllMyVideo(userId).then((d) => {
 				res.send(d);
 				resolve();
 			}, (e) => {
 				res.send({"Err":e});
 				reject(e);
 			})
 		})
 	};

 	this.pullMyPlaylists = function(req, res){
		var userId = req.user.id;
 		return new Promise((resolve, reject) => {
			 var result = {
				urlMap : {}
			};

 			tvDB.pullMyPlaylists(userId)
            .then((d) => {
 				if (d.length == 0) {
 					res.status(200).send([]);
 				}
				 var resultPlaylists = {};
				 var queueForListFormatting = []; //query to format URL to media objects
				 var queueForStripeIds = [];
				 const queryForOverlays = [];
				 var playlistIds = d.map((el) => el.id).filter((el, i, a) => a.indexOf(el) == i);
				 //initialize empty playlist objects
				 playlistIds.forEach((el) => {resultPlaylists[el] = {stripe_color:null, stripe_background:null, media:[], id:null, list_name:null, list_note:null, stripe_id:null, stripe_text:null}}); 
				 //sort media by playlists
				 d.forEach((el) => {

					 resultPlaylists[el.id].id = el.id;
					 resultPlaylists[el.id].stripe_color = el.stripe_color;
					 resultPlaylists[el.id].stripe_background = el.stripe_background;
					 resultPlaylists[el.id].rss_update_interval = el.rss_update_interval;
					 resultPlaylists[el.id].list_name = el.list_name;
					 resultPlaylists[el.id].list_note = el.list_note;
					 resultPlaylists[el.id].overlayId = el.overlay_id;
					 resultPlaylists[el.id].stripe_id = el.stripe_id;
					 queueForListFormatting.push(el.url);
					 queueForStripeIds.push(el.stripe_id);
					 if(el.url && (el.url != "null")){

						resultPlaylists[el.id].media.push({
							url:el.url, 
							v_order:el.v_order, 
							duration:el.duration, 
							name:el.media_name,
							note: el.note,
							thumbnail: el.thumbnail,
							size: el.size,
							id: el.id
						})

					 }
					 if (el.overlay_id) {
						 queryForOverlays.push(el.overlay_id);
					 }

				}); 

				queueForListFormatting = queueForListFormatting.filter((el, i, a) => a.indexOf(el) == i);
				queueForStripeIds = queueForStripeIds.filter((el, i, a) => a.indexOf(el) == i);
				
				//convert URLs to  media objects
				helpers.formatMediaByURL(queueForListFormatting)
				.then((data) => {
					data.data.forEach(el => {
						Object.keys(resultPlaylists).forEach((elem) => {
							resultPlaylists[elem].media.forEach((e) => {
								if(e.url == el.url){Object.assign(e, el)}
							});
						})
					});
				})				
				.then(() => helpers.pullOverlay(queryForOverlays))
				.then(overlays => {
					Object.keys(resultPlaylists).forEach(playlistId => {
						if (resultPlaylists[playlistId].overlayId) {
							const OL = overlays.find(o => o.id === resultPlaylists[playlistId].overlayId);
							resultPlaylists[playlistId].overlayType = (OL && OL.overlay) ? 'overlay' : 'image';
						} else {
							resultPlaylists[playlistId].overlayType = null;
						}
					})
				})
				.then(() => helpers.pullTextForStripe(queueForStripeIds))
				.then((data) => {
					data.stripeData.forEach((el) => {
						if(resultPlaylists[el.list_id.toString()]){
							resultPlaylists[el.list_id]["stripe_text"] = el.text_data;
						}})
						return resultPlaylists;
					})
				.then((result) => {
					result = Object.keys(result).map((el) => {
						function compareNumeric(a, b) {
							if (a.v_order > b.v_order) return 1;
							if (a.v_order < b.v_order) return -1;
						  }
						result[el].media = result[el].media.sort(compareNumeric)
						return result[el]
					});
					res.status(200).send(result);
				});
 			}, (e) => {
 				res.send({"Err":e});
 				reject(e);
 			})
 		})
 	};


  this.pullStripes = function(req, res){
    var userId = req.user.id;
    return new Promise((resolve, reject) => {
      tvDB.pullMyStripes(userId).then((d) => {
        res.send(d);
        resolve()})
      .catch((e) => {
        res.send({"Err":e});
        reject(e);
      })
    })
  };


this.updatePlayList = function(req, res){
 	var userId = req.user.id;
    var payload = {};
    if (req.body.id) { 
      payload = req.body;
    } else { 
      payload = JSON.parse(req.body.data);
	}
    var data = {
      userId,
      stripe_background: payload.stripe_background ? payload.stripe_background : null,
      stripe_color: payload.stripe_color ? payload.stripe_color : null,
	  stripe_id: payload.stripe_id ? payload.stripe_id : null,
	  overlayId : payload.overlayId ? payload.overlayId : null,
	  stripe_text: payload.stripe_text ? payload.stripe_text : null,
	  rss_update_interval: payload.update_interval
    };
    if (payload.id) data.id = payload.id;
	if (payload.list_name) data.list_name = payload.list_name.replace(/'/g,"\\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
	data.list_note = "";
	if(payload.list_note){
		 data.list_note = payload.list_note.replace(/'/g,"\\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
	}
    if (payload.media) data.media = payload.media;
    if (payload.total) data.total = payload.total;
 		return new Promise((resolve, reject) => {
			tvDB.setStripeColors(data.userId, data.id, data.stripe_color, data.stripe_background)
			 .then(res => {
				return tvDB.updatePlayList(data);
			 })
			 .then((tvsToUpdate) => {
          if (tvsToUpdate.length && typeof tvsToUpdate[0] !== 'string') {
            tvsToUpdate = tvsToUpdate.map(tv => {
              return tv.guid;
            });
          }
          
          if (tvsToUpdate.length) tvDB.emitRefreshToGivenGUIDs(tvsToUpdate);

					res.status(200).send("OK");
					resolve();
				});
 			}, (e) => {
 					res.status(500).send({"Err":e});
 					reject(e);
 			});
 	};


  this.deletePlayList = function(req, res){
    var userId = req.user.id;
    var listID = req.body.listID;
    return new Promise((resolve, reject) => {
       tvDB.deletePlayList(userId, listID)
      .then(() => {
        res.status(200).send({"status":"OK"});
        resolve();
      })
      .catch((e) => {res.status(500).send({"status":"error","err":e})});
    });
  };

  
  this.testRss = function(req, res) {
    new Promise((resolve, reject) => {
        resolve('gotten');
    })
    .then(data => {
        request({
            url: req.body.url,
            method: 'GET',
            encoding: 'binary'
        }, (err, response, body) => {
            if (err) {
                console.log('Error occured: ', err);
                res.status(404).send(err);
            }
			console.log('Data recieved::RSS');
			if (body) {
				try {
					body = new Buffer(body, 'binary');
					parser.parseString(body, function (err, result) {
						if (result && result.hasOwnProperty('rss')) {
							res.status(200).send(result.rss);
						} else {
							res.status(404).send({ data: 'RSS not found' });
						}
					})
				} catch (err) {
					res.status(404).send(err);
				}
			} else {
				res.status(404);
			}
        });
    })
  }


 	this.getShedule = function(req, res){
 		console.log("Request for shedule");
 		var userId = req.user.id;
 		var guid = req.body.guid;
 		console.log(" ------ GUID:" + guid + " -------- ");
 		console.log(req.body);
 		return new Promise((resolve, reject) => {
 			tvDB.getShedule(guid).then((d) => {
 				res.send(d);
 				resolve();
 			}, (e) => {
 				res.send({"Err":e});
 				reject(e);
 			})
 		})
 	};

 	this.removeEvent = function(req, res){
 		console.log("Attempt to remove event");
 		return new Promise((resolve, reject) => {
 			tvDB.removeEvent(req.body).then(() => {
 				res.status(200).send("OK");
 			}, (e) => {
 				res.status(500).send({
 					"Err":e
 				});
 			});
 		})
 	};

 	this.removeVideo = function(req, res){
 		var userId = req.user.id;
 		var guid = req.body.guid;
 		var videoURL = req.body.videoURL;
 		return new Promise(function(resolve, reject){
 			tvDB.removeVideo(userId, guid, videoId).then(() => {
 				res.send({"Status":"Video was subscribed to tv"});
 				resolve();
 			}), (e) => {
 				res.send({"Err":e});
 				reject(e);
 			}
 		})
 	};

 	this.removeVideoURL = function(req, res){
		 var videoURL = req.body.url;
 		return new Promise(function(resolve, reject){
 			tvDB.removeVideoURL(videoURL).then(() => {
 				res.send({"Status":"Video was removed"});
 				resolve();
 			}, (e) => {
 				res.send({"Err":e});
 				reject(e);
 			})
 		})
	};

 	this.addNewSheduleEvent = function(req, res){
 		var userId = req.user.id;
		return tvDB.addNewSheduleEvent(req.body, userId)
		.then((data) => {
			res.status(200).send("OK");
		});
 	};

  this.minorTVupdate = function(req, res){
    console.log("Small update on tv");
    var userId = req.user.id;
    return new Promise((resolve, reject) => {
      tvDB.minorTVupdate(req.body, userId)
      .then(() => res.status(200).send("ok"))
      .catch((e) => res.status(500).send({"Error":e}))
    })
  };

 	this.update = function(req, res){
 		console.log("Updating TV data");
 		console.log(req.body);
 		var userId = req.user.id;
 		var tvName = req.body.name || '';
 		var tvLocation = req.body.location || '';
 		var tvNote = req.body.notes || '';
 		var url = req.body.url || '';
 		var guid = req.body.guid
 		var start = req.body.start;
 		var end = req.body.end;
 		var constant_play = req.body.constant_play;
 		var fallbackURL = req.body.fallbackURL;
 		var playListStatus = req.body.playListStatus;
		var playListSelect = req.body.playListSelect;
		var orientation = req.body.orientation;
  return new Promise(function(resolve, reject){
			   tvDB.addFallBack(fallbackURL, guid);
			  if (constant_play !== 'true') {
	 			tvDB.update(tvName, tvLocation, tvNote, guid, url, userId, false, playListStatus, playListSelect, constant_play, orientation).then(() => {
	 				res.send({"Status":"TV data was updated."});
	 				resolve();
	 			}, (e) => {
	 				res.send({"Err":e});
	 				resolve(e);
	 			});
			  } else if(constant_play == 'true' || playListStatus == "true")
 			  {
 			  	console.log(" -------- Setting constant play for TV " + tvName + " ------- ");
	 			tvDB.update(tvName, tvLocation, tvNote, guid, url, userId, false, playListStatus, playListSelect, constant_play, orientation).then(() => {
	 				res.send({"Status":"TV data was updated."});
	 				resolve();
	 			}, (e) => {
	 				res.send({"Err":e});
	 				resolve(e);
	 			});
 			  }
 			  else
 			  {
 			  	console.log(" ------- Setting sheduled video for TV " + tvName);
 			  	tvDB.update(tvName, tvLocation, tvNote, guid, url, userId, true, playListStatus, playListSelect, constant_play, orientation).then(() => {
 			  		tvDB.stashPreviousURL(guid).then(
 			  		tvDB.addVideoToTempPlay(guid, url, start, end))
 			  		.then(() => {
 			  		 console.log(" -------- Video was sheduled -------- ");
 			  		 res.send({"Status":"Video was sheduled"});
 			  		 resolve();
					   });
 			  	}, (e) => {
 			  		res.send({"Err":e});
 			  		resolve(e);
 			  	})
			   }
 		})
 	};

 	this.createIdToInput = function(req, res){
 		var userId = req.user.id;
 		return new Promise(function(resolve, reject){
 			tvDB.createIdToInput(userId).then((idToInput) => {
 				res.send({
 				"Status":"Id to input was created.",
 				"id":idToInput
 			    });
 				resolve();
 			}, (e) => {
 				res.send({"Err":e});
 				reject(e);
 			})
 		})
 	};

 	this.playInTime = (req, res) => {
 		// Need to check if video has a playlist on it and play
 		// only if there is no current playlist available
 		 console.log("");
 		 console.log(" -------- Playing video in time -------- ");
 		 console.log("");
 		 res.status(200).send("Playing in time");
 		 return new Promise((resolve, reject) => {
	 		 tvDB.getPlayInTimeList()
	 		.then((data) => {return tvDB.getCurrentPlayInTimeList(data)})
	 		.then((data) => {return tvDB.updatePlayInTimeList(data)})
 			.then((data) => {return tvDB.emitUpdatesToTV(data)})
 		 })
 	};

 	this.createPlayList = function(req, res){
    console.log('[createPlayList::service]');
 	  var userId = req.user.id;
    var data = {};
    data.media = req.body.media;
    data.stripe_background = req.body.stripe_background;
    data.stripe_color = req.body.stripe_color;
	  data.stripe_id = req.body.stripe_id;
	  data.overlayId = req.body.overlayId || null;
	  data.total = req.body.total;
	  data.update_interval = req.body.update_interval;
    data.list_name = req.body.list_name.replace(/'/g,"\\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
	  data.list_note = req.body.list_note.replace(/'/g,"\\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
 		return new Promise(function(resolve, reject){
 			tvDB.createPlayList(data, userId)
      .then(() => {
 				res.status(200).send({"Status":"New playlist created"});
 			}, (e) => {res.status(500).send({"Err":e})});
 		});
 	};

  this.addStripeToPlayList = function(req, res){
    var userId = req.user.id;
    var playList = req.body.playList;
    var stripeID = req.body.stripeID;
    return new Promise((resolve, reject) => {
      tvDB.addStripeToPlayList(userId, playList, stripeID)
      .then(() => {res.send({"status":"ok"})})
      .catch((error) => res.send({"Err":error}));
    })
  };


  this.setStripeColors = function(req, res){
    var userId = req.user.id;
    var playlistID = req.body.playList;
    var stripeColor = req.body.stripe_color;
    var stripeBG = req.body.stripe_bg;
    var stripeID = req.body.stripeID;
    return new Promise((resolve, reject) => {
	  tvDB.setStripeColors(userId, playlistID, stripeColor, stripeBG)
	  .then(() => { return helpers.pullAllGUIDSforPlaylistAndUser(userId, playlistID) })
	  .then((GUIDs) => { 
		  return true
		// commented to check if this causing issues in switching playlist => constant play 
		//   return Promise.all(tvDB.runListFromLocalStorage(userId, GUID, playlistID)); 
	   })
      .then(() => { 
		  ;
		  res.send({"status":"ok"})
		 })
      .catch((error) => res.send({"Err":error}))
    })
  };

  this.loaderFromYouTube = function(req, res) {
	req.setTimeout(0);
	console.log(" -------- Loading from YouTube NEW! --------");

	var userId = req.user.id

	var note = req.query.fileNote || "";
	var metadata = {};
	if(!req.headers["content-length"]){ res.status(400).send(" content-length header expected "); return; }

	S3BucketServise.checkUserUploadPermit(req, res, userId)
		.then((data) => {
			return S3BucketServise.youtube(data);
		})
		.then((data) => { 
			// create thumbnail from temp file
			return S3BucketServise.thumbinator(data)
		})
		.then((data) => { 
			// upload file & thumbnail to bucket & delete temporary files
			return S3BucketServise.bucketUploader(data)
		})
		.then((data) => { 
			// render result
			return S3BucketController.dbPush(data)
		})
		.then((data) => { 
			// render result
			return S3BucketServise.renderer(data)
		})
		.catch((err) => {
			// render error
			S3BucketServise.errorHandler(res, err)
		});

	
	
  }

 	this.loadFromYouTube = function(req, res) {
		req.setTimeout(0);

      console.log(" -------- Loading from YouTube --------");
	  var mediaName = req.body.name || "name not set";
	  var mediaNote = req.body.note;
	  var userId = req.user.id;
	  var ytFileName = null;
	  var duration = null;
	  var dimensions = null;
	  var size = null;

	  return new Promise((resolve, reject) => {

		mControl.getUserFileStorageInUse(userId)
			.then(userStorage => {
				return youtube.download(req.body.url, userId, req, res, userStorage);
			})
			.then(data => {
				return mControl.reduceUserFreeStorage(userId, data.fileSize, data);
			})
			.then(data => {
				return mControl.createThumbForVideo(
					'views/video/' + data.name,
					mediaName,
					'',
					'views/video/' + 'thumb-' + data.name,
					data.fileSize,
					data
				);
			})
			.then(data => {
				ytFileName ='thumb-' + data.fileData.name.replace('.mp4', '.jpg');
				duration = data.duration;
				size = data.size;
				dimensions = data.dimensions;
				return tvDB.saveVideoUrl(data.fileData.url, userId);
			})
			.then(savedUrl => {
				let promises = [];
				promises.push(tvDB.setMediaNameByURL(savedUrl, mediaName, mediaNote, size, duration, dimensions));
				promises.push(tvDB.saveThumbNailsForURL(savedUrl, "http://" + req.headers.host + "/views/video/" + ytFileName))
				return Promise.all(promises);
			})
			.then(data => {
				res.status(200).send({
					"status": "downloaded from youtube",
					"url": data[0].f_url,
					"mediaName": mediaName,
					"thumb": ytFileName,
					"id": data[0].f_id
				});
			})
			.catch(err => {
				res.status(501).send(err);
			})
	  })
	};
	

 	this.localMeidaUpload = function(req, res){		 
		var userId = req.user.id;
		var newFileName = req.query.fileName || "name not set";
		var fileNote = req.query.fileNote || '';
		var newFileURL = null;
		var newFileThumb = null;
		var duration = null;
		var dimensions = null;
		var size = null;
 		return new Promise(function(resolve, reject){
 			tvDB.localMeidaUpload(req)
 			.then((media) => {
 			// check if form-data's name field is not
			// empty, if not use it as a name
			newFileThumb = media.thumbFileLocation;
			size = media.size;
			duration = media.duration;
			dimensions = media.dimensions;
 			if (media.name !== "undefined") {
 			  newFileName = media.name.replace(/[^!a-zA-Z0-9-.\p]|\s/g, "_")
 			}
 			   return tvDB.saveVideoUrl(media.fileLocation, userId);
 			})
 			.then((savedUrl) => {
			tvDB.setMediaNameByURL(savedUrl, newFileName, fileNote, size, duration, dimensions)
			.then(function(data, f_url, f_name , f_id){
				console.log(" ");
				console.log(` ====> URL ${data.f_url} with name = ${data.f_name} <==== `);
				console.log(" _____ and thumbnail " + newFileThumb);
				console.log(" ");
				tvDB.saveThumbNailsForURL(data.f_url, newFileThumb)
				.then(() => {
					res.status(200).send({
						 "status":"saved",
						 "url":data.f_url,
						 "thumbnail":newFileThumb,
						 "name":data.f_name,
						 "id":data.f_id
					   });
				})
				.catch((error) => { res.status(500).send({"Error":" Error while saving images. Drats."}) })
			  })
			})
 			.catch((e) => {
 				console.log(" Error while uploading local media file ");
 				console.log(" =>--------- Details --------<= ");
 				console.log(e);
 				console.log(" =>--------------------------<= ");
 				res.status(500).send({"Error":" Error while saving images. Drats. "});
 				resolve();
 			});
 		});
	 };
	
	 this.playVideoFromLocalStorage = function(req, res){
		var userId = req.user.id;
		var GUID = req.body.GUID;
		var URL = req.body.URL;
		console.log(" Attempt to run video from localStorage");
		console.log(`DATA: user = ${userId} guid = ${GUID} URL = ${URL}`);
		console.log(" ");
		tvDB.runVideoFromLocalStorageOnTV(URL, GUID)
		.then((status) => {res.status(200).send("OK")})
		.catch((error) => {res.status(500).send(error)});
	 };

	 this.playImgFromLocalStorage = function(req, res){
	    var userId = req.user.id;
		var GUID = req.body.GUID;
		var URL = req.body.URL;
		console.log(" Attempt to run Img from localStorage ");
		console.log(` DATA: user = ${userId} guid = ${GUID} URL = ${URL} `);
		console.log(" ");
		tvDB.runImgFromLocalStorage(URL, GUID)
		.then((status) => {res.status(200).send("OK")})
		.catch((error) => {res.status(500).send(error)});
	 };

	 this.playPlayListFromLocalStorage = function(req, res){
		console.log(" Attempt to run playList from localstorage");
		console.log(` Body = ${JSON.stringify(req.body)}`);
		console.log(" ");
		var userId = req.user.id;
		var GUID = req.body.GUID;
		var listID = req.body.listID;
		tvDB.runListFromLocalStorage(userId, GUID, listID)
		.then((status) => {res.status(200).send("OK")})
		.catch((error) => {res.status(502).send(error)});
	 };

	this.pullMyGroups = function(req, res){
		console.log(" ");
		var userId = req.user.id;
		console.log(` Attempt to pull all groups for user ${userId}`);
		tvDB.pullMyGroups(userId)
		.then((groups) => {res.status(200).send(groups)})
		.catch((error) => {res.status(502).send(error)})
	};

	this.createGroup = function(req, res){
		console.log(" ");
		var userId = req.user.id;
		console.log(` Attempt to create group for user ${userId}`);
		var data = {};
		data.name = req.body.name.replace(/'/g,"\\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '')
		tvDB.createGroup(userId, data)
		.then((groupId) => {res.status(200).send({"status":"OK","groupId":groupId})})
		.catch((error) => {res.status(502).send(error)})
	};

	this.insertTVIntoGroup = function(req, res){
		console.log(" ");
		var userId = req.user.id;
		console.log(` Attempt to update tv group for user ${userId}`);
		tvDB.insertTVIntoGroup(userId, req.body)
		.then(() => res.status(200).send("OK"))
		.catch((error) => res.status(502).send(error))
	};

	this.removeTVfromGroup = function(req, res){
		console.log(" ");
		var userId = req.user.id;
		console.log(" Removing GUID from group ");
		tvDB.removeTVfromGroup(userId, req.body)
		.then(() => res.status(200).send("OK"))
		.catch((error) => res.status(502).send(error));
	};

	this.addInfoToGroup = function(req, res){

		console.log(" addInfoToGroup ");

		let info = {event: "add event constantly", ...req.body} 
		
		var userId = req.user.id;
		var data = {};
		if (req.body.hasOwnProperty('URL')) data.URL = req.body.URL;
		if (req.body.hasOwnProperty('groupId')) data.groupId = req.body.groupId;
		if (req.body.name) data.name = req.body.name.replace(/'/g,"\\'").replace(/[^\wа-яА-Я' \\!-?,\u400-\u04F0\']|_/g, '');
		if (req.body.hasOwnProperty('playing_fallback')) data.playing_fallback = req.body.playing_fallback;
		if (req.body.hasOwnProperty('playlist_id')) data.playlist_id = req.body.playlist_id;
		console.log(" Attempt to update group description ");

		tvDB.addInfoToGroup(userId, data)
		.then(() => {
			if (info.playing_fallback !== 1) send.log(userId, "Add event", req, res, "OK", 200, info)
			else res.status(200).send("OK")
		})
		.catch((error) => {
			if (info.playing_fallback !== 1) send.error(userId, "Add event", req, res, "OK", 501, info)
			else res.status(400).send(error)
		})
	};

	this.deleteGroup = function(req, res){
		console.log(" ");
		console.log(" Attempt to delete group ");
		var userId = req.user.id;
		tvDB.deleteGroup(userId, req.body)
		.then(() => res.status(200).send("OK"))
		.catch((error) => res.status(502).send(error))
	};

 	this.placeHolder = function(req, res){
 		console.log(req);
		res.send({"Status":"Placeholder function was triggered"});
	 };
	 
	this.pullSchedule = function(req, res){
		console.log(" Pulling schedule ");
		var userId = req.user.id;
		tvDB.pullSchedule(userId)
		.then((schedule) => {res.status(200).send(schedule)})
		.catch((error) => {res.status(501).send({"Status":"Error occured", "error":error})});
	};

	this.saveSchedule = function(req, res){
		console.log(" Attempt to save schedule ");
		
		var schedule = JSON.parse(req.body.schedule);
		console.log(schedule)
		let info
		if(schedule && schedule[0] && schedule[0].playlist_id && schedule[0].tv_guid && schedule[0].tv_guid !== "null"){
		    info = {event: "add event", guid:schedule[0].tv_guid, playlist_id:schedule[0].playlist_id} 
		}
		else if(schedule && schedule[0] && schedule[0].URL && schedule[0].tv_guid && schedule[0].tv_guid !== "null"){
			info = {event: "add event", guid:schedule[0].tv_guid, URL:schedule[0].URL} 
		}
		else if(schedule && schedule[0] && schedule[0].playlist_id && schedule[0].group_id && schedule[0].group_id !== "null"){
			info = {event: "add event", group_id:schedule[0].group_id, playlist_id:schedule[0].playlist_id} 
		}
		else if(schedule && schedule[0] && schedule[0].URL && schedule[0].group_id && schedule[0].group_id !== "null"){
			info = {event: "add event", group_id:schedule[0].group_id, URL:schedule[0].URL} 
		}
		var userId = req.user.id;
		tvDB.saveSchedule(userId, req.body)
		.then(() => {
			message = {"Status":"Schedule was saved"}
			send.log(userId, "Add event", req, res, message, 200, info)
			// res.status(200).send({"Status":"Schedule was saved"});
		})
		.catch((error) => {
			message = {"Status":"Error occured", "error":error}
			send.error(userId, "Add event", req, res, message, 501, info)
			// res.status(501).send({"Status":"Error occured", "error":error})
		});
	};

	this.updateEvent = function(req, res){
		let media, device;
		console.log(" Update schedule event ");
		console.log(req.body);
		var userId = req.user.id;
		let info = {event: "update event", ...req.body} 

		tvDB.updateEvent(userId, req.body)
		.then(() => {
			message = {"Status":" Event  was updated "}
			send.log(userId, "Update event", req, res, message, 200, info)
			//res.status(200).send({"Status":" Event  was updated "});
		})
		.catch((error) => {
			message = {"Status":"Error occured", "error":error}
			send.error(userId, "Update event", req, res, message, 501, info)
			//res.status(501).send({"Status":"Error occured", "error":error})
		});		
	}

	this.deleteEvent = function(req, res){
		
		var eventIDs = req.body.schedule;
		var GUIDsForRefresh = [];
		var groupsToRefresh = [];
		var GROUPS = [];
		let media, device;
		console.log(" Attempt to delete schedule event ");
		let schedule = JSON.parse(eventIDs)
		console.log(schedule);
		var userId = req.user.id;

		let info = {event: "delete event", media, device} 
		// tvDB.deleteScheduleEvent(userId, req.body)
		// .then(() => { res.status(200).send({"Status":"Events were deleted"}) })
		// .catch((error) => { res.status(501).send({"Status":"Error occured", "error":error}) });

		// CHECK EVENT EDITION FUNCTIONALITY
		// THEN DELETE COMMENTED PART

		// Media or playlist name 
		// Device or Groupe

		DB.query(`
			SELECT * FROM schedule
			WHERE ID = :id`, {id: schedule[0].id}, "schedule")
		.then((result) => {
			info.media = result
			return DB.query(`
				SELECT tv_guid, group_id FROM schedule
				WHERE ID = :id`, {id: schedule[0].id}, "schedule")
		})
		.then((result) => {
			if(result[0].tv_guid && result[0].tv_guid !== "null"){
				return DB.query(`
				SELECT tv_name FROM tv_data
				WHERE guid = :guid`, {guid: result[0].tv_guid}, "guid")
			}
			if(result[0].group_id && result[0].group_id !== "null"){
				return DB.query(`
				SELECT name FROM groups_desc
				WHERE group_id = :group_id`, {group_id: result[0].group_id}, "groups_desc")
			}
		})
		.then((result) => {
			info.device = result
			return helpers.getGUIDsRelatedWithEvent(eventIDs)
		})
		.then((GUIDs) => { 
			// SAVE GUIDs to emit refresh later

			GUIDs.forEach((el, i, array) => { if(el.tv_guid && el.tv_guid != "null"){
			GUIDsForRefresh.push(el.tv_guid);
			array.splice(i, 1);
			} else if( el.group_id && el.group_id != "null" ){
				groupsToRefresh.push(el.group_id);
				array.splice(i, 1);
			}}) 
		    return { GUIDsForRefresh,  groupsToRefresh };
		})
		.then((data) => {
			GROUPS = data.groupsToRefresh;
			var GUIDsForRefresh = data.GUIDsForRefresh;
			var queue = [];
			return new Promise((resolve, reject) => {
				// IF EVENT IS LAST FOR GROUP SET GROUP PROPERTY "ON_SCHEDULE TO 0; 
				
				if(GROUPS.length == 0){ resolve(GUIDsForRefresh) }
				else {
					GROUPS.forEach((el) => { queue.push(tvDB.pullAllGUIDFromGroup(el)); })
					Promise.all(queue).then((values) => {
						values = values.reduce((a,b) => a.concat(b)).map((el) => el.GUID);
						resolve(GUIDsForRefresh.concat(values));
					})
				}
			})
		})
		.then((GUIDsToRefresh) => { 
			return new Promise((resolve, reject) => {
        tvDB.deleteScheduleEvent(userId, req.body)
        .then(() => {
          Promise.all( GROUPS.map((el) => { return tvDB.nullScheduleForGroupIfLastEventDeleted(el) }) )
          .then(() => {
						tvDB.emitRefreshToGivenGUIDs(GUIDsToRefresh);
						resolve();
					})
				})
			})
		 })
		.then(() => {
			console.log('EMPTY')
			;
			message = {"Status":"Events were deleted"}
		    send.log(userId, "Delete event", req, res, message, 200, info)
			// res.status(200).send({"Status":"Events were deleted"}) 
		})
		.catch((error) => { 
			console.log('ERR 88880, err', error)
			message = {"Status":"Error occured", "error":error}
			send.error(userId, "Delete event", req, res, message, 501, info)
			//res.status(501).send({"Status":"Error occured", "error":error})
		 });
	}

	this.validateSchedule = function(req, res, next){
		var schedule = JSON.parse(req.body.schedule);
		var valid = true;
		let info = {event: "add event"} 
		Object.keys(schedule).forEach((el, i, a) => {
			el = schedule[el];
			if(el.tv_guid != "null" && el.group_id != "null"){
				
				message = {
					"Status":"Event has both group_id and tv_guid. Not cool.",
					"Details":el,
					"Note":'if group_id or tv_guid is null, server waits for {"group_id":"null"}'}

				send.error(req.user.id, "Add event", req, res, message, 400, info)

				// res.status(400).send({
				// 	"Status":"Event has both group_id and tv_guid. Not cool.",
				// 	"Details":el,
				// 	"Note":'if group_id or tv_guid is null, server waits for {"group_id":"null"}'});

				valid = false;
			};
			var index = i;
			var startTimeToCheck = new Date(el.start);
			var endTimeToCheck = new Date(el.end);
			a.forEach((elem, index, array) => {
				elem = a[elem];
				if(index != i && elem.tv_guid == el.tv_guid){
					var startTime = new Date(elem.start);
					var endTime = new Date(elem.end);

					message = {"Status":"You got overlaps in schedule man. Not cool.","Details":[
						el, elem
					]}
					
					if(startTimeToCheck >= startTime && startTimeToCheck <= endTime){
						send.error(req.user.id, "Add event", req, res, message, 400, info)
						// res.status(400).send({"Status":"You got overlaps in schedule man. Not cool.","Details":[
						// 	el, elem
						// ]});
						valid = false;
					};
					if(endTimeToCheck >= startTime && endTimeToCheck <= endTime){
						send.error(req.user.id, "Add event", req, res, message, 400, info)
						// res.status(400).send({"Status":"You got overlaps in schedule man. Not cool.","Details":[
						// 	el, elem
						// ]});
						valid = false;
					};
				};
			});
		});
		if(valid){next()};
	};

	this.saveUserTimeZone = function(req, res){
		var userId = req.user.id;
		return new Promise((resolve, reject) => {
			tvDB.saveUserTimeZone(req.body, userId)
			.then(() => {res.status(200).send({"Status":"User timezone was saved"});resolve()})
			.catch((error) => {res.status(500).send({"Status":"Error occured"});resolve()});
		});
	};

	this.pullUserTimeZone = function(req, res){
		var userId = req.user.id;
		return new Promise((resolve, reject) => {
			tvDB.pullUserTimeZone(userId)
			.then((data) => {res.status(200).send({"timezone":data}); resolve();})
			.catch((error) => {res.status(500).send({"timezone":null, "error":"Error occured"}); resolve()});
		})
	};

	this.lol = function(req, res) {
		//tvDB.runListFromLocalStorage(1000, 'ssss', 1107)	
		//tvDB.runScheduleOnTV('4f759c14-b961-b64b-f015-323c81f35016', '4f759c14-b961-b64b-f015-323c81f35016')
		tvDB.determinePlaylistsOverlay(1117)
			.then(data => {
				console.log('OK')
				res.send(data)
			})
			.catch(e => {
				console.log('ERR')
				res.send(e)
			})
	}

	this.testUrl = function(req, res) {
		request({
            url: req.body.url,
            method: 'GET',
            encoding: 'binary'
		}, (err, response) => {
			if (err) {
				res.send({
					canBeShown: false
				});
			} else {
				res.send({
					canBeShown: (response && response.headers) ? !response.headers['x-frame-options'] : false
				})
			}
		})
	}

 }

 module.exports = tvServices;
