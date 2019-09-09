var express = require('express');
var router = express.Router();
var tvServ = require('../../services/devices.service');

router.post("/", tvServ.createDevice);
router.get("/", tvServ.getAllDevices);
router.post("/mute/:guid", tvServ.muteDevice);
router.post("/unmute/:guid", tvServ.unmuteDevice);
router.post("/preview/:guid", tvServ.previewDevice);
router.post("/restart/:guid", tvServ.restartDevice);
router.get("/:guid", tvServ.getDeviceByGuid);
router.patch("/:guid", tvServ.updateDevice);
router.delete("/:guid", tvServ.removeDevice);

module.exports = router;