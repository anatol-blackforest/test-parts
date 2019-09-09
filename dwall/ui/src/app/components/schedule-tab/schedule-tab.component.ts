import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/forkJoin';

import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';
import { UserService } from '../../services/user/user.service';

import { mediaTypes, targetTypes } from '../../shared/helpers';

import * as moment from 'moment-timezone';

import { IDevice } from '../../interfaces/device';
import { IGroup } from '../../interfaces/group';

import { detectIE, detectMobileDevice, getMediaByUrl, findPlaylistById, getGroupsWithConstantEvent, findDeviceByGUID, findGroupById, findEventById } from '../../shared/functions';

declare let $: any;

@Component({
  selector: 'app-schedule-tab',
  templateUrl: './schedule-tab.component.html',
  styleUrls: ['./schedule-tab.component.css']
})
export class ScheduleTabComponent implements OnInit {

  @ViewChild('wiz') wiz;

  public event: any;

  // modals
  public newEventModalId: string = 'addNewEventModalId';
  public selectTimeZoneModalId: string = 'selectTimeZone';
  public targetModal: string = 'target';

  public selectedMedia: any;
  public selectedPlaylist: any;
  // selected target (device | group)
  public selected: any;
  public playConstantly: boolean = true;
  public playAllDay: boolean = false;
  public selectedAllDayToPlay: any;
  public start: any;
  public end: any;

  public tvs: IDevice[] = [];
  //public media: { images: any[], videos: any[] } = { images: [], videos: [] };
  public images: any[] = [];
  public videos: any[] = [];
  public webPages: any[] = [];
  public playlists: any[] = [];
  public groups: IGroup[] = [];

  public scheduleDeviceEvents: any[] = [];
  public scheduleGroupEvents: any[] = [];

  public selectedTimeZone: string;

  public isMobileDevice: boolean;

  private dragMedia: any;

  constructor(
    private tvService: TvService,
    public modalService: ModalService,
    private translate: TranslateService,
    private userService: UserService
  ) { this.isMobileDevice = detectMobileDevice(); }

  ngOnInit() {
    moment.locale('en-gb');
    // week starts drom Sunday;
    //moment.locale('en-usa');

    this.selectedAllDayToPlay = moment().format('YYYY-MM-DD');
    this.tvService.playlists
      .subscribe(playlists => { this.playlists = playlists; });

    this.tvService.media
      .subscribe((media: any[]) => {
        if (Array.isArray(media)) {
          this.images = media.filter((e) => e.mediaType === mediaTypes.image);
          this.videos = media.filter((e) => e.mediaType === mediaTypes.video);
          this.webPages = media.filter(e => e.mediaType === mediaTypes.webPage);
        }
      });

    Observable.combineLatest(this.tvService.tvs, this.tvService.scheduleEvents, this.tvService.groups)
      .subscribe((data) => {
        let recieved = data;
        recieved[0] = (data[0] === null) ? [] : data[0];
        this.tvs = recieved[0];
        this.groups = recieved[2];
        let scheduleDeviceEvents = [];
        let scheduleGroupEvents = [];
        let constPlayDevices: IDevice[] = recieved[0].filter((tv: IDevice) => ((tv.constant_play === 1) && (tv.playing_fallback == 0) && (tv.url || (tv.playlists_status && tv.playlist_id))));
        constPlayDevices = this.prepareConstantEvents(constPlayDevices, targetTypes.device);
        let constPlayGroups: IGroup[] = getGroupsWithConstantEvent(recieved[1], recieved[2]);
        constPlayGroups = this.prepareConstantEvents(constPlayGroups, targetTypes.group);
        let deviceEvents = recieved[1].filter((event: any) => {
          return event.tv_guid;
        });
        let groupEvents = recieved[1].filter((event: any) => {
          let group = findGroupById(this.groups, event.group_id);
          event.name = group && group.name ? group.name : 'not found';
          return event.group_id;
        });
        scheduleDeviceEvents = this.prepareScheduleEvents(deviceEvents, targetTypes.device);
        scheduleGroupEvents = this.prepareScheduleEvents(groupEvents, targetTypes.group);
        this.scheduleDeviceEvents = constPlayDevices.concat(scheduleDeviceEvents);
        this.scheduleGroupEvents = constPlayGroups.concat(groupEvents);
      })
  }

