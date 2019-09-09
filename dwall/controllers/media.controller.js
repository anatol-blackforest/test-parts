const DB = require("../modules/sql.js");

function mediaController() {
  this.createMedia = function() {
    //TO DO
  }

  this.getMediaById = function(params, mask) {
    return DB.query("SELECT * FROM video AS v WHERE v.id = :id ", params, 'video')
  }

  this.updateMedia = function(params, mask) {
    return DB.query('START TRANSACTION')
    .then(() => {
      const query = DB.prepareQuery(`UPDATE ${params.table}`, params);
      const variables = Object.assign({}, params.set, params.where);
      return DB.query(query, variables, params.table);
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

  this.deleteMedia = function(params) {
    return DB.query('START TRANSACTION')
    .then(() => {
      return DB.query("DELETE FROM video WHERE id= :id AND user_id= :userId", params, 'video');
    })
    .then(res => {
        return DB.query('COMMIT');
    })
    .catch(err => {
        return DB.rollback(() => {
            return err;
        });
    }); 
  }

  this.getFallBackByGUID = function(params) {
    return DB.query(`
      SELECT user_id FROM tv
      WHERE guid = :guid`, params, params.guid)
    .then((data) => {
      if(data[0]){
        return DB.query(`
            SELECT fallback_media, video.url FROM users
            JOIN video
            ON video.id = users.fallback_media
            WHERE users.id = :id`, {id: data[0].user_id}, 'users');
      } else {
        return DB.query(`
          SELECT url FROM fallback
          WHERE guid = :guid`, params, params.guid);
      }
    })
    .then(data => {
      if (data.length) {
        return {
          url: data[0].url
        }
      } else {
        return {};
      }
    })
    .catch(err => console.log('[Error]', err));
  }
}

module.exports = new mediaController();