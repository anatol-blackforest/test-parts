import { Injectable } from '@angular/core';
import { HttpEventType, HttpClient, HttpRequest } from '@angular/common/http';
import { Response, RequestOptions, Jsonp } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { UserService } from '../user/user.service';

import { NoCacheHttpInterceptor } from '../../interceptors/no-cache-http/tv-http.interceptor';

import { IDevice } from '../../interfaces/device';
import { IGroup } from '../../interfaces/group';

import { dWallDefaultFallback } from '../../shared/helpers';

import { map } from 'rxjs/operators';

import 'rxjs/add/observable/forkJoin';

declare let $: any;

@Injectable()
export class TvService {

  public url = '';

  public _tvs: BehaviorSubject<IDevice[]>;
  public tvs: Observable<IDevice[]>;

  public _media: BehaviorSubject<any[]>;
  public media: Observable<any[]>;

  public _playlists: BehaviorSubject<any[]>;
  public playlists: Observable<any[]>;

  public _groups: BehaviorSubject<IGroup[]>;
  public groups: Observable<IGroup[]>;

  public _scheduleEvents: BehaviorSubject<any[]>;
  public scheduleEvents: Observable<any[]>;

  public _uploadingProgress: BehaviorSubject<any>;
  public uploadingProgress: Observable<any>;

  public _stats: BehaviorSubject<any>;
  public stats: Observable<any>;

  public state: any = {};

  constructor(
    private http: NoCacheHttpInterceptor,
    private httpClient: HttpClient,
    private userService: UserService,
    private jsonp: Jsonp
  ) {
    this._tvs = <BehaviorSubject<IDevice[]>>new BehaviorSubject(null);
    this.tvs = this._tvs.asObservable();

    this._media = <BehaviorSubject<any[]>>new BehaviorSubject(null);
    this.media = this._media.asObservable();

    this._playlists = <BehaviorSubject<any[]>>new BehaviorSubject(null);
    this.playlists = this._playlists.asObservable();

    this._groups = <BehaviorSubject<IGroup[]>>new BehaviorSubject([]);
    this.groups = this._groups.asObservable();

    this._scheduleEvents = <BehaviorSubject<any[]>>new BehaviorSubject([]);
    this.scheduleEvents = this._scheduleEvents.asObservable();

    this._stats = <BehaviorSubject<any[]>>new BehaviorSubject([]);
    this.stats = this._stats.asObservable();
  }

  public getAllTVs(): void {
    this.http.get(this.url + 'devices')
      .map((response: Response) => response.json())
      .subscribe((data: IDevice[]) => {
        this.state.tvs = data;
        this._tvs.next(Object.assign({}, this.state).tvs);
        this.getDeviceStatuses();
        this.userService.getUsersLicence();
      })
  }

  private setGroupsTvListArray(groups: any[] = [], device: any[] = []) {
    groups.forEach(group => {
      let guidArray = Object.keys(group.tvList);
      let tvList = [];
      guidArray.forEach((guid: string) => {
        for (let i = 0; i < device.length; i++) {
          if (device[i].guid === guid) {
            tvList.push(device[i]);
          }
        }
      });
      group.deviceList = tvList;
    });
    return groups;
  }

  public getAllGroups(skipSubscripthion: boolean = false): Observable<any> {
    let sub = this.http.get(this.url + 'tv/myGroups')
      .map((response: Response) => response.json())
    if (skipSubscripthion) { return sub; }
    Observable.combineLatest(sub, this.tvs)
      .subscribe(data => {
        let groupsArray = Object.keys(data[0])
          .map((key) => { return data[0][key]; });
        this.state.groups = data[1] ? this.setGroupsTvListArray(groupsArray, data[1]) : [];
        this._groups.next(Object.assign({}, this.state).groups);
      })
  }

  public deleteWepPage(id: number): void {
    this.http.delete(this.url + 'media/page/' + id)
      .subscribe(data => {
        this.getAllMedia();
      })
  }

  public updateWebPage(id: number, webPage: any): void {
    this.http.patch(this.url + 'media/page/' + id, webPage)
      .subscribe(data => {
        this.getAllMedia();
      })
  }

