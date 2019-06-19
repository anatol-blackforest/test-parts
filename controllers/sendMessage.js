const pool = require("../models/connection")
//сокеты мгновенно рассылают изменения всем клиентам
module.exports = async (io) => {
    try{
        const db = await pool.connect()
        const data = await db.query('SELECT * FROM items ORDER BY id DESC')
        io.sockets.emit('message', data.rows);
    }catch(err) {
        console.error('Unable to connect to the database:', err);
        return res.status(500).json({error: 500});
    };
}