  private prepareConstantEvents(events: any[], type: string): any[] {
    let constEvents: any[] = events;
    let isDevice = (type === targetTypes.device);
    constEvents.forEach((e: any) => {
      e.events = [{
        type: type,
        id: isDevice ? e.guid : e.id,
        start: new Date('2000-01-01'),
        end: new Date('2100-01-01'),
        URL: e.URL ? e.URL : e.url,
        plStatus: isDevice ? e.playlists_status : !!e.playlist_id,
        playlist_id: e.playlist_id,
        constant_play: true,
      }];
    })
    return constEvents;
  }

  private prepareScheduleEvents(events: any[], type: string): any[] {
    let objectToPush;
    let scheduleEvents: any = events;
    let processedEvents = [];
    let isDevice = (type === targetTypes.device);
    scheduleEvents.forEach((event) => {
      event.events.forEach(e => {
        e.type = type;
        e.id = event.tv_guid ? event.tv_guid : event.group_id;
        e.plStatus = !!e.playlist_id;
      });
      objectToPush = isDevice
        ? Object.assign({}, findDeviceByGUID(this.tvs, event.tv_guid), { events: event.events })
        : Object.assign({}, findGroupById(this.groups, event.group_id), { events: event.events });
      processedEvents.push(objectToPush);
    });
    return processedEvents;
  }

  // public selectMedia(media: any): void {
  //   this.selectedPlaylist = undefined;
  //   this.selectedMedia = undefined;
  //   if (!media.mediaType) { this.selectedPlaylist = media; } else { this.selectedMedia = media; }
  // }

  public closeModal(modalId: string): void {
    this.cleanSelections();
    this.modalService.close(modalId);
  }

  public eventSettings(event): void {
    this.selected = event.target;
    this.assignTo(this.dragMedia);
    this.wiz.next();
  }

  public goPrev(): void {
    if (!this.event) { this.selected = null; }
    this.wiz.previous();
  }

  public changeStep(wiz: any): void {
    let timeOut = !detectIE() ? 0 : 500;
    if (wiz.activeStepIndex == 1) {
      setTimeout(() => {
        $('.date-time-pkr').flatpickr({
          enableTime: true,
          minuteIncrement: 1,
          time_24hr: true,
        });
        $('.all-day-pkr').flatpickr({
          minuteIncrement: 1,
          time_24hr: true,
        });
        $('video').mediaelementplayer();
      }, timeOut);
    }
  }

  private setPlayAllDayStartEndTime(): void {
    this.start = moment(this.selectedAllDayToPlay).set({ hour: 0, minute: 0, second: 0, millisecond: 1 });
    this.end = moment(this.selectedAllDayToPlay).set({ hour: 23, minute: 59, second: 0, millisecond: 0 });
  }

  public setStartEndTime(): void {
    if (this.playAllDay) {
      this.setPlayAllDayStartEndTime();
    } else {
      if (this.event) {
        if (this.event.constant_play) {
          this.start = undefined;
          this.end = undefined;
        } else {
          this.start = moment(this.event.start).format('YYYY-MM-DD') + ' ' + moment(this.event.start).format('HH:mm');
          this.end = moment(this.event.end).format('YYYY-MM-DD') + ' ' + moment(this.event.end).format('HH:mm');
        }
      } else {
        this.start = undefined;
        this.end = undefined;
      }
    }
  }

  private scheduleLengthEvent(): void {
    this.tvService.addLengthScheduleEvent({
      tv_guid: this.selected.tv_name ? this.selected.guid : 'null',
      group_id: !this.selected.tv_name ? this.selected.id : 'null',
      URL: this.selectedMedia ? this.selectedMedia.url : '',
      playlist_id: this.selectedPlaylist ? this.selectedPlaylist.id.toString() : '',
      start: new Date(moment(this.start).set({
        second: 0,
        millisecond: 0
      }).tz(moment().tz())).toISOString(),
      end: new Date(moment(this.end).tz(moment().tz())).toISOString(),
      repeat_event: 0
    });
  }