  public addWebPage(data: any): void {
    this.http.post(this.url + 'media/page', data)
      .subscribe(data => {
        this.getAllMedia();
      })
  }

  public getAllMedia(): void {
    this.http.get(this.url + 'tv/video/myVideo')
      .map((response: any) => response.json())
      .subscribe((media: any) => {
        this.state.media = media.filter(item => item.url !== dWallDefaultFallback);
        this._media.next(Object.assign({}, this.state).media);
        this.userService.getAllUserData();
      })
  }

  public getAllPlaylists(): void {
    this.http.get(this.url + 'tv/myPlayLists')
      .map((response: any) => response.json())
      .subscribe((playlists: any) => {
        this.state.playlists = playlists;
        this._playlists.next(Object.assign({}, this.state).playlists);
      })
  }

  public removeTv(guid): any {
    this.http.delete(this.url + `devices/${guid}`)
      .map((response: Response) => response.json())
      .subscribe((data: any) => {
        this.getAllTVs();
        this.getAllGroups();
        this.getScheduleEvents();
      });
  }

  /*public editTv(tv: any) {
    this.http.post(this.url + 'tv/update', tv)
      .subscribe((data: any) => {
      })
  }*/

  public addTv(tv: any) {
    this.http.post(this.url + 'devices', tv)
      .map((response: Response) => response.json())
      .subscribe((data: any) => {
        this.getAllTVs();
      }, (err) => {
        alert('Error while adding new device');
      })
  }

  public loadFromYouTube(url: string, name: string, note: string): any {
    this._uploadingProgress = <BehaviorSubject<any>>new BehaviorSubject({
      selectedType: 'youTube',
      isLoading: true,
      percentage: 0,
      image: false,
      video: true
    });
    this.uploadingProgress = this._uploadingProgress.asObservable().share();
    let post = this.http.post(this.url + 'tv/video/loadFromYouTube', { url, name, note })
      .map((response: Response) => response.json())
      .share()
    post.subscribe((data: any) => {
      this.getAllMedia();
      this._uploadingProgress.next({
        isLoading: false,
        percentage: 0,
        image: false,
        video: false
      });
      //this._uploadingProgress.complete();
    }, (err) => {
      let errorMsg: string;
      if (err.status === 507) {
        errorMsg = 'There is not enough space to download this file(s). To increase Storage please contact us at info@dwall.online';
      } else {
        errorMsg = 'Something went wrong. Please check Internet connection, YouTube link and try again later';
      }
      this._uploadingProgress.next({
        isLoading: false,
        percentage: '',
        image: false,
        video: false
      });
      //this._uploadingProgress.complete();
      setTimeout(() => {
        alert(errorMsg);
      }, 100)
    })
    return post;
  }

  public saveMediaStripe(stripe: string, name: string, note: string = '') {
    this.http.post(this.url + 'tv/addStripe', { text: stripe, name, note })
      .subscribe((data: any) => {
        this.getAllMedia();
      });
  }

  public saveMediaOverlay(overlay: string, name: string, note: string = '') {

    this.http.post(this.url + 'media/overlay', {
      'mediaName': name,
      'note': note,
      'html': overlay
    }).subscribe((data: any) => {
      this.getAllMedia();
    });

  }

  public loadLocalFiles(files: any[]): Observable<any> {
    let progressCount: any = {};
    let totalUploaded = 0;
    let total: number = 0;
    files.forEach((file: any) => {
      total += file.size;
    })
    this._uploadingProgress = <BehaviorSubject<any>>new BehaviorSubject(null);
    this.uploadingProgress = this._uploadingProgress.asObservable();
    let observables = [];
    files.forEach((file: any) => {
      const request = new HttpRequest('POST', `tv/video/localMeidaUpload?${file.fileName}&${file.fileNote}`, file.form, {
        reportProgress: true
      });
      let httpRequest = this.httpClient.request(request).share();
      observables.push(httpRequest)
    })
    observables.forEach((request, index) => {
      request.index = index;
      progressCount[index.toString()] = 0;
      request.subscribe(data => {
        if (data.loaded && (data.loaded > progressCount[index.toString()])) {
          progressCount[index.toString()] = data.loaded;
        }
        totalUploaded = 0;
        Object.keys(progressCount).forEach(key => {
          totalUploaded += progressCount[key];
        })
        this._uploadingProgress.next({
          selectedType: 'file',
          isLoading: true,
          percentage: Math.round(100 * (totalUploaded / total)),
          image: true,
          video: true
        });
      }, (err) => {
        return err;
      })
    })
    return Observable.forkJoin(observables);
  }

