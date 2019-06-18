const {Pool} = require('pg')

module.exports = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'travelshop',
    password: '',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
})

// module.exports = new Pool({
//     user: process.env.USER || 'postgres',
//     host: process.env.HOST || 'localhost',
//     database: process.env.DB || 'travelshop',
//     password: process.env.PWD || '',
//     port: process.env.PORT || 5432,
//     max: 20,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 2000
// })
