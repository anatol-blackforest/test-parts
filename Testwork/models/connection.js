//Подключение к базе данных
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const {mongoUrl} = require('../config');

let connection;

module.exports = async (req, next) => {
    try{
        if (!connection) connection = await mongoose.connect(mongoUrl);
        next()
    }catch(err){
        console.log(err)
    }
}
