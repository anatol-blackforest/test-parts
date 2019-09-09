const DB = require("./sql.js");

const helpers = function(){
    helper = this;
    this.deleteMediaFromRelatedTables = function(media_id, user_id){
        if(media_id){
            return DB.query(`
            SELECT distinct 
             video.URL URL, 
             video.id ID,
             playlists.stripe_id PL_STRIPE_ID,
             stripes.text_data s_text,
             playlists_video.url PL_URL,
             schedule.URL SC_URL,
             groups_desc.url GR_URL
            FROM video
            LEFT join playlists
            ON playlists.stripe_id = video.id
            LEFT join stripes
            ON video.stripe_id = stripes.id
            LEFT join playlists_video
            ON video.URL = playlists_video.url
            LEFT JOIN schedule
            ON schedule.URL = video.URL
            LEFT JOIN groups_desc
            ON video.URL = groups_desc.url
            WHERE video.id IN (:id)
            AND video.user_id = userId`, {userId: user_id, id: media_id}, 'video')
            .then((data) => {
                if(data[0]){
                    data = data[0];
                    let promises = [];

                    promises.push(DB.query(`
                    UPDATE playlists
                    SET stripe_id = NULL
                    WHERE playlists.stripe_id = :id`, {id: data.STRIPE_ID || null}, 'playlists'));

                    promises.push(DB.query(`
                    DELETE FROM playlists_video
                    WHERE url = :url`, {url: data.URL}, 'playlists_video'));

                    promises.push(DB.query(`
                    DELETE FROM schedule
                    WHERE url = :url`, {url: data.URL}, 'schedule'));

                    promises.push(DB.query(`
                    DELETE FROM groups_desc
                    WHERE url = :url`, {url: data.URL}, 'groups_desc'));

                    promises.push(DB.query(`
                    DELETE FROM video
                    WHERE video.id = :id`, {id: data.ID || null}, 'video'));

                    promises.push(DB.query(`
                    DELETE FROM stripes
                    WHERE stripes.id = :id`, {id: data.STRIPE_ID || null}, 'stripes'));
                    return Promise.all(promises);
                } else {
                    return;
                }
            })
            .catch(err => {
                return err;
            })
        } else {
            throw " deleteMediaFromRelatedTables requires media_id ";
        }
    }

    this.determineExtensionByURL = function(URL){
        if(URL){
            return URL.split(".")[URL.split(".").length - 1] ? URL.split(".")[URL.split(".").length - 1].toLowerCase() :undefined;
        } else {
            return undefined;
        }
    };
    this.pullTextForStripe = function(stripeIds, objectToPass){
        if(!Array.isArray(stripeIds)){
            stripeIds = [stripeIds];
        }
        stripeIds = stripeIds.map((el) => {
            return `'${el}'`;
        })
        var queryForTextStripes = stripeIds.join(",");
        return DB.query(`
        SELECT stripes.text_data, video.id, playlists.id list_id
        FROM video 
        JOIN stripes 
        ON video.stripe_id = stripes.id
        LEFT join playlists
        ON playlists.stripe_id = video.id
        WHERE playlists.id is not null
        AND video.id IN (:ids)`, {ids: queryForTextStripes}, 'video')
        .then((rows) => {
            return {stripeData:rows, pass:objectToPass};
        })
        .catch((error) => {
            return error;
        });
    };

    this.pullOverlay = function(overlayIdArr) {
        if (!overlayIdArr.length) {
            return Promise.resolve([]);
        }
        return DB.query(`
        SELECT overlay, id
        FROM video
        WHERE id IN (:ids)`, {ids: overlayIdArr}, 'video')
        .then((rows) => {
            return rows;
        })
        .catch((error) => {
            return error;
        });
    }

    this.formatMediaByURL = function(URL, objectToPass){
        var passThisFurther = objectToPass || null;
        // MEDIA FORMAT
        /*  
            mediaType:"stripe",
            name:row.media_name,
            extension:"txt",
            note:"some_note",
            thumbnail:"thumbnailURL",
            url:"url"
            id:row.id 
        */
        if(!Array.isArray(URL)){
            URL = [ "'" + URL + "'"];
        } else {
            URL = URL.map((el) => {
                return "'" + el + "'";
            })
        };
        return DB.query(`
        SELECT 
        url,
        web_page,
        video.id id,
        media_name,
        thumbnail,
        size,
        note
        FROM video
        WHERE url in (${URL}) OR web_page in (${URL})`, {}, 'video')
        .then((rows) => {
            var dataToReturn = [];
            if(rows.length > 0){
                rows.forEach((el) => {
                    var tempObj = {
                        thumbnail:el.thumbnail,
                        note:el.note,
                        mediaType:undefined,
                        name:el.media_name,
                        extension:helper.determineExtensionByURL(el.url),
                        url:el.url || el.web_page,
                        size: el.size,
                        id:el.id
                    }

                    if(tempObj.extension == "mp4" || 
                        tempObj.extension == "avi" || 
                        tempObj.extension == "webm" || 
                        tempObj.extension == "3gp" || 
                        tempObj.extension == "mov" ){
                        tempObj.mediaType = "video";
                        dataToReturn.push(tempObj);
                    }
                    if(tempObj.extension == "jpg" || 
                       tempObj.extension == "png" || 
                       tempObj.extension == "jpeg"|| 
                       tempObj.extension == "bmp" || 
                       tempObj.extension == "gif"){
                       tempObj.mediaType = "image"
                    }
                    if (['mp4', 'avi', 'webm', '3gp', 'mov', 'jpg', 'png', 'jpeg', 'bmp', 'gif'].indexOf(tempObj.extension) === -1) {
                        tempObj.mediaType = "webPage";
                    }
                    dataToReturn.push(tempObj);
                });
                return {pass:passThisFurther, data:dataToReturn};
            } else {
                return {pass:passThisFurther,data:[]};
            }
        })
        .catch((error) => {
            return error;
        });
    };
    this.pullAllGUIDSforPlaylistAndUser = function(userID, playlistID){
        if(!userID)
        throw "No user parameter was given to pullAllGUIDSforPlaylistAndUser";
        if(!playlistID)
        throw "No playlistID was given to pullAllGUIDSforPlaylistAndUser";
        return DB.query(`
            SELECT guid FROM tv
            WHERE playlist_id = :playlistID
            AND user_id = :userID`, {userID, playlistID}, 'tv')
        .then((rows) => {
            return rows;
        })
        .catch((error) => error);
    };
    this.getGUIDsRelatedWithEvent = function(eventIDsArray){
        eventIDsArray  = JSON.parse(eventIDsArray).map((el) => el.id);

        if(!Array.isArray(eventIDsArray)) { reject("getGUIDsRelatedWithEvent requires array"); }
        return DB.query(`
            SELECT tv_guid, group_id FROM schedule
            WHERE ID IN (:ids)`, {ids: eventIDsArray.join(",")}, 'schedule')
        .then((rows) => {
            if(rows.length > 0){ return rows; }
            else { return []; }
        })
        .catch(e => {
            console.log('err 9999', e)
        });
    };
}

module.exports = helpers;