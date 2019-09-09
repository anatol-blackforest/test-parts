const DB = require("../modules/sql.js");
const mediaController = require("./media.js");
const bCrypt = require('bcrypt');
const mController = new mediaController();

function userController(){
    var uController = this;
    this.validatePass = function(email, pass){
        return new Promise((resolve, reject) => {
            uController.getUserIdByEmail(email)
            .then((userID) => { 
             return uController.getUserDataById(userID) })
            .then((userData) => { 
             return bCrypt.compare(pass, userData.pass)})
            .then((status) => resolve(status))
            .catch((error) => reject(error))
        });
    };
    this.validatePassById = function(userId, pass){
        return new Promise((resolve, reject) => { 
             uController.getUserDataById(userId)
            .then((userData) => { 
                return bCrypt.compare(pass, userData.pass)
            })
            .then((status) => {
                resolve(status)
            })
            .catch((error) => reject(error))
        });
    };
    this.validatePassPlain = function(email, pass){
        return new Promise((resolve, reject) => {
            uController.getUserIdByEmail(email)
            .then((userID) => { 
             return uController.getUserDataById(userID) })
            .then((userData) => { 
             return pass == userData.pass})
            .then((status) => resolve(status))
            .catch((error) => reject(error))
        });
    };
    this.setPassById = function(userID, pass){
        return bCrypt.hash(pass, 10)
        .then((hash) => { 
            return DB.query(`
            UPDATE users
            SET pass = :hash
            WHERE id = :userID`, {hash, userID}, 'users');
         })
        .catch((error) => { return error; });
    };
    this.getUserIdByEmail = function(email){
        if(!email){ 
            return " No email was given for user. "; 
        } else {
            // return DB.runQuery(`
            //     SELECT id FROM users
            //     WHERE email = '${email}'`)

            return  DB.query('SELECT * FROM users WHERE email = :email', {email}, 'users')
            // return DB.query(`SELECT id FROM users WHERE email = :email`, {email}, 'users')
            // return DB.query(`
            // SELECT id FROM users
            // WHERE email = :email`, {email}, 'users')
            .then((data) => {
                if(data.length > 0){ return data[0].id; } 
                else { return null; }
            })
            .catch((error) => { 
                return error; 
            })
        };
    };
    this.getUserDataById = function(userID){
        return DB.query(`
        SELECT * FROM users
        WHERE id = :userID`, {userID}, 'users')
        .then((data) => {
            if(data.length > 0){ return data[0]; } 
            else { return null; }
        })
        .catch((error) => { return error; });
    };
    this.setTimeZone = function(userID, timeZone){
        return DB.query(`
        UPDATE users
        SET timezone = :timeZone
        WHERE id = :userID`, {timeZone, userID}, 'users')
        .then(() => {return;})
        .catch((error) => error);
    };
    this.setTvLimit = function(userID, TVlimit){
        if(isNaN(parseInt(TVlimit)))
        { return " NaN was passed to setTvLimit method. "; }
        else if(!userID)
        { return " Not valid userID was passed to setTvLimit method. "; }
        else {
            return DB.query(
            `UPDATE users 
             SET tv_limit = :TVlimit
             WHERE id = :userID`, {TVlimit, userID}, 'users')
            .then(() => {return;})
            .catch((error) => error);
        }
    }
    this.checkUserIdExists = function(id){
        return DB.query(`
        SELECT email FROM users
        WHERE id = :id`, {id}, 'users')
        .then((data) => {
            if(data[0].length > 0){
                return true;
            } else {
                return false;
            }
        })
        .catch((error) => {
            return error;
        });
    };

    this.insertNewUser = function(userData){
        var newUserId = null;
        console.log("userData")
        console.log(userData)
        // return DB.query(buildQuery(userData), {}, 'users')
        let licenseGenerator = () => {
            var now = new Date();
            now.setMonth(new Date().getMonth() + 1);
            var expires = now.toISOString()
                .slice(0, now.toISOString().lastIndexOf('T'))
                .concat('T23:59:59.999Z');
            return expires
        }
        return bCrypt.hash(userData.pass, 10)
        .then((result) => {
            let parametres = { 
                email: userData.email,
                first_name: userData.first_name,
                pass: result,
                licence_expires: licenseGenerator()
            }
            return DB.query(`INSERT INTO users (email, first_name, pass, licence_expires) VALUES (:email, :first_name, :pass, :licence_expires)`, parametres, 'users')
        })
        // .then((resultat) => {
        //     console.log("sper email")
        //     console.log(resultat)
        //     console.log(userData.email)
        //     return uController.getUserIdByEmail(userData.email);
        //  })
        .then((data) => { 
            return data.insertId; 
        });
        function buildQuery(userData){
            return ` INSERT INTO users (${Object.keys(userData).join(",")})
            VALUES (${Object.keys(userData).map((el) => "'" + userData[el] + "'").join(",")})`;
        };
    };
    this.updateUser = function(id, userDataToUpdate){
        var userID = id;
        if(userDataToUpdate.id){delete userDataToUpdate.id}
        const params = {
            set: {},
            where: {}
        }
        params.where.id = id;
        params.set = userDataToUpdate;
        const variables = Object.assign({}, params.set, params.where);
        const query = DB.prepareQuery('UPDATE users', params);
        return DB.query(query, variables, 'users')
        .catch(err => {
            console.log('[ERROR]', err);
        });
    };

    this.getUserGUIDS = function(userId){
        return DB.query(`
        SELECT guid FROM tv
        WHERE user_id = :userId
        `, {userId}, 'tv')
        .then((data) => {
            if(data.length > 0){
                return data;
            }   
            else {
                return [];
            }
        })
        .catch((error) => {
                return error;
        });
    }

    this.getAllUsers = function() {
      return DB.query(`
        SELECT email, licence_expires, first_name
        FROM users;
        `, {}, 'users')
        .then((data) => {
            return data;
        })
        .catch((error) => {
           return error;
        })
    }

    

    this.emitClearFallBack = function(GUID){
        //TODO - create method for clearing fallback
        return;
    };

    this.setFallback = function(userId, mediaId){
        return DB.query(`
        SELECT url 
        FROM video
        WHERE id = '${mediaId}'
        AND user_id = '${userId}'`)
        .then((data) => {
            if(data.length > 0){
                if(data[0].url && (data[0].url.search(/http/) >= 0)){
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        })
        .then((status) => {
            if(!status){ throw new Error(" Not valid media id was given. Media shouldn't be stripe or belong to another user. Check that. ") }
        })
        .then(() => {
            return DB.query(` 
            UPDATE users
            SET fallback_media = :mediaId
            WHERE id = :userId`, {mediaId, userId}, 'users')
        })
        .then(() => {return;})
        .catch((error) => error);
    }

    this.getFallbackByUserId = function(userId){
        return DB.query(`
        SELECT users.fallback_media, video.url FROM users
        JOIN video
        ON video.id = users.fallback_media
        WHERE users.id = :userId`, {userId}, 'users')
        .then((data) => {
            if(data.length > 0){
                return mController.pullMedia(data[0].fallback_media)
            } else {
                return null;
            }
        })
        .then((fallBackMedia) => {
            if(!fallBackMedia){
                return null;
            } else {
                return fallBackMedia;
            }
        })
        .catch((error) => { 
            console.log('Err 2.2', err);
        });
    };

    this.getLicence = function(userId){
        var licenceInfo = {
            tv_limit:null,
            multicast_limit:null,
            licence_expires:null
        }
        return DB.query(`
        SELECT tv_limit, multicast_limit, licence_expires
        FROM users
        WHERE id = :userId`, {userId}, 'users')
        .then((data) => {
            if(data.length > 0){
                licenceInfo.tv_limit = data[0].tv_limit;
                licenceInfo.multicast_limit = data[0].multicast_limit;
                licenceInfo.licence_expires = data[0].licence_expires;
            } else {
                return new Error(" Licence information for thiss users wasn't found ");
            }
        });
    };

    this.setLicenceExpiration = function(userId, ISOstring){
        // ISO format expected "2017-12-19T15:07:10.901Z"
        return DB.query(`
        UPDATE users
        SET licence_expires = :ISOstring
        WHERE id = :userId`, {ISOstring, userId}, 'users')
        .then(() => {return;})
        .catch((error) => error);
    };
    this.getAllUsersData = function(userId) {
        return DB.query(`
        SELECT email, id, tv_limit, timezone, first_name, address, company,
        country,
        state,
        postal_code,
        billing_name,
        billing_address,
        city,
        billing_country,
        billing_postal_code,
        fallback_media,
        multicast_limit,
        licence_expires,
        billing_city,
        billing_state,
        file_storage_byte,
        traffic_limit_byte,
        file_storage_used_byte,
        traffic_limit_used_byte,
        created_at,
        last_login 
        FROM users
        WHERE users.id = :userId`, {userId}, 'users')
        .then((data) => {return data;})
        .catch((error) => error);
    };

    this.pullAll = function(userid) {
        return DB.query(`
        SELECT
        users.email,
        tv_data.tv_name,
        tv_data.tv_location,
        tv_data.tv_note,
        tv.input_id,
        tv.guid,
        tv.playlists_status,
        tv.playlist_id,
        tv.constant_play,
        tv.playLocalyStatus,
        tv.orientation,
        tv.on_schedule,
        video.url,
        fallback.url f_url
        FROM users
        LEFT JOIN tv
        ON tv.user_id = users.id
        LEFT JOIN video
        ON tv.video_id = video.id
        LEFT JOIN tv_data
        ON tv.guid = tv_data.guid
        LEFT JOIN fallback
        ON fallback.guid = tv.guid
        WHERE users.id = ${userid}
        `, {userid}, 'users')
        .then((data) => {
            var status = false;
            Object.keys(data[0]).forEach((el) => {
                if(el != "email" && data[0][el] != null){
                    status = true;
                }
            });
            if(status){
                return data;
            } else {
                return [];
            }
        })
        .catch(err => {
            return { "Status": "Error while pulling all tv from DB. Drats.", "Error": err };
        });
    };

    this.resetTVbyGUID = function(GUID){
        //TODO emit "resetApp"
        return;
    };

}

module.exports = userController;