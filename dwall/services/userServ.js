// import { error } from "util";

// import { resolve } from "dns";
// const dns = require('dns');

const S3BucketServise = require("./uploader.service.js");
const S3BucketController = require('../controllers/uploader.controller.js');

let uControllerFunction = require("../controllers/user.js");
let mediaControllerFunction = require("../controllers/media.js");
let tv = require("../modules/tv.js");
let uController = new uControllerFunction();
let mController = new mediaControllerFunction();
let lController = require("../controllers/licenses.controller.js");
let tvFunctions = new tv();

function userServices(){
    var _uServices = this;

    this.createNewUser = async function(req, res){
        const newUserData = {
            email: req.body.email,
            pass: req.body.pass
        }
        if(!newUserData.pass){ 
            res.status(400).send({message: "Password is required"});
            return;
        }
        if(!newUserData.email){ 
            res.status(400).send(" Email is required ");
            return; 
        }
        userExists = await uController.getUserIdByEmail(newUserData.email)
        if(userExists){ 
            res.status(400).send(" Email already in use. ");
        } else {
            return uController.insertNewUser(newUserData)
            .then((userId) => {
                return lController.createLicense({
                    userId,
                    singlecast: 10, 
                    multicast: JSON.stringify([])
                });
            })
            .then(() => {
                res.status(200).send(" New user was added ");
                return;
            })
            .catch((error) => {
                res.status(500).send(error);
            });
        }
    };

    this.updateUser = function(req, res){
        var userDataToUpdate = {};
        if (req.body.hasOwnProperty('address')) userDataToUpdate.address = req.body.address;
        if (req.body.hasOwnProperty('city')) userDataToUpdate.city = req.body.city;
        if (req.body.hasOwnProperty('company')) userDataToUpdate.company = req.body.company;
        if (req.body.hasOwnProperty('country')) userDataToUpdate.country = req.body.country;
        if (req.body.hasOwnProperty('first_name')) userDataToUpdate.first_name = req.body.first_name;
        if (req.body.hasOwnProperty('postal_code')) userDataToUpdate.postal_code = req.body.postal_code;
        if (req.body.hasOwnProperty('state')) userDataToUpdate.state = req.body.state;
        if (req.body.hasOwnProperty('billing_address')) userDataToUpdate.billing_address = req.body.billing_address;
        if (req.body.hasOwnProperty('billing_city')) userDataToUpdate.billing_city = req.body.billing_city;
        if (req.body.hasOwnProperty('billing_country')) userDataToUpdate.billing_country = req.body.billing_country;
        if (req.body.hasOwnProperty('billing_name')) userDataToUpdate.billing_name = req.body.billing_name;
        if (req.body.hasOwnProperty('billing_postal_code')) userDataToUpdate.billing_postal_code = req.body.billing_postal_code;
        if (req.body.hasOwnProperty('billing_state')) userDataToUpdate.billing_state = req.body.billing_state;
        
        var userId = req.user.id;
            if(userDataToUpdate.pass){ 
                res.status(400).send(" You can't update password with this endpoint. Use /user/updatePass "); 
                return; 
            } else if(userDataToUpdate.fallback_media){ 
                res.status(400).send(" You can't update fallback_media with this endpoint. Use /user/setFallback "); 
                return; 
            } else {
                return uController.updateUser(userId, userDataToUpdate)
                .then(() => { res.status(200).send(" Updated ") })
                .catch((error) => { 
                    if(error.code == "ER_BAD_FIELD_ERROR"){
                        res.status(400).send(" Unknown parameter was recieved. Here is list of available parameters. [first_name, address, company, country, state, postal_code, biling_name, billing_address, city, billing_country, state_region, billing_postal_code]. Have fun.");
                    } else {
                        res.status(500).send(error) 
                    }
                })
            }
    };

    this.updatePassword = async function(req, res){
        var userId = req.user.id;
        var oldPass = req.body.oldPass;
        var newPass = req.body.newPass;
        var confirm = req.body.confirm;
        info = {event: "passchange"}
        if(!oldPass){ 
            send.error(userId, "Password Change", req, res, " Old password wasn't send. Property name is oldPass. ", 400, info)
            // res.status(400).send(" Old password wasn't send. Property name is oldPass. "); 
          }
        else if(!newPass){ 
            send.error(userId, "Password Change", req, res," New password wasn't send. Property name is newPass. ", 400, info)
            // res.status(400).send(" New password wasn't send. Property name is newPass. "); 
          }
        else {
          let status = await uController.validatePassById(userId, oldPass);
          if (!status) {
              send.error(userId, "Password Change", req, res," Wrong current password ", 400, info)
              // res.status(400).send(" Wrong current password ");
              return;
          }
          if (oldPass == newPass) {
              send.error(userId, "Password Change", req, res," New pass can't be the same as old one ", 400, info)
              // res.status(400).send(" New pass can't be the same as old one ");
              return;
          }
          if (newPass !== confirm) {
              send.error(userId, "Password Change", req, res," New pass isn't equal to confirm pass ", 400, info)
              //res.status(400).send(" New pass isn't equal to confirm pass ");
              return;
          }
          return uController.setPassById(userId, newPass)
          .then(() => {
              send.log(userId, "Password Change", req, res," Password was updated ", 200, info)
              // res.status(200).send(" Password was updated ");
              return;
          })
          .catch((error) => { 
              send.error(userId, "Password Change", req, res,error, 500, info)
              // res.status(500).send(error)
           });
        }        
      };
  

    this.setFallback = function(req, res){
        var userId = req.user.id;
        var mediaId = req.body.mediaId;
        return uController.setFallback(userId, mediaId)
       .then(() => {
           return _uServices.clearFallBackOnAllTV(userId)
        })
        .then(() => {
            res.status(200).send(" Fallback media for user was set to " + mediaId);
       })
       .catch((error) => {
           res.status(400).send(error);
       });
    };

    this.clearFallBackOnAllTV = (userId) => {
        return uController.getUserGUIDS(userId)
        .then((GUIDs) => {
            GUIDs.forEach((el) => {
                const connectionStore = require("../app.js");
                connectionStore.clearFallback(el.guid);
            });
            return;
        });
    };

    this.getMyFallback = function(req, res){
        var userId = req.user.id;
        return uController.getFallbackByUserId(userId)
        .then((media) => {
            res.status(200).send(media);
            return;
        })
        .catch((error) => {
            res.status(500).send(error);
        });
    };

    this.getLicence = function(req, res){
        var userId = req.user.id;
        return uController.getLicence(userId)
        .then((licence) => {
            res.status(200).send(licence);
        })
        .catch((error) => {
            res.status(500).send(error)
        });     
    };

    this.getAllUsersData = function(req, res) {
        var userId = req.user.id;
        return uController.getAllUsersData(userId)
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((error) => {
            res.status(500).send(error);
        });
    };

    this.uploadMediaToS3 = function(req, res){
        // var userId = req.session.passport.user;
        req.setTimeout(0);
        var userId = req.user.id

        var note = req.query.fileNote || "";
        var metadata = {};
        if(!req.headers["content-length"]){ res.status(400).send(" content-length header expected "); return; }

        S3BucketServise.checkUserUploadPermit(req, res, userId)
            .then((data) => { 
                // upload file in temporary directory
                return S3BucketServise.uploader(data)
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

    this.uploadMediaFromUserPC = function(req, res){
        req.setTimeout(0);
        var userId = req.user.id;
        var note = req.query.fileNote|| "";
        var metadata = {};
        if(!req.headers["content-length"]){ res.status(400).send(" content-length header expected "); return; }
        return new Promise((resolve, reject) => {
            mController.checkUserUploadPermit(req, userId)
            .then((data) => { 
                return new Promise((resolve, reject) => {
                    if(!data.status){ res.status(507).send(" User exceeded file storage limit "); reject(); }
                    else { resolve(data); }
                })
            })
            .then((data) => {
                return mController.uploadFileFromUserPC(req, userId, process.env.fileStorage); })
            .then((fileData) => {
                fileData["userId"] = userId;
                fileData["note"] = note;
                return mController.reduceUserFreeStorage(userId, fileData.size, fileData);})
            .then((fileData) => {
                if(fileData.video){
                    return mController.createThumbForVideo(fileData.filePath, fileData.name, fileData.generatedID, fileData.thumbFileName, fileData.size, fileData );
                }
                if(fileData.image){
                    return mController.createThumbForImage(fileData.filePath, fileData.thumbFileName, fileData);
                }
            })
            .then((fileData) => {
                metadata.size = fileData.size;
                metadata.dimensions = fileData.dimensions;
                metadata.duration = fileData.image ? 0 : fileData.duration;
                // SAVE URL INTO DB
                if(fileData.host){
                    return mController.saveMediaUrl(fileData.host + fileData.filePath, fileData.userId, fileData)
                } else {
                    return mController.saveMediaUrl(fileData.fileData.host + fileData.fileData.filePath, fileData.fileData.userId, fileData.fileData)
                }
            })
            .then((fileData) => {
                // SAVE THUMB 
                if (fileData.video) {
                  fileData.thumbFileName = fileData.thumbFileName.slice(0, fileData.thumbFileName.lastIndexOf('.')).concat('.jpg');  
                }
                return mController.saveThumbNailsForURL(fileData.host + fileData.filePath, fileData.host + fileData.thumbFileName, fileData)
            })
            .then((fileData) => {
                // PULL MEDIA ID BY URL 
                return new Promise((resolve, reject) => {
                    mController.getMediaIdByURL(fileData.host + fileData.filePath)
                    .then((mediaId) => {
                        fileData["mediaId"] = mediaId;
                        mController.updateMediaMetadata(mediaId, metadata.size, metadata.duration, metadata.dimensions)
                            .then(data => {
                                metadata = null;
                                resolve(fileData);
                            })
                            .catch(err => {
                                reject(err);
                            })
                    })
                    .catch((error) => { reject(error); })
                });
            })
            .then((fileData) => {
                console.log(fileData)
                // SEND PARAMETERS IN RESPONSE
                tvFunctions.updateMediaRecords(fileData.mediaId, fileData.name, fileData.note)
                .then(() => {
                    res.status(200).send({
                        "status":(fileData.host + fileData.filePath == fileData.host + fileData.thumbFileName) ? "Saved, error while saving thumbnail" : " Saved ",
                        "url":fileData.host + fileData.filePath,
                        "thumbnail":fileData.host + fileData.thumbFileName,
                        "name":fileData.name,
                        "id":fileData.mediaId,
                        "note":fileData.note
                      });
                })
            })
            .catch((error) => { 
                res.status(500).send(" Error. " + error); });
        });
    };

}



module.exports = userServices;