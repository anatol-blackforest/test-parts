const {Pool} = require('pg')

module.exports = new Pool({
    user: process.env.DBUSER || 'postgres',
    host: process.env.DBHOST || 'localhost',
    database: process.env.DBNAME || 'travelshop',
    password: process.env.DBPWD || '',
    port: process.env.DBPORT || 5432,
    max: 20
})
