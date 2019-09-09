var express = require('express');
var router = express.Router();
var settingService = require('../../services/settings.service');

router.post("/:guid", settingService.createSetting);
//router.get("/:guid", settingService.getAllSettings);
router.get("/:guid", settingService.getSettingById);
router.patch("/:guid", settingService.updateSetting);
router.delete("/:guid", settingService.removeSetting);

module.exports = router;