  public updateGroup(group, skip: boolean = false): Observable<any> {
    let observable = this.http.post('tv/addInfoToGroup',
      {
        groupId: group.id,
        name: group.name,
        URL: group.URL,
        playlist_id: group.playlist_id,
        playing_fallback: group.playing_fallback
      })
    if (skip) return observable;
    observable.subscribe((data: any) => {
      this.getAllGroups();
    })
  }

  public addNewSheduleEvent(event, skip: boolean = false) {
    let observable = this.http.post(this.url + 'tv/video/sheduleMedia', event);
    if (skip) return observable;
    observable.subscribe((data) => {
      setTimeout(() => {
        this.getAllTVs();
      }, 500)
    })
  }

  public updateScheduleEvent(event) {
    return this.http.put(this.url + 'tv/schedule', event)
      .subscribe((data) => {
        this.getScheduleEvents();
      })
  }

  public addLengthScheduleEvent(schedule) {
    this.http.post(this.url + 'tv/schedule', { schedule: JSON.stringify([schedule]) })
      .subscribe((data: any) => {
        this.getScheduleEvents();
        this.getAllTVs();
        this.getAllGroups();
      })
  }

  public addStripeToPlaylist(data) {
    this.http.post(this.url + 'tv/addStripeToPlayList', data)
      .subscribe((data: any) => {
        this.getAllPlaylists();
      })
  }

  public createPlayList(playlists): void {
    this.http.post(this.url + 'tv/video/createPlayList', playlists)
      .subscribe(data => {
        this.getAllPlaylists();
      })
  }

  public updatePlaylist(playlistData, skipSubscription: boolean = false): Observable<any> {
    let sub = this.http.post(this.url + 'tv/video/updatePlayList', { data: JSON.stringify(playlistData) });
    if (skipSubscription) {
      return sub;
    }
    sub.subscribe((playlists: any) => {
      this.getAllPlaylists();
    })
  }

  public setStripeColors(playListId, stripeColor, backgroundColor, stripeId): Observable<any> {
    let sub = this.http.post(this.url + 'tv/setStripeColors', {
      playList: playListId,
      stripe_color: stripeColor,
      stripe_bg: backgroundColor,
      stripeID: stripeId
    }).share();
    sub.subscribe((data) => {
      this.getAllPlaylists();
    });
    return sub;
  }

  public deletePlaylist(id: string | number) {
    this.http.post(this.url + 'tv/video/deletePlayList', { listID: id })
      .subscribe((data) => {
        this.getAllPlaylists();
      })
  }

  public removeStripe(stripeId: number | string) {
    this.http.post(this.url + 'tv/removeUrl', { url: stripeId })
      .subscribe((data) => {
        this.getAllMedia();
      })
  }

  public removeVideoUrl(url: string) {
    this.http.post(this.url + 'tv/removeUrl', { url })
      .subscribe((data) => {
        this.getAllMedia();
        this.getAllGroups();
        this.getAllTVs();
        this.getAllPlaylists();
      })
  }

  public updateTv(device, skip: boolean = false): Observable<any> {
    let observable = this.http.patch(`devices/${device.guid}`, device)
    if (skip) return observable;
    observable.subscribe((data) => {
      this.getAllTVs();
      this.getAllGroups();
    })
  }

  public addDevicesToGroup(groupId: string, guid: string, skipSubscription: boolean = false): Observable<any> {
    let sub = this.http.post(this.url + 'tv/addTVtoGroup', { group_id: groupId, GUID: guid })
    if (skipSubscription) return sub;
    sub.subscribe((data) => {
      this.getAllGroups();
    });
  }

