const {Pool} = require('pg')
//Пул соединения с постгрес
module.exports = new Pool({
    user: process.env.DBUSER || 'postgres',
    host: process.env.DBHOST || 'localhost',
    database: process.env.DBNAME || 'travelshop',
    password: process.env.DBPWD || '',
    port: process.env.DBPORT || 5432,
    max: 20
})