  private scheduleConstantDeviceEvent(): void {
    this.tvService.addNewSheduleEvent({
      tv: this.selected.guid,
      start: ' ',
      end: ' ',
      media: this.selectedMedia ? this.selectedMedia.url : '',
      media_constantPlay: this.playConstantly.toString(),
      playFromPlayList: this.selectedPlaylist ? 'true' : 'false',
      playLocalyStatus: this.selected.playLocalyStatus.toString(),
      playListSelect: this.selectedPlaylist ? this.selectedPlaylist.id.toString() : '',
      name: this.selected.tv_name,
      location: this.selected.tv_location,
      notes: this.selected.tv_note
    });
  }

  private addLengthEvent(start, end, userAnswer, isDevice, crossedEvents, constCrossedEvent): void {
    let updatedEvent;
    if (this.event) {
      updatedEvent = {
        ID: this.event.event_id,
        tv_guid: isDevice ? this.selected.guid : null,
        URL: this.selectedMedia ? this.selectedMedia.url : null,
        group_id: isDevice ? null : this.selected.id,
        playlist_id: this.selectedPlaylist ? this.selectedPlaylist.id : null,
        start: new Date(moment(this.start).set({
          second: 0,
          millisecond: 0
        }).tz(moment().tz())).toISOString(),
        end: new Date(moment(this.end).tz(moment().tz())).toISOString(),
      };
    }
    // there is no user answer
    if (userAnswer === null) {
      if (this.event) {
        // user edits existing event
        this.editScheduleEvent(updatedEvent);
      } else {
        // user adds new length event
        this.scheduleLengthEvent();
      }
      this.cleanSelections();
    } else if (userAnswer === true) {
      // user wants to replace length event(s) by another length event 
      // works for both groups and devices
      let observables = [];
      crossedEvents.forEach((event: string | number) => {
        if (!(this.event && event == this.event.event_id)) { observables.push(this.tvService.deleteScheduleEvent(event, true)); }
      });
      Observable.forkJoin(observables)
        .subscribe((resp) => {
          if (this.event) {
            this.editScheduleEvent(updatedEvent);
            this.cleanSelections();
          } else {
            this.scheduleLengthEvent();
            this.cleanSelections();
          }
        })
      if (!observables.length && !constCrossedEvent.length) {
        this.editScheduleEvent(updatedEvent);
        this.cleanSelections();
      }
      // user wants to replace constant device event by length event
      if (constCrossedEvent.length && isDevice) {
        let device = findDeviceByGUID(this.tvs, constCrossedEvent[0].id);
        this.scheduleLengthEvent();
        this.cleanSelections();
      }
      // user wants to replace constant group event by length event
      if (constCrossedEvent.length && !isDevice) {
        let group = findGroupById(this.groups, constCrossedEvent[0].id);
        this.tvService.updateGroup(Object.assign(group, { URL: this.userService.userFallback(), playlist_id: 0, playing_fallback: 1 }), true)
          .subscribe(data => {
            this.scheduleLengthEvent();
            this.cleanSelections();
          });
      }
    } else {
      // user doesn't want to replace existing events by new one
      this.start = moment(this.start).format('YYYY-MM-DD') + ' ' + moment(this.start).format('HH:mm');
      this.end = moment(this.end).format('YYYY-MM-DD') + ' ' + moment(this.end).format('HH:mm');
      return;
    }
  }

