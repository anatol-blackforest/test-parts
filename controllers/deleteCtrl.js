const pool = require("../models/connection")
const sendMessage = require('./sendMessage');  

module.exports = async (req, res) => {
    try{
        const db = await pool.connect()
        await db.query('DELETE FROM items WHERE id = $1', [req.params.id])
        db.release()
        sendMessage(req.io)
        return res.status(200).json({Message:"Deleted!"});
    }catch(err) {
        console.error('Unable to connect to the database:', err);
        return res.status(500).json({error: 500});
    };
}
