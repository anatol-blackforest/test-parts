const pool = require("../models/connection")
const sendMessage = require('./sendMessage');  
//редактируем покупку и сообщаем всем
module.exports = async (req, res) => {
    try{
        const db = await pool.connect()
        await db.query('UPDATE items SET name = $1 WHERE id = $2', [req.body.title, req.params.id])
        db.release()
        sendMessage(req.io)
        return res.status(200).json({Message:"Updated!"});
    }catch(err) {
        console.error('Unable to connect to the database:', err);
        return res.status(500).json({error: 500});
    };
}
