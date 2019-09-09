const DB = require("../modules/sql.js");

function fallbackController() {

  this.createFallback = function(params) {
    return Promise.resolve()
    .then(() => {
      return DB.query('START TRANSACTION');
    })
    .then(() => {
      return DB.query(`INSERT INTO fallback
                      SET guid = :guid,
                      url = 'http://dwall.online/views/video/Wallpaper1.png'`, params, params.guid);
    })
    .then((result) => {
      return DB.query('COMMIT');
    })
    .catch(err => {
      return DB.rollback(() => {
        return err;
      });
    });
  }
}

module.exports = new fallbackController();
