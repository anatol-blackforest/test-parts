//модель приложения
const mongoose = require('mongoose');
mongoose.Promise = Promise;

// Схема планеты
const CommentSchema = new mongoose.Schema({
    product_name: String,
    author: String,
    comment: String
});

module.exports = mongoose.model('Comment', CommentSchema);
