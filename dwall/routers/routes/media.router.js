var express = require('express');
var router = express.Router();
var mediaService = require('../../services/media.service.js');

router.post("/rss", mediaService.addRSSfeed);
router.delete("/rss/:id", mediaService.removeRSSfeed);
router.put("/rss", mediaService.updateRSSfeed);

router.put("/rssInterval", mediaService.updateRSSInterval);

router.post("/page", mediaService.addUrlMedia);
router.get("/page/:id", mediaService.getUrlMedia);
router.patch("/page/:id", mediaService.updateUrlMedia);
router.delete("/page/:id", mediaService.deleteUrlMedia);

router.post("/overlay", mediaService.addHTMLOverlay);
router.delete("/overlay/:id", mediaService.deleteHTMLOverlay);

router.post("/stream", mediaService.addStream);
router.delete("/stream/:id", mediaService.deleteStream);

module.exports = router;

