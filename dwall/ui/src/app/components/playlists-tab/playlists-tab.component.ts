import { Component, OnInit, ViewChild, Renderer2 } from '@angular/core';

import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';
import { TranslateService } from '@ngx-translate/core';

import { detectIE, getGroupsWithConstantEvent, getDuration } from '../../shared/functions';

import { Router } from '@angular/router';
import * as moment from 'moment-timezone';

import { IDevice } from '../../interfaces/device';
import { IGroup } from '../../interfaces/group';

import { mediaTypes, colors } from '../../shared/helpers';

declare let Sortable: any;
declare let $: any;

@Component({
  selector: 'app-playlists-tab',
  templateUrl: './playlists-tab.component.html',
  styleUrls: ['./playlists-tab.component.css']
})

export class PlaylistsTabComponent implements OnInit {

  @ViewChild('list') list;

  public playlists: any[];
  private devices: IDevice[];
  private schedules: any[];
  private groups: IGroup[];

  public media: {
    images: any[],
    videos: any[],
    stripes: any[],
    webPages: any[],
    overlays: any[]
  } = { images: null, videos: null, stripes: null, webPages: null, overlays: null };

  // modal windows
  public playlistModalId: string = 'newPlaylistModal';

  public selectedPlaylist: any;

  public searchPlaylist: string = '';

  public newPlaylistMode: boolean = false;

  private dragMedia: any;

  constructor(
    private tvService: TvService,
    private modalService: ModalService,
    private renderer: Renderer2,
    private route: Router,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.tvService.playlists
      .subscribe(playlists => {
        if (Array.isArray(playlists)) {
          let pls = playlists; pls.forEach(pl => {
            pl.media.forEach(media => {
              if ((media.mediaType === mediaTypes.image) && (media.duration === 0)) { media.duration = 10; }
              if ((media.mediaType === mediaTypes.webPage) && (media.duration === 0)) { media.duration = 10; }
            });
            pl.total = this.countDuration(pl);
          });
          this.playlists = pls;
        }
      });

    this.tvService.tvs
      .subscribe((devices: IDevice[]) => { this.devices = devices; })

    this.tvService.scheduleEvents
      .subscribe(events => { this.schedules = events; })

    this.tvService.groups
      .subscribe((groups: IGroup[]) => { this.groups = groups; })

    this.tvService.media
      .subscribe((media: any[] | any) => {
        if (Array.isArray(media)) {
          this.media.images = media.filter((e) => e.mediaType === mediaTypes.image);
          this.media.webPages = media.filter((e) => e.mediaType === mediaTypes.webPage);
          this.media.videos = media.filter((e) => e.mediaType === mediaTypes.video);
          this.media.stripes = media.filter((e) => (e.mediaType === mediaTypes.stripe) || (e.mediaType === mediaTypes.rss));
          this.media.overlays = JSON.parse(JSON.stringify(media.filter((e) => (e.extension === 'png') || e.mediaType === mediaTypes.overlay)));
          this.media.overlays.map((item) => {
            item.mediaType = mediaTypes.overlay;
          });
        }

      });
  }

  public startDrag(event, media: any): void {
    this.dragMedia = Object.assign({}, media);
    event.dataTransfer.setData('dwMedia', JSON.stringify(media));
  }

  public endDrag(event): void {
    $('.drag-placeholder').remove();
  }

  public allowDrop(event): void {
    event.preventDefault();
    if (this.dragMedia && (this.dragMedia.mediaType !== mediaTypes.stripe)
      && (this.dragMedia.mediaType !== mediaTypes.rss)
      && this.dragMedia.mediaType !== mediaTypes.overlay) {
      let created: any = this.renderer.createElement('div');
      let closest: any;
      this.renderer.addClass(created, 'drag-placeholder');
      let elem = document.elementFromPoint(event.clientX, event.clientY);
      let closestIndex = $(elem.closest('.droped')).index();
      if (closestIndex != undefined && closestIndex > -1 && closestIndex <= this.selectedPlaylist.media.length - 1) {
        closest = elem.closest('.droped');
        $('.drag-placeholder').remove();
        this.renderer.insertBefore(closest.parentElement, created, closest)
      }
      this.dragMedia.index = closestIndex;
    }
  }

