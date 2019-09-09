const DB = require("../modules/sql.js");

function playlistsController() {
  this.createPlaylist = function() {
    //TO DO
  }

  this.getPlaylistById = function(params, mask) {
    return DB.query(`SELECT pl.user_id, pl.list_name,  pl.stripe_id, pl.stripe_color,  pl.stripe_background, pl.rss_update_interval, pl.overlay_id, plv.playlist_id, plv.v_order, plv.duration, v.id, v.url, v.web_page, v.stream
    FROM playlists AS  pl 
    JOIN playlists_video AS plv ON plv.playlist_id = pl.id 
    JOIN video AS v ON plv.url = v.url OR plv.url = v.web_page OR plv.url = v.stream 
    WHERE pl.id = :id ORDER BY plv.v_order ASC;`, params, mask)
  }

  this.updatePlaylist = function(id, params, mask) {
    //TO DO
  }

  this.deletePlaylist = function(id) {
    //TO DO
  }

  this.playlistHasRss = function(params, mask) {
    return DB.query(`
            SELECT rss, url , playlists.* FROM playlists
            JOIN video
            ON playlists.stripe_id = video.id
            WHERE playlists.id = :id `, params, mask)
    .then((data) => {
      return data[0] ? data[0] : {};
    })
    .catch((error) => {
        console.log('[Error]', error);
    });
  }
}

module.exports = new playlistsController();