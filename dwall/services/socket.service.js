const io = require('socket.io');
const devicesController = require("../controllers/devices.controller.js");
const groupsController = require("../controllers/groups.controller.js");
const scheduleController = require("../controllers/schedule.controller.js");
const playlistController = require("../controllers/playlists.controller.js");
const mediaController = require("../controllers/media.controller.js");
const stripeController = require("../controllers/stripe.controller.js");

class SocketService {
  constructor(server) {
    this.io = io(server, {
      pingTimeout: 2000,
      pingInterval: 5000,
      upgradeTimeout: 2000
    });
    this.io.on('connection', this.connection.bind(this));
    this.connections = {};
    this.schedules = {};
  }

  connection(client) {
    client.on('disconnect', this.disconnect.bind({client, Socket: this}));
    client.on('newGUID', this.newGUID.bind({client, Socket: this}));
    client.on('getFallBack', this.getFallBack.bind({client, Socket: this}));
    client.on('clientGUID', this.clientGUID.bind({client, Socket: this}));
    client.on('cred', this.cred.bind({client, Socket: this}));
    client.on('hdmiStatus', this.hdmiStatus.bind({client, Socket: this}));
  }

  disconnect(data) {
    console.log(`[DISCONNECTED:${new Date()}]`, this.client.id);
  }

  notifyRoom(guid) {
    console.log('[Notify]');
    this.schedules[guid] = null;
    this.io.to(guid).emit('refresh', {});
  }

  muteRoom(guid) {
    this.io.to(guid).emit('mute', {});
    return {message: 'mute have been sent to active devices.'};
  }

  unmuteRoom(guid) {
    this.io.to(guid).emit('unmute', {});
    return {message: 'unmute have been sent to active devices.'};
  }

  restartRoom(guid) {
    this.io.to(guid).emit('restartApp', {});
    return {message: 'restarting devices.'};
  }

  async hdmiStatus(data) {
    if (this.Socket.io.sockets.adapter.rooms.hasOwnProperty(this.client.guid)) {
      this.Socket.io.sockets.adapter.rooms[this.client.guid].hdmiStatus = data.status;
    }
  }

  clearFallback(guid) {
    this.io.to(guid).emit('clearFallBack', {});
  }

  async newGUID(data) {
    try {
      const devices = await devicesController.getDeviceByInputId({inputId: data.inputId});
      if (devices.length || this.Socket.joinRoom.call(this, devices)) {
        this.client.guid = devices[0].guid;
        const schedule = await this.Socket.getRoomSchedule.call(this);
        this.client.emit('GUID', {GUID: devices[0].guid});
      } else {
        //this.client.emit("resetApp");
        this.client.emit('GUID', {GUID: null});
      }
    } catch(err) {
      console.log('[Socket::Error]', err);
    }
  }

  async getRoomSchedule() {
    try {
      const guid = this.client.guid;
      if (!this.Socket.schedules.hasOwnProperty(guid) || this.Socket.schedules[guid] === null) await this.Socket.prepareSchedule.call(this);
      let schedule = JSON.parse(this.Socket.schedules[guid]);
      schedule.time = new Date().toUTCString();
      this.Socket.schedules[guid] = JSON.stringify(schedule);
      return this.Socket.schedules[guid];
    } catch(err) {
      console.log('[Socket::Error]', err);
    }
  }

  joinRoom(devices) {
    if (!devices.length) return false;
    if (this.Socket.io.sockets.adapter.rooms.hasOwnProperty(devices[0].guid)) {
      if (devices[0].is_multicast  && this.Socket.io.sockets.adapter.rooms[devices[0].guid].length >= devices[0].limit && !this.client.rooms.hasOwnProperty(devices[0].guid)) {
        this.client.emit('multiCastLimit', {message:"Multicast device limit has been reached!"});
        return false;
      } else if (!devices[0].is_multicast && this.Socket.io.sockets.adapter.rooms[devices[0].guid].length >= devices[0].limit && !this.client.rooms.hasOwnProperty(devices[0].guid)) {
        this.client.emit('singleDeviceLimit', {message: "Singlecast device limit has been reached!"});
        return false;
      } else {
        this.client.join(devices[0].guid);
      }
    } else {
      this.client.join(devices[0].guid);
    }
    return true;
  }

  async leaveRoom(guid) {
    try {
      this.io.of('/').in(guid).clients((err, clients) => {
        if (clients.length) {
          clients.filter((socket_id) => {
              this.io.sockets.sockets[socket_id].leave(guid);
              this.io.sockets.sockets[socket_id].emit('resetApp', {message: 'reset'});
              return false;
          });
        }
      })
      return;
    } catch (err) {
      console.log('[ERROR]', err);
    }
  }