  public leaveDrag(event): void {
    let drabPlaceholders = $('.drag-placeholder');
    if (this.dragMedia && this.dragMedia.index === -1) { drabPlaceholders.remove(); }
  }

  public dropMedia(event): void {
    $('.drag-placeholder').remove();
    if (this.dragMedia) {
      this.dragMedia.duration = ((this.dragMedia.mediaType === mediaTypes.image || this.dragMedia.mediaType === mediaTypes.webPage) && !this.dragMedia.duration) ? 10 : this.dragMedia.duration;
      if (this.dragMedia.mediaType === mediaTypes.stripe || this.dragMedia.mediaType === mediaTypes.rss) {
        this.selectedPlaylist.stripe_id = this.dragMedia.id;
        //this.selectedPlaylist.stripe_text = this.dragMedia.text;
        this.selectedPlaylist.stripe = this.media.stripes.find((stripe) => stripe.id === this.selectedPlaylist.stripe_id);
        return;
      } else if (this.dragMedia.mediaType === mediaTypes.overlay) {
        this.selectedPlaylist.overlayId = this.dragMedia.id;
        this.selectedPlaylist.overlay = this.media.overlays.find((overlay) => overlay.id === this.selectedPlaylist.overlayId);
      } else {
        let elem = document.elementFromPoint(event.clientX, event.clientY);
        let closestIndex = $(elem.closest('.droped')).index();
        if (closestIndex !== -1) {
          let replaced = this.selectedPlaylist.media[closestIndex];
          this.selectedPlaylist.media.splice(closestIndex, 1, this.dragMedia, replaced);
        } else {
          this.selectedPlaylist.media.push(this.dragMedia);
        }
        this.countPlaylistDuration();
      }
      this.dragMedia = null;
    } else { return; }
  }

  public openAddPlaylistModal(): void {
    this.newPlaylistMode = true;
    this.selectedPlaylist = {
      list_name: '',
      list_note: '',
      media: [],
      stripe_id: 0,
      stripe_color: colors.black,
      stripe_background: colors.white,
      rss_update_interval: 900000,
      total: 0,
      overlayId: 0
    };
    this.countPlaylistDuration();
    this.setSortablePlaylistItems();
    this.modalService.open(this.playlistModalId);
  }

  public cancel(modalId: string): void {
    this.modalService.close(modalId);
    switch (modalId) {
      case this.playlistModalId:
        this.selectedPlaylist = null;
        this.newPlaylistMode = false;
        break;
    }
  }

  public confirmAddMedia(media: any): void {
    if (media.mediaType === mediaTypes.stripe || media.mediaType === mediaTypes.rss) {
      this.selectedPlaylist.stripe_id = media.id;
      //this.selectedPlaylist.stripe_text = media.text;
      this.selectedPlaylist.stripe = this.media.stripes.find((stripe) => stripe.id === this.selectedPlaylist.stripe_id);
    } else if (media.mediaType === mediaTypes.overlay) {
      this.selectedPlaylist.overlayId = media.id;
      this.selectedPlaylist.overlay = this.media.overlays.find((overlay) => overlay.id === this.selectedPlaylist.overlayId);
    } else {
      media.duration = ((media.mediaType === mediaTypes.image || media.mediaType === mediaTypes.webPage ) && !media.duration) ? 10 : media.duration;

      this.selectedPlaylist.media.push(Object.assign({}, media));
      this.countPlaylistDuration();
    }
  }

  public countPlaylistDuration(): void {
    this.selectedPlaylist.total = this.countDuration(this.selectedPlaylist);
  }

  private countDuration(playlist: any) {
    return getDuration.bind(this, playlist)();
  }

