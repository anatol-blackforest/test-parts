//сводим модели
const addCtrl = require("./add")
const getCtrl = require("./get")
const updateCtrl = require("./update")
const deleteCtrl = require("./deleteCtrl")

module.exports = {
    getCtrl, addCtrl, updateCtrl, deleteCtrl
}
