import { Directive, ElementRef, OnInit, Input } from '@angular/core';

import { UserService } from '../../services/user/user.service';
import { TvService } from '../../services/tv/tv.service';

import { findPlaylistById, getMediaByUrl, findEventById } from '../../shared/functions';
import { mediaTypes } from '../../shared/helpers';

import { Observable } from 'rxjs/Observable';

import "rxjs/add/observable/combineLatest";
import 'rxjs/add/operator/delay';

@Directive({
  selector: '[detectDeviceContent]'
})
export class DetectDeviceContentDirective implements OnInit {

  @Input() target: any;
  private media: any[] = [];
  private playlists: any[];
  private schedules: any[];
  private fallback: any;

  constructor(
    private el: ElementRef,
    private userService: UserService,
    private tvService: TvService
  ) { }

  ngOnInit() {
    Observable.combineLatest(this.userService.fallback, this.tvService.scheduleEvents, this.tvService.playlists, this.tvService.media)
      .subscribe(data => {
        this.fallback = data[0];
        this.schedules = data[1];
        this.playlists = Array.isArray(data[2]) ? data[2] : [];
        this.media = Array.isArray(data[3]) ? data[3] : [];
        this.defineContent();
      })
  }

  private defineContent(): void {
    let content: string = '';
    let media: any;
    if (this.target.playing_fallback) {
      content = (this.fallback && this.fallback.name) ? this.fallback.name : 'fallback';
    } else if (this.target.constant_play && this.target.url && !this.target.on_schedule && !this.target.playlists_status) {
      media = getMediaByUrl(this.media.filter(e => e.mediaType === mediaTypes.image), this.media.filter(e => e.mediaType === mediaTypes.video), this.media.filter(e => e.mediaType === mediaTypes.webPage), this.target.url);
      content = media ? media.name : '';
    } else if (this.target.constant_play && this.target.playlists_status && this.target.playlist_id && !this.target.on_schedule) {
      media = findPlaylistById(this.playlists, this.target.playlist_id);
      content = media ? media.list_name : '';
    } else if (this.target.on_schedule) {
      let eventTarget = this.schedules.find(e => e.tv_guid == this.target.guid);
      let currentEvent;
      if (eventTarget) {
        currentEvent = eventTarget.events.find(e => {
          return (new Date(e.start).valueOf() <= new Date().valueOf() && new Date(e.end).valueOf() >= new Date().valueOf());
        });
      }
      if (currentEvent) {
        if (currentEvent.playlist_id) {
          media = findPlaylistById(this.playlists, currentEvent.playlist_id);
          content = media ? media.list_name : '';
        } else if (currentEvent.URL) {
          media = this.media.find(media => media.url == currentEvent.URL);
          content = media ? media.name : '';
        }
      } else {
        content = (this.fallback && this.fallback.name) ? this.fallback.name : 'fallback';
      }
    } else {
      content = (this.fallback && this.fallback.name) ? this.fallback.name : 'fallback';
    }
    this.el.nativeElement.innerHTML = content;
  }


}
