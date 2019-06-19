const pool = require("../models/connection")
//первичная подгрузка списка
module.exports = async (req, res) => {
    try{
        const db = await pool.connect()
        const data = await db.query('SELECT * FROM items ORDER BY id DESC')
        db.release()
        return res.status(200).render('index', {items: data.rows})
    }catch(err) {
        console.error('Unable to connect to the database:', err);
        return res.status(500).json({error: 500});
    };
}
