const pool = require("../models/connection")
const sendMessage = require('./sendMessage');  

module.exports = async (req, res) => {
    try{
        const db = await pool.connect()
        await db.query('INSERT INTO items(name) VALUES ($1)', [req.body.title])
        await db.release()
        sendMessage(req.io)
        return res.status(201).json({Message:"Added"});
    }catch(err) {
        console.error('Unable to connect to the database:', err);
        return res.status(500).json({error: 500});
    };
}


