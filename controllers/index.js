//сводим модели
const addCtrl = require("./add")
const getCtrl = require("./get")
const updateCtrl = require("./update")
const deleteCtrl = require("./deleteCtrl")
const installCtrl = require("./installCtrl")

module.exports = {
    getCtrl, addCtrl, updateCtrl, deleteCtrl, installCtrl
}
