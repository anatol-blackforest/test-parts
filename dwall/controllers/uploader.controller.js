const DB = require("../modules/sql.js");
let fileName  

class S3Bucket {

    dbPush(data){ 
        if(data.request.query.fileName){
            fileName = data.request.query.fileName.replace(/[^!a-zA-Zа-яА-Я0-9-.\u400-\u04F0\']|\s/g, "_");
            var re = /(?:\.([^.]+))?$/;
            var ext = re.exec(fileName)[1].toLowerCase();
            fileName = fileName.slice(0, -ext.length).concat(ext);
        }else{
            fileName = data.request.body.name
        }
        data = {...data, fileName}
        const params = {
            media_name: data.name,
            note: data.request.query.fileNote || data.request.body.note || "",
            userId: data.userId,
            size: data.size,
            url: data.result.dataFile.Location,
            thumbnail: data.result.dataThumb.Location,
            dimensions: data.dimensions,
            duration: data.duration
        }
        return DB.query("INSERT INTO video (`user_id`, `size`, `url`, `thumbnail`, `note`, `dimensions`, `duration`, `media_name`) VALUES(:userId, :size, :url, :thumbnail, :note, :dimensions, :duration, :media_name)", params, 'video')
        .then((info) => {
            return {...data, id: info.insertId};
        }).catch(err => {
            console.log("DB Error", err)
            return err;
        });
    }

    fallbackRemover(id) { 
        return DB.query(`
            UPDATE users
            SET fallback_media = null
            WHERE fallback_media = :id`,{id},"users"
        );
    }

    getUserFileStorageInUse(userId){
        if(!userId){ throw " No user id specified " }
        return DB.query(`
        SELECT file_storage_byte lim, file_storage_used_byte used
        FROM users
        WHERE id = :userId`, {userId}, 'users')
        .then((data) => {
            if(data.length > 0){ return {limit:data[0].lim, used:data[0].used}} 
            else { return null;}
        })
        .catch((error) => { return error; });
    };

}

module.exports = new S3Bucket