  private addConstantEvent(userAnswer, isDevice, crossedEvents, constCrossedEvent): void {
    if (userAnswer !== null) {
      this.start = null;
      this.end = null;
    }
    if (isDevice) {
      if (userAnswer === true && crossedEvents.length) {
        // user wants to replace one or more length device evetns with one constant event
        let observables = [];
        crossedEvents.forEach((event: string | number) => {
          observables.push(this.tvService.deleteScheduleEvent(event, true));
        })
        Observable.forkJoin(observables)
          .subscribe((resp) => {
            this.tvService.getScheduleEvents();
            this.scheduleConstantDeviceEvent();
            this.cleanSelections();
          })
      } else if (userAnswer === null) {
        // user creates new constant event for device
        this.scheduleConstantDeviceEvent();
        this.cleanSelections();
      }
      if (userAnswer === true && constCrossedEvent.length) {
        // user wants to replace one constant device event by another one
        this.scheduleConstantDeviceEvent();
        this.cleanSelections();
      }
    } else if (!isDevice) {
      if (userAnswer === null) {
        // user creates new constant event for group
        if (this.selectedMedia) {
          this.tvService.updateGroup(Object.assign(this.selected, { URL: this.selectedMedia.url, playlist_id: '', playing_fallback: 0 }))
        } else if (this.selectedPlaylist) {
          this.tvService.updateGroup(Object.assign(this.selected, { playlist_id: this.selectedPlaylist.id, URL: '', playing_fallback: 0 }))
        }
        this.cleanSelections();
      }
      if (userAnswer === true && crossedEvents.length) {
        // user wants to replace one or more group length with one constant event
        let observables = [];
        crossedEvents.forEach((event: string | number) => {
          observables.push(this.tvService.deleteScheduleEvent(event, true));
        });
        Observable.forkJoin(observables)
          .subscribe((resp) => {
            let groupUpdate;
            if (this.selectedMedia) {
              groupUpdate = { URL: this.selectedMedia.url, playlist_id: '' };
            } else if (this.selectedPlaylist) {
              groupUpdate = { playlist_id: this.selectedPlaylist.id, URL: '' };
            }
            // check
            groupUpdate.playing_fallback = 0;
            this.tvService.updateGroup(Object.assign(this.selected, groupUpdate), true)
              .subscribe((data) => {
                this.tvService.getAllGroups();
                this.tvService.getScheduleEvents();
              })
            this.cleanSelections();
          })
      }
      if (userAnswer === true && constCrossedEvent.length) {
        // user wants to replace one group constant event by another constant one
        if (this.selectedMedia) {
          this.tvService.updateGroup(Object.assign(this.selected, { URL: this.selectedMedia.url, playlist_id: '' }))
        } else if (this.selectedPlaylist) {
          this.tvService.updateGroup(Object.assign(this.selected, { playlist_id: this.selectedPlaylist.id, URL: '' }))
        }
        this.cleanSelections();
      }
    }
  }