  getClientFromRoom(guid) {
    return new Promise((resolve, reject) => {
      let client = null;
      this.io.of('/').in(guid).clients((err, clients) => {
        if (clients.length) {
          client = this.io.sockets.sockets[clients[0]];
        }
        resolve(client);
      })
    })
    .catch(err => {
      console.log('[Error]', err);
    });
  }

  async leaveGroup(guid) {
    const schedule = JSON.stringify({
      delta: 0,
      events: [{
        start: null,
        end: null,
        stripe: {},
        rss: {},
        overlay: {},
        playList: []
      }]
    });
    if (this.schedules.hasOwnProperty(guid)) this.schedules[guid] = schedule;
    try {
      this.io.of('/').in(guid).clients((err, clients) => {
        if (clients.length) {
          clients.filter((socket_id) => {
              this.io.sockets.sockets[socket_id].emit('schedule', schedule);
              return false;
          });
        }
      })
      return;
    } catch (err) {
      console.log('[ERROR]', err);
    }
  }

  async getFallBack(data) {
    try {
      const fallback = await mediaController.getFallBackByGUID({guid: data.GUID});

      const devices = await devicesController.getSocDeviceByGuid({guid: data.GUID});
      if (this.Socket.io.sockets.adapter.rooms.hasOwnProperty(devices[0].guid)) {
        if (devices[0].is_multicast  && !this.client.rooms.hasOwnProperty(data.GUID)) {
          return false;
        } else if (!devices[0].is_multicast && !this.client.rooms.hasOwnProperty(data.GUID)) {
          return false;
        } else {
          this.client.emit("setUserFallBack", fallback);
        }
      } else {
        this.client.emit("setUserFallBack", fallback);
      }
    } catch(err) {
      console.log('[Socket::Error]', err);
    }
  }

  clientGUID(data) {
    //
  }

  async cred(data) {
    try {
      const {GUID, DUID, inputId} = data;
      if (!GUID) return;
      const devices = await devicesController.getDeviceByInputId({inputId});
      if (this.Socket.joinRoom.call(this, devices)) {
        this.client.guid = GUID;
        this.client.duid = DUID;
        this.client.inputId = inputId;
        const schedule = await this.Socket.getRoomSchedule.call(this);
        this.client.emit('schedule', schedule);
      } else {
        this.client.emit("resetApp");
      }
      return;
    } catch(err) {
      console.log('[Socket::Error]', err);
    }
  }

  async prepareSchedule() {
    try {
      const guid = this.client.guid;
      let isGroup = false;
      let isConstantPlay = false;
      let isPlaylist = false;
      let isEmpty = false;
      let playlistId = null;
      let schedule = [];
      let playlist = [];
      let media = [];
      let rss = {};
      let stripe = {};
      let overlay = {};

      const groups = await groupsController.getSocGroupDeviceByGuid({guid});
      const devices = await devicesController.getSocDeviceByGuid({guid});
      if(groups.length === 0 && devices.length === 0) {
        this.client.emit("resetApp");
        return;  
      }

      if (groups.length) isGroup = true;
      if (devices[0].constant_play) isConstantPlay = true;
      if (groups.length && !groups[0].on_schedule) isConstantPlay = true;
      if (isConstantPlay && devices[0].playlists_status) {
        isPlaylist = true;
        playlistId = devices[0].playlist_id;
      }

      if (isConstantPlay && isGroup && groups[0].playlist_id) {
        isPlaylist = true;
        playlistId = groups[0].playlist_id;
      }

      if (isConstantPlay && devices[0].video_id) {
        media = await mediaController.getMediaById({id: devices[0].video_id});
        media = media.map((item) => {
          let mediaType;
          if (item.web_page) {
            mediaType = 'webPage';
          } else if (item.stream) {
            mediaType = 'stream';
          } else {
            mediaType = devicesController.detectMediaType({url: item.url})
          }
          return {
            v_order: null,
            url: item.url || item.web_page || item.stream,
            timeout: item.duration,
            mediaType
          };
        });
      }
      if (isConstantPlay && isGroup && groups[0].url && !groups[0].playing_fallback) {
        let mediaType;
        if (groups[0].web_page) {
          mediaType = 'webPage';
        } else if (groups[0].stream) {
          mediaType = 'stream';
        } else {
          mediaType = devicesController.detectMediaType({url: groups[0].url})
        }
        media.push({
          v_order: null,
          url: groups[0].url,
          timeout: null,
          mediaType
        });
      }
      if (!isConstantPlay && !isGroup) schedule = await scheduleController.getScheduleByGuid({tvGuid: guid});
      if (!isConstantPlay && isGroup) schedule = await scheduleController.getScheduleByGroupId({groupId: groups[0].group_id});
      if (isConstantPlay && isGroup) schedule = await scheduleController.getScheduleByGroupId({groupId: groups[0].group_id});
      if (!Array.isArray(schedule)) schedule = [schedule];
      let schedulesArr = schedule.map(item => {
        return this.Socket.scheduleInteface(item, isEmpty, isPlaylist, isConstantPlay, media, playlistId);
      });
      if (!schedule.length) schedulesArr.push(this.Socket.scheduleInteface(schedule, isEmpty, isPlaylist, isConstantPlay, media, playlistId));

      schedulesArr = await Promise.all(schedulesArr);
      schedule = {
        delta: 0,
        time: new Date().toUTCString(),
        events: []
      };
      schedulesArr.forEach(event => {
        if (event.events) {
          event.events.forEach(item => {
            schedule.events.push(item);
          });
        } else {
          schedule.events = [];
          schedule.events.push({
            start: event && event.start ? event.start : null,
            end: event && event.end ? event.end : null,
            stripe,
            rss,
            overlay,
            playList: []
          });
        }
      });
      this.Socket.schedules[guid] = JSON.stringify(schedule);
      return true;
    } catch(err) {
      console.log('[Socket::Error]', err);
    }
  }

