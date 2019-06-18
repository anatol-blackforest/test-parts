const pool = require("../models/connection")

module.exports = async (io) => {
    try{
        const db = await pool.connect()
        const data = await db.query('SELECT * FROM items')
        io.sockets.emit('message', data.rows);
        console.log(data.rows)
    }catch(err) {
        console.error('Unable to connect to the database:', err);
        return res.status(500).json({error: 500});
    };
}