  public saveNewScheduleEvent(event: any): void {
    event.preventDefault();
    // length events to be overriden
    let crossedEvents: any[] = [];
    // constant events to be overriden
    let constCrossedEvent: any[] = [];
    // override or not (asked in user)
    let userAnswer = null;
    // device or group object
    let target: any = null;
    // detect targets type (device or group)
    let isDevice = !!this.selected.tv_name;
    // detect targets id
    let id = isDevice ? this.selected.guid : this.selected.id;
    // find target event object
    target = findEventById(isDevice ? this.scheduleDeviceEvents : this.scheduleGroupEvents, id, isDevice);
    /*if (isDevice) {
      target = findEventById(this.scheduleDeviceEvents, id, true);
    } else {
      target = findEventById(this.scheduleGroupEvents, id, false);
    }*/
    // set start and end date for constant event
    if (this.playConstantly) {
      this.start = new Date('2000-01-01');
      this.end = new Date('2100-01-01');
    }
    // if "play all day is checked set selected date's range"
    if (this.playAllDay) {
      this.setPlayAllDayStartEndTime();
    }
    // user didn't enter start and/or end date
    if ((!this.start || !this.end) && !this.playConstantly) {
      this.translate.get('errors.addStartEnd')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }
    // user can not created past events
    if ((moment(this.end).valueOf() < moment().valueOf()) && (!this.playConstantly || this.playAllDay)) {
      this.translate.get('errors.pastEventErr')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }

    // collect events to rerender
    //console.log(target)
    if (target && target.events) {
      for (let i = 0; i < target.events.length; i++) {
        if (((new Date(target.events[i].end).valueOf() == new Date(moment(this.start).tz(moment().tz())).valueOf()) || (new Date(target.events[i].start).valueOf() == new Date(moment(this.end).tz(moment().tz())).valueOf())) && (target.events[i].event_id !== (this.event && this.event.event_id))) {
          this.translate.get('errors.sameStartEnd')
            .subscribe((res: string) => {
              alert(res);
            });
          return;
        }
        //console.log(moment(target.events[i].start).isBefore(moment(this.end).tz(moment().tz())), moment(target.events[i].end).isAfter(moment(this.start).tz(moment().tz())));
        if (moment(target.events[i].start).isBefore(moment(this.end).tz(moment().tz())) && moment(target.events[i].end).isAfter(moment(this.start).tz(moment().tz()))) {
          if (target.events[i].event_id) {
            //console.log(target.events[i].event_id)
            // collect all length events that can be crossed by new one
            crossedEvents.push(target.events[i].event_id);
          } else {
            // get constant event can be crossed by new one
            constCrossedEvent.push(target.events[i]);
          }
        }
      }
    }
    // cutting events
    if ((moment(this.start).valueOf() < moment().valueOf()) && (moment(this.end).valueOf() > moment().valueOf())) {
      this.start = moment();
    }
    // ask user about overriding events if there are any crossed events
    if (crossedEvents.length || constCrossedEvent.length) {
      this.translate.get('confirm.overrideEvents')
        .subscribe((res: string) => {
          userAnswer = confirm(res);
        });
    }
    if (!this.playConstantly && (new Date(moment(this.start)).getTime() >= new Date(moment(this.end)).getTime())) {
      this.translate.get('errors.endAfterStart')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }
    // edd or replace event
    if (!this.playConstantly && this.start && this.end) {
      // new event isn't constant
      this.addLengthEvent(this.start, this.end, userAnswer, isDevice, crossedEvents, constCrossedEvent);
    } else if (this.playConstantly) {
      // new event is constant
      this.addConstantEvent(userAnswer, isDevice, crossedEvents, constCrossedEvent);
    } else if (this.playAllDay) {
      this.translate.get('errors.bothStartEnd')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }
  }

  private cleanSelections(): void {
    this.selected = undefined;
    this.selectedMedia = undefined;
    this.selectedPlaylist = undefined;
    this.playConstantly = true;
    this.playAllDay = false;
    this.end = undefined;
    this.start = undefined;
    this.dragMedia = null;
    this.event = null;
    this.selectedAllDayToPlay = moment().format('YYYY-MM-DD');
    this.modalService.close(this.newEventModalId);
  }

  public cancel(event): void {
    event.preventDefault();
    this.cleanSelections();
    this.modalService.close(this.newEventModalId);
  }

  public changeScheduleEvent(event: any): void {
    this.event = event;
    if (event.type === targetTypes.device) {
      this.selected = findDeviceByGUID(this.tvs, event.id);
    } else if (event.type === targetTypes.group) {
      this.selected = findGroupById(this.groups, event.id);
    }
    this.playConstantly = !!event.constant_play;
    if (!this.playConstantly) {
      this.start = moment(event.start).format('YYYY-MM-DD') + 'T' + moment(event.start).format('HH:mm');
      this.end = moment(event.end).format('YYYY-MM-DD') + 'T' + moment(event.end).format('HH:mm');
    }
    this.selectedMedia = event.plStatus ? null : getMediaByUrl(this.images, this.videos, this.webPages, event.url);
    this.selectedPlaylist = event.plStatus ? findPlaylistById(this.playlists, event.playlist_id) : null;
    this.modalService.open(this.newEventModalId);
  }

  private editScheduleEvent(event): void {
    this.tvService.updateScheduleEvent(event);
  }

  public startDrag(event, media: any): void {
    this.dragMedia = media;
    event.dataTransfer.setData('dwMedia', JSON.stringify(media));
  }

  private deleteConstantDeviceEvent(device, skip: boolean = false): Observable<any> {
    return this.tvService.addNewSheduleEvent({
      tv: device.guid,
      start: ' ',
      end: ' ',
      media: this.userService.userFallback(),
      media_constantPlay: 'true',
      playFromPlayList: 'false',
      playLocalyStatus: '1',
      playListSelect: '',
      playing_fallback: 1,
      name: device.tv_name,
      location: device.tv_location,
      notes: device.tv_note
    }, skip);
  }

