const pool = require("../models/connection")

function installCtrl() {
    this.get = async (req, res) => {
        res.status(200).render("install");
    }
    this.post = async (req, res) => {
        try{
            const db = await pool.connect()
            await db.query('CREATE TABLE IF NOT EXISTS items(id serial PRIMARY KEY, name VARCHAR (256) UNIQUE NOT NULL)')
            db.release()
            return res.status(201).render("install", {Message:"Created!"});
        }catch(err) {
            console.error('Unable to connect to the database:', err);
            return res.status(500).json({error: 500});
        };
    }
}

module.exports = new installCtrl()