  public submitPlaylistForm(): void {
    if (!this.selectedPlaylist.media.length && this.selectedPlaylist.stripe_id) {
      this.translate.get('errors.playlistOnlyStripeErr')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }
    if (this.newPlaylistMode) {
      this.createPlaylist();
    } else {
      this.updatePlaylist();
    }
    this.selectedPlaylist
    this.newPlaylistMode = false;
    this.modalService.close(this.playlistModalId);
  }

  private createPlaylist(): void {
    this.tvService.createPlayList(this.selectedPlaylist);
  }

  private updatePlaylist(): void {
    if (!this.selectedPlaylist.media.length && this.selectedPlaylist.stripe_id) {
      this.translate.get('errors.playlistOnlyStripeErr')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    }
    this.tvService.updatePlaylist(this.selectedPlaylist, false);
  }

  public changeRssInterval(interval: number): void {
    this.selectedPlaylist.update_interval = interval;
  }

  public setColors(colors: any) {
    this.selectedPlaylist.stripe_color = colors.text;
    this.selectedPlaylist.stripe_background = colors.background;
  }

  public addMediaToPlaylistModal(playlist: any): void {
    this.selectedPlaylist = JSON.parse(JSON.stringify(playlist));
    this.selectedPlaylist.stripe = this.media.stripes.find((stripe) => stripe.id === playlist.stripe_id);
    this.selectedPlaylist.overlay = this.media.overlays.find((overlay) => overlay.id === playlist.overlayId);
    this.modalService.open(this.playlistModalId);
    this.countPlaylistDuration();
    this.setSortablePlaylistItems();
  }

  private setSortablePlaylistItems(): void {
    setTimeout(() => {
      Sortable.create(this.list.nativeElement, {
        filter: '.ignore-elements', animation: 150,
        onEnd: function (event) {
          let elem = this.selectedPlaylist.media[event.oldIndex];
          this.selectedPlaylist.media.splice(event.oldIndex, 1);
          this.selectedPlaylist.media.splice(event.newIndex, 0, elem);
        }.bind(this)
      });
    }, 0);
  }

  private isPlayListInUse(id: string | number): boolean {
    let isInUse: boolean = false;
    // check devices with assigned constant events for playling choosen playlist
    this.devices.forEach((device: IDevice) => {
      if (device.playlists_status && (device.playlist_id == id) && device.constant_play) { isInUse = true; }
    })
    // get groups playing constant events
    let constPlayGroups: IGroup[] = getGroupsWithConstantEvent(this.schedules, this.groups);
    // check all groups with constant events to play this playlist
    if (Array.isArray(constPlayGroups)) {
      constPlayGroups.forEach((group: IGroup) => {
        if (group.playlist_id == id) { isInUse = true; }
      })
    }
    // check all schedules for playing this playlist
    this.schedules.forEach(schedule => {
      schedule.events.forEach(event => {
        if ((event.playlist_id == id) && moment(event.end).valueOf() >= moment().valueOf()) { isInUse = true; }
      })
    })
    return isInUse;
  }

  public deletePlaylist(event: any, id: string | number): void {
    event.preventDefault();
    let approve: boolean = false;
    if (this.isPlayListInUse(id)) {
      this.translate.get('errors.canNotDeletePL')
        .subscribe((res: string) => {
          alert(res);
        });
      return;
    } else {
      this.translate.get('confirm.deletePL')
        .subscribe((res: string) => {
          approve = confirm(res);
        });
      if (approve) {
        this.tvService.deletePlaylist(id);
      } else { return; }
    }
    this.modalService.close(this.playlistModalId);
  }

  public deleteMedia(media): void {
    let index: number = this.selectedPlaylist.media.findIndex((e) => e.id === media.id);
    this.selectedPlaylist.media.splice(index, 1);
    this.countPlaylistDuration();
  }

  public goToMediaTab(event): void {
    event.preventDefault();
    this.route.navigate(['/main/media'], { queryParams: { openModal: true } });
  }

  public deleteStripe(): void {
    this.selectedPlaylist.stripe_id = 0;
  }

  public deleteOverlay(): void {
    this.selectedPlaylist.overlayId = 0;
  }

}