  public removeDeviceFromGroup(groupId, guid) {
    this.http.post(this.url + 'tv/removeTVfromGroup', { group_id: groupId, GUID: guid })
      .subscribe((data) => {
        this.getAllGroups();
      })
  }

  public createDeviceGroup(name): Observable<any> {
    let sub = this.http.post(this.url + 'tv/createGroup', { name });
    /*sub.subscribe((data: any) => {
      this.getAllGroups();
    })*/
    return sub;
  }

  public removeDeviceGroup(groupId) {
    this.http.post(this.url + 'tv/deleteGroup', { groupId })
      .subscribe((data) => {
        this.getAllGroups();
        this.getScheduleEvents();
      })
  }

  public deleteScheduleEvent(scheduleId: number | string, skip: boolean = false): Observable<any> {
    let obs = this.http.delete(this.url + 'tv/schedule', new RequestOptions({
      body: { schedule: JSON.stringify([{ id: scheduleId }]) }
    }))
    if (skip) return obs;
    obs.subscribe((data) => {
      this.getScheduleEvents();
      this.getAllGroups();
      this.getAllTVs();
    });
    return obs;
  }

  public updateMediaRecords(mediaId: number | string, newName: string, newNote: string) {
    this.http.post(this.url + 'tv/updateMediaRecords', {
      id: mediaId,
      newName,
      newNote
    }).subscribe((data) => {
      this.getAllMedia();
      this.getAllPlaylists();
    })
  }

  public updateStripeText(id: number | string, newText: string) {
    this.http.post(this.url + 'tv/updateStripeText', { id, newText })
      .subscribe((data) => {
        //this.getAllMedia();
      })
  }

  public getScheduleEvents() {
    this.http.get(this.url + 'tv/schedule')
      .map((response: any) => response.json())
      .subscribe((events: any[]) => {
        if (events.length) {
          let brokenIndex = events.findIndex((e) => {
            return ((e.group_id == 'null' && e.tv_guid == null) || (e.group_id == null && e.tv_guid == 'null'))
          });
          if (brokenIndex !== -1) {
            events.splice(brokenIndex, 1);
          }
          this.state.scheduleEvents = events;
          this._scheduleEvents.next(Object.assign({}, this.state).scheduleEvents);
        } else {
          this.state.scheduleEvents = [];
          this._scheduleEvents.next(Object.assign({}, this.state).scheduleEvents);
        }
      })
  }


  public getDeviceStatuses(): Observable<any> {
    let request = this.http.get(this.url + 'helpers/status')
      .map(res => res.json())
      .share();
    request.subscribe((statuses: any[]) => {
      this._stats.next(statuses);
    }, (err) => {
      this._stats.next({ status: 0 });
      this._stats.next([]);
    });
    return request;
  }

  public addRss(url, mediaName, note = ''): void {
    this.http.post(this.url + 'media/rss', { url, mediaName, note })
      .subscribe(data => {
        this.getAllMedia();
      }, err => {
        alert('Error while adding rss');
      })
  }

  public removeRss(id): void {
    this.http.delete(this.url + `/media/rss/${id}`)
      .subscribe(data => {
        this.getAllMedia();
      });
  }

  public updateRss(id, url, name, note): void {
    this.http.put(this.url + 'media/rss', { id, url, name, note })
      .subscribe(data => {
        this.getAllMedia();
      })
  }

  public updateRssInterval(id, interval): void {
    this.http.put(this.url + 'media/rssInterval', {
      id,
      interval
    }).subscribe(data => {

    })
  }

  public rss(url: string): Observable<any> {
    return this.http.post('tv/testrss', { url });
  }

  public removeOverlay(id): void {
    this.http.delete(this.url + `/media/overlay/${id}`).subscribe(data => {
      this.getAllMedia();
    });
  }

  public checkUrlForPreview(url: string) {
    return this.httpClient.post('tv/checkUrl', { url }).share();
  }
}
