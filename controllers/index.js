//сводим контроллеры
const addCtrl = require("./addCtrl")
const getCtrl = require("./getCtrl")
const updateCtrl = require("./updateCtrl")
const deleteCtrl = require("./deleteCtrl")
const installCtrl = require("./installCtrl")

module.exports = {
    getCtrl, addCtrl, updateCtrl, deleteCtrl, installCtrl
}