  public deleteScheduleEvent(event: any): void {
    if (event.constant_play) {
      if (event.type === targetTypes.device) {
        let device: IDevice = findDeviceByGUID(this.tvs, event.id);
        this.deleteConstantDeviceEvent(device, false);
      } else if (event.type === targetTypes.group) {
        let group: IGroup = findGroupById(this.groups, event.id);
        this.tvService.updateGroup(Object.assign(group, { URL: this.userService.userFallback(), playlist_id: 0, playing_fallback: 1 }));
      }
    } else { this.deleteLengthEvent(event); }
  }

  private deleteLengthEvent(event: any): void {
    if (event.type === targetTypes.device) {
      let target = this.scheduleDeviceEvents.filter(target => target.guid === event.id);
      if (target.length && target[0].events.length === 1) {
        this.tvService.deleteScheduleEvent(event.event_id, true)
          .subscribe(data => {
            this.deleteConstantDeviceEvent(target[0], true)
              .subscribe(res => {
                this.tvService.getScheduleEvents();
                setTimeout(() => {
                  this.tvService.getAllTVs();
                }, 500)
              })
          })
      } else { this.tvService.deleteScheduleEvent(event.event_id); }
    } else if (event.type === targetTypes.group) {
      let target = this.scheduleGroupEvents.filter(target => target.group_id == event.id);
      if (target.length && target[0].events.length === 1) {
        this.tvService.deleteScheduleEvent(event.event_id, true)
          .subscribe(data => {
            let group: IGroup = findGroupById(this.groups, event.id);
            this.tvService.updateGroup(Object.assign(group, { URL: this.userService.userFallback(), playlist_id: 0, playing_fallback: 1 }), true)
              .subscribe(data => {
                this.tvService.getAllGroups();
                this.tvService.getScheduleEvents();
              })
          })
      } else { this.tvService.deleteScheduleEvent(event.event_id); }
    }
  }

  public newEvent(): void {
    this.modalService.open(this.newEventModalId);
  }

  public assignTo(event): void {
    this.selectedPlaylist = null;
    this.selectedMedia = null;
    if (event.mediaType === mediaTypes.playlist) {
      this.selectedPlaylist = event;
    } else {
      this.selectedMedia = event;
    }
    if (this.selected) {
      this.wiz.next();
      return;
    }
    this.modalService.close(this.newEventModalId);
    if (this.tvs.length || this.groups.length) {
      this.modalService.open(this.targetModal);
    } else {
      this.translate.get('errors.noAvailableDevices')
        .subscribe((res: string) => {
          alert(res);
        });
    }
  }

  public selectTarget(target: any): void {
    this.selected = target;
    this.modalService.close(this.targetModal);
    this.modalService.open(this.newEventModalId);
    setTimeout(() => {
      this.wiz.next();
    }, 0);
  }

  // DON'T USE THIS SHIT, YOPTA
  private removeAllLengthEvents(event: any): void {
    const crossed = [];
    if (event.group_id) {
      crossed.push(this.tvService.updateGroup(Object.assign({}, { id: +event.group_id, name: event.name }, { URL: this.userService.userFallback(), on_schedule: 0, playlist_id: 0, playing_fallback: 1 }), true));
    }
    event.events.forEach(e => {
      crossed.push(this.tvService.deleteScheduleEvent(e.event_id, true));
    })
    Observable.forkJoin(crossed)
      .subscribe(res => {
        this.tvService.getScheduleEvents();
        this.tvService.getAllGroups();
        this.tvService.getAllTVs();
      })
  }

  public clearAllEvents(event): void {
    if (event.guid) {
      if (event.events[0].constant_play) {
        this.deleteConstantDeviceEvent(event, false);
      } else {
        this.removeAllLengthEvents(event);
      }
    } else {
      if (event.events[0].constant_play) {
        this.tvService.updateGroup(Object.assign(event, { URL: this.userService.userFallback(), on_schedule: 0, playlist_id: 0, playing_fallback: 1 }));
      } else {
        this.removeAllLengthEvents(event);
      }
    }
  }

}
