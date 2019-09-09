const DB = require("../modules/sql.js");
const winston = require('winston');
require('winston-syslog').Syslog;
const options = {
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
    file: {
        level: 'debug',
        filename: '../logs.log',
        handleExceptions: true,
        json: false,
        maxsize: 1024 * 1024, // 1MB
        maxFiles: 5,
        colorize: false,
    },
    syslog: {
        level: 'info',
        protocol: 'unix',
        path: '/dev/log',
        facility:  'auth',
        app_name:  'dwall'
    }
};

let addInfo

const dateFunc = () => {
    let date = new Date();
    let cHours = date.getHours()
    let cMinutes = date.getMinutes()
    let cSeconds = date.getSeconds()
    if (cHours<10) cHours=`0${cHours}`
    if (cMinutes<10) cMinutes=`0${cMinutes}`
    if (cSeconds<10) cSeconds=`0${cSeconds}`
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} | ${cHours}:${cMinutes}:${cSeconds}`
}

winston.add(new winston.transports.Syslog(options.syslog));

class Logger {
    static transport() {
        return winston.createLogger({
            transports: [
                // new (winston.transports.File)(options.file),
                // new (winston.transports.Console)(options.console),
                new winston.transports.Syslog()
            ],
            exitOnError: false, // do not exit on handled exceptions
        });
    }    
    static getUserById(id){
        return DB.query(`
        SELECT first_name, email 
        FROM users
        WHERE id = :id`, {id}, "users")
    }
    static getDeviceNameByGuid(guid){
        return DB.query(`
        SELECT tv_name FROM tv_data
        WHERE guid = :guid`, {guid}, "guid")
    } 
    static getDeviceNameByGroupId(group_id){
        return DB.query(`
        SELECT name FROM groups_desc
        WHERE group_id = :group_id`, {group_id}, "guid")
    } 
    static getPlaylistNameById(id){
        return DB.query(`
        SELECT list_name FROM playlists
        WHERE id = :id`, {id}, "playlists")
    } 
    static getMediaNameByURL(url){
        return DB.query(`
        SELECT media_name FROM video
        WHERE url = :url`, {url}, "video")
    } 
    static getMediaByEventId(id){
        return DB.query(`
        SELECT * FROM schedule
        WHERE ID = :id`, {id}, "schedule")
    } 
    static getDeviceGuidByEventId(id){
        return DB.query(`
        SELECT tv_guid FROM schedule
        WHERE ID = :id`, {id}, "schedule")
    } 
    static getMediaOrPlaylistByEventId(id){
        return DB.query(`
        SELECT * FROM schedule
        WHERE ID = :id`, {id}, "schedule")
    } 

    static async getInfo(info, userId){   
        let data         
        if(info && info.event == "fileupload"){
            data = `Filename: ${info.filename} - Filesize: ${info.filesize} `
        }else if(info && info.event == "login"){
            data = `Email: ${info.email} `
        }else if(info && info.event == "create device"){
            data = `Device name: ${info.name} `
        }else if(info && (info.event == "update device" || info.event == "remove device")){
            const result = await Logger.getDeviceNameByGuid(info.guid)
            data = `Device name: ${result[0].tv_name}`
        }else if(info && (info.event == "add event" || info.event == "update event")){
            let device
            if(info.guid){
                device = await Logger.getDeviceNameByGuid(info.guid)
            }
            if(info.tv_guid){
                device = await Logger.getDeviceNameByGuid(info.tv_guid)
            }
            else if(info.group_id){
                device = await Logger.getDeviceNameByGroupId(info.group_id)
            }
            if(device[0].tv_name) device = `Device: ${device[0].tv_name}`
            else if(device[0].name) device = `Group: ${device[0].name}`

            if(info.playlist_id){
                const playlist = await Logger.getPlaylistNameById(parseInt(info.playlist_id))
                data = `Playlist: ${playlist[0].list_name}, ${device}`
            }else if(info.URL){
                const media = await Logger.getMediaNameByURL(info.URL)
                data = `Image: ${media[0].media_name}, ${device}`
            }
        }else if(info && (info.event == "add event constantly")){
            let device
            if(info.name){
                device = `Group: ${info.name}`
            }
            if(info.playlist_id){
                const playlist = await Logger.getPlaylistNameById(parseInt(info.playlist_id))
                data = `Playlist: ${playlist[0].list_name}, ${device}`
            }else if(info.URL){
                const media = await Logger.getMediaNameByURL(info.URL)
                data = `Image: ${media[0].media_name}, ${device}`
            }
        }else if(info && info.event == "delete event" ){
            let media = info.media[0]
            let device = info.device[0]
            if (device.tv_name) device = `Device: ${device.tv_name}`
            else if (device.name)  device = `Group: ${device.name}`
            if(media.URL){
                const result = await Logger.getMediaNameByURL(media.URL)
                data = `Media name: ${result[0].media_name}, ${device}`
            }else if(media.playlist_id){
                const result = await Logger.getPlaylistNameById(parseInt(media.playlist_id))
                data = `Playlist: ${result[0].list_name}, ${device}`
            }
        }else if(info && info.event == "passchange"){
            const result = await Logger.getUserById(userId)
            data = `Email: ${result[0].email}`
        }
        addInfo = (info)?` - ${data}`:""
    }
    error(userId, eventName, req, res, err, status, info) {
        // set locals, only providing error in development
        // add this line to include winston logging
        if(!userId){
            Logger.getInfo(info, userId)
            .then(() => Logger.transport().debug(`${dateFunc()} - ${eventName}: "Invalid user email or pass" - ${req.ip}${addInfo} - Failed `))
        }else{
            Logger.getInfo(info, userId) 
            .then(() => Logger.getUserById(userId))
            .then((user) => Logger.transport().debug(`${dateFunc()} - ${eventName}: - Username: ${user[0].first_name} - IP: ${req.ip}${addInfo} - Failed `))
        }
        res.status(status || 500).send(err)
        // render the error page
    }
    log(userId, eventName, req, res, message, status, info) {
        Logger.getInfo(info, userId) 
        .then(() => Logger.getUserById(userId))
        .then((user) => Logger.transport().debug(`${dateFunc()} - ${eventName}: - Username: ${user[0].first_name} - IP: ${req.ip}${addInfo} - Success `))
        // render the page
        res.status(status || 200).send(message)
    }
}

module.exports = new Logger
