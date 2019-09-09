
const mControllerFunction = require("../controllers/media.js");
const mController = new mControllerFunction();

function mediaService(){

    this.addRSSfeed = function(req, res, next){
        // userId, RSSURL, mediaName, note
        var userId = req.user.id;
        var data = req.body;
        return new Promise((resolve, reject) => {
            mController.saveRSSfeed(userId, data.url, data.mediaName, data.note, data.rssRefreshInterval)
            .then(() => {
                res.status(200).send(" RSS was saved. ");
                resolve();
            })
            .catch((error) => {
                res.status(500).send(error);
                reject();
            })
        })
    };

    this.removeRSSfeed = function(req, res, next) {
        var id = req.params.id;
        
        mController.removeRSSfeed(id)
        .then(() => {
            res.status(200).send(" RSS was removed");
        })
        .catch((error) => {
            res.status(500).send(error);
        })
       
    }

    this.updateRSSfeed = function(req, res, next) {
        let rss = req.body;
        console.log(req.body)
        new Promise((resolve, reject) => {
            mController.updateRSSfeed(rss.id, rss.url, rss.name, rss.note)
                .then(() => {
                    res.status(200).send(' RSS was updated ');
                })
                .catch(err => {
                    res.status(500).send(err.message);
                })
        })
    }

    this.updateRSSInterval = function(req, res, next) {
        let rss = req.body;
        new Promise((resolve, reject) => {
            mController.updateRSSInterval(rss.id, rss.interval)
                .then(() => {
                    res.status(200).send('RSS interval was updated');
                })
                .catch(err => {
                    res.status(500).send(err.message);
                })
        })
    }

    this.addUrlMedia = function(req, res, next) {
        const payload = {
            user: req.user.id,
            url: req.body.url,
            mediaName: req.body.mediaName,
            note: req.body.note,
            //duration: req.body.duration || 10
        }
        new Promise((resolve, reject) => {
            resolve(mController.addUrlMedia(payload))
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.updateUrlMedia = function(req, res, next) {
        const set = {};
        //if (req.body.hasOwnProperty('url')) set.url = req.body.url;
        if (req.body.hasOwnProperty('mediaName')) set.media_name = req.body.mediaName;
        if (req.body.hasOwnProperty('note')) set.note = req.body.note;
        if (req.body.hasOwnProperty('duration')) set.duration = req.body.duration;
        const where = {
            id: req.params.id,
            user_id: req.user.id
        }
        const payload = {
            table: 'video',
            set,
            where
        }
        new Promise((resolve, reject) => {
            resolve(mController.updateUrlMedia(payload))
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.getUrlMedia = function(req, res, next) {
        new Promise((resolve, reject) => {
            resolve(mController.getUrlMediaById({id: req.params.id, userId: req.user.id}))
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.deleteUrlMedia = function(req, res, next) {
        new Promise((resolve, reject) => {
            resolve(mController.deleteUrlMedia({id: req.params.id, userId: req.user.id}))
        })
        .then((data) => {
            debugger;
            res.status(200).send(data);
        })
        .catch(err => {
            debugger;
            res.status(400).send(err);
        });
    }

    this.addHTMLOverlay = function(req, res, next) {
        const payload = {
            userId: req.user.id,
            html: req.body.html,
            mediaName: req.body.mediaName,
            note: req.body.note,
            size: Buffer.byteLength(req.body.html, 'utf8')
        }
        new Promise((resolve, reject) => {
            resolve(mController.addOverlay(payload));
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.deleteHTMLOverlay = function(req, res, next) {
        new Promise((resolve, reject) => {
            resolve(mController.deleteHTMLOverlay({
                id: req.params.id,
                userId: req.user.id
            }))
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.addStream = function(req, res, next) {
        mController.addStream({
                userId: req.user.id,
                mediaName: req.body.mediaName,
                note: req.body.note,
                stream: req.body.stream
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.getStream = function(req, res, next) {
        new Promise((resolve, reject) => {
            resolve(mController.getStream({
                id: req.params.id,
                userId: req.user.id
            }))
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

    this.updateStream = function(req, res, next) {
        //TO DO
    }

    this.deleteStream = function(req, res, next) {
        new Promise((resolve, reject) => {
            resolve(mController.deleteStream({
                id: req.params.id,
                userId: req.user.id
            }))
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    }

};

module.exports = new mediaService()