  async scheduleInteface(schedule, isEmpty, isPlaylist, isConstantPlay, media, playlistId) {
    let playlist = [];
    let rss = {};
    let stripe = {};
    let overlay = {};
    if (schedule.playlist_id) {
      isPlaylist = true;
      playlistId = schedule.playlist_id;
    } else if (schedule.URL) {
      // DO NOTHING
    } else {
      isEmpty = true;
      schedule = {
        delta: 0,
        events: [{
          start: null,
          end: null,
          stripe: {},
          rss: {},
          overlay: {},
          playList: []
        }]
      }
    }
    if (isPlaylist && !isEmpty || isPlaylist && isConstantPlay) {
      playlist = await playlistController.getPlaylistById({id: playlistId});
      media = playlist.map((item) => {
        let mediaType;
        if (item.web_page) {
          mediaType = 'webPage';
        } else if (item.stream) {
          mediaType = 'stream';
        } else {
          mediaType = devicesController.detectMediaType({url: item.url})
        }
        return {
          v_order: item.v_order,
          url: item.url || item.web_page || item.stream,
          timeout: item.duration,
          mediaType
        };
      });
      if (playlist[0] && playlist[0].overlay_id) {
        let overlayArr = await mediaController.getMediaById({id: playlist[0].overlay_id});
        overlay = {
          overlay: overlayArr[0].overlay,
          url: overlayArr[0].url,
          overlayType: devicesController.detectLayerMediaType({url: overlayArr[0].overlay ? overlayArr[0].overlay : overlayArr[0].url})
        };
      }

      let line;
      if (playlist[0] && playlist[0].stripe_id) {
        let isRss = await playlistController.playlistHasRss({id: playlistId});
        line = await stripeController.getStripeById({id: playlist[0].stripe_id});
        rss = isRss.rss ? line[0] : {};
        stripe = !isRss.rss ? line[0] : {};
        if (isRss.rss) {
          rss = {
            bg_color: playlist[0].stripe_background,
            color: playlist[0].stripe_color,
            rss_update_interval: playlist[0].rss_update_interval,
            url: isRss.url
          }
        } else {
          stripe = {
            bg_color: playlist[0].stripe_background,
            color: playlist[0].stripe_color,
            text: stripe.text
          }
        }
      }
    } else if(!isEmpty) {
      media = [];
      media.push({
        v_order: 0,
        url: schedule.URL,
        timeout: null,
        mediaType: devicesController.detectMediaType({url: schedule.URL})
      });
    }
    if (media.length) {
      schedule = {
        delta: 0,
        time: new Date().toUTCString(),
        events: [{
          start: schedule && schedule.start ? schedule.start : null,
          end: schedule && schedule.end ? schedule.end : null,
          stripe,
          rss,
          overlay,
          playList: media
        }]
      }
    }
    return schedule;
  }
}

module.exports = SocketService;