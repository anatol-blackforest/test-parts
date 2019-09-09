import { Component, OnInit, ViewChild } from '@angular/core';
import { URLSearchParams } from "@angular/http";
import { TranslateService } from '@ngx-translate/core';

import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';
import { UserService } from '../../services/user/user.service';

import { getGroupsWithConstantEvent, detectIE } from '../../shared/functions';
import { mediaTypes } from '../../shared/helpers';
import { Router, ActivatedRoute } from '@angular/router';

declare let $: any;

import * as moment from 'moment-timezone';

import { IDevice } from '../../interfaces/device';
import { IGroup } from '../../interfaces/group';

@Component({
  selector: 'app-media-tab',
  templateUrl: './media-tab.component.html',
  styleUrls: ['./media-tab.component.css']
})
export class MediaTabComponent implements OnInit {

  public uploadMediaModalId: string = 'uploadMediaModalId';
  public mediaPreviewModalId: string = 'mediaPreview';

  public editMode: boolean = false;
  public loading: {
    isLoading: boolean,
    percentage: string,
    image: boolean,
    video: boolean
  } = { isLoading: false, percentage: '', image: false, video: false };

  public mediaName: string;
  public mediaNote: string;
  public newMedia: any;
  public selectedType: string;

  public selectedMedia: any;

  public searchMedia: string = '';

  @ViewChild('form') form;

  public activeTab: string = 'video';

  public media: { images: any[], videos: any[], stripes: any[], webPages: any[], overlays: any[] } = { images: null, videos: null, stripes: null, webPages: null, overlays: null };
  private playlists: any[];
  private devices: IDevice[];
  private groups: IGroup[];
  private scheduleEvents: any[];

  public userData: any;

  public urlCanBePreviewed = false;
  public isFetching = false;
  public isCodeValid = true;

  constructor(
    private tvService: TvService,
    private modalService: ModalService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) { }

  ngOnInit() {

    try {
      const loading = this.tvService._uploadingProgress.getValue();
      this.parseLoadingDTO(loading);
      if (loading && loading.percentage === 100) {
        this.tvService._uploadingProgress.complete();
        this.stopLoading();
      }
    } catch (e) {

    }

    const sub = this.tvService.uploadingProgress && this.tvService.uploadingProgress
      .subscribe(loading => {
        this.parseLoadingDTO(loading);
        if (loading && loading.percentage === 100) {
          sub && sub.unsubscribe();
          this.tvService._uploadingProgress.complete();
          this.stopLoading();
        }
      });

    this.tvService.media
      .subscribe((media: any[] | any) => {
        if (Array.isArray(media)) {
          this.media.images = media.filter((e) => e.mediaType === mediaTypes.image);
          this.media.webPages = media.filter((e) => e.mediaType === mediaTypes.webPage);
          this.media.videos = media.filter((e) => e.mediaType === mediaTypes.video);
          this.media.stripes = media.filter((e) => (e.mediaType === mediaTypes.stripe) || (e.mediaType === mediaTypes.rss));
          this.media.overlays = media.filter((e) => e.mediaType === mediaTypes.overlay).concat(this.media.images.filter((e) => (e.extension === 'png')));
        }
      });

    this.tvService.playlists
      .subscribe((playlists: any[]) => { this.playlists = playlists; });

    this.tvService.tvs
      .subscribe((devices: IDevice[]) => { this.devices = devices; });

    this.tvService.groups
      .subscribe((groups: IGroup[]) => { this.groups = groups; });

    this.tvService.scheduleEvents
      .subscribe((events: any[]) => { this.scheduleEvents = events; })

    this.userService.userData
      .subscribe(data => {
        if (data) { this.userData = data; }
      });

    this.route.queryParams.subscribe(params => {
      if (params.openModal) {
        const self = this;
        setTimeout(() => {
          self.openUploadMediaModal();
        }, 0);
        const cleartUrl = window.location.pathname.split('?')[0];
        this.router.navigate([cleartUrl], { preserveQueryParams: false });
      }
    });
  }

  private parseLoadingDTO(loading: any): void {
    this.loading.percentage = loading.percentage ? loading.percentage.toString() : 'loading...';
    this.loading.image = loading.image;
    this.loading.video = loading.video;
    this.loading.isLoading = loading.isLoading;
    this.selectedType = loading.selectedType;
  }

  public openUploadMediaModal(): void {
    this.modalService.open(this.uploadMediaModalId);
  }

  public fileChange(event, fileType): boolean | void {
    if (!event) {
      this.selectedType = undefined;
    } else {
      this.selectedType = fileType;
      switch (fileType) {
        case mediaTypes.file:
          if (!event.target.files.length && this.newMedia) return false;
          for (let i = 0; i < event.target.files.length; i++) {
            if ((event.target.files[i].type == 'image/gif') || (event.target.files[i].type == 'image/svg+xml') || (!(event.target.files[i].type.startsWith('image')) && !(event.target.files[i].type.startsWith('video')))) {
              this.translate.get('errors.imagesAndVideoOnly')
                .subscribe((res: string) => {
                  alert(res);
                });
              this.resetFormFields();
              return;
            }
          }
          this.newMedia = Array.prototype.slice.call(event.target.files);
          this.newMedia.forEach((media: any) => {
            media.mediaNote = '';
            media.mediaName = media.name.slice(0, media.name.lastIndexOf('.'));
          });
          if (this.newMedia.some(media => !(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-\s]+$/g.test(media.name)))) {
            this.translate.get('errors.notLatinChars')
              .subscribe((res: string) => {
                alert(res);
              });
            this.resetFormFields();
          }
          break;
        case mediaTypes.youTube:
          this.newMedia = event;
          this.mediaName = '';
          break;
        case mediaTypes.stripe:
          this.newMedia = event;
          this.mediaNote = '';
          break;
        case mediaTypes.overlay:
          this.newMedia = event;
          this.mediaNote = '';
          break;
        case mediaTypes.webPage:
          this.newMedia = event;
          this.mediaNote = '';
          break;
        case mediaTypes.rss:
          this.newMedia = event;
          this.mediaNote = '';
          setTimeout(() => {
            this.testRss($('.marquee'), this.newMedia);
          }, 0)
          break;
        default:
          this.selectedType = undefined;
      }
    }
  }

  private testRss(marquee, url: string): void {
    marquee.text('');
    if (new RegExp('^https?://.+').test(url)) {
      this.loading.isLoading = true;
      this.tvService.rss(url)
        .subscribe(rss => {
          this.loading.isLoading = false;
          let stripe;
          try {
            stripe = JSON.parse(rss._body);
            stripe = this.parseRSS(JSON.parse(rss._body));
          } catch (err) {
            stripe = null;
          }
          if (stripe) {
            marquee.text(stripe);
            marquee.css('color', 'black');
            $('.marquee').marquee({
              speed: 70,
              delayBeforeStart: 100
            });
          } else {
            this.translate.get('media.rssIsNotFound')
              .subscribe((res: string) => {
                marquee.text(res).css('color', 'red');
              });
          }
        }, err => {
          this.loading.isLoading = false;
          this.translate.get('media.rssIsNotFound')
            .subscribe((res: string) => {
              marquee.text(res).css('color', 'red');
            });
        })
    }
  }

  public rssChange(event): void {
    this.testRss($('.marquee'), this.newMedia);
  }

  private parseRSS(rss: any): string {
    let formatted = [];
    let formatedStripe = '';
    rss.channel[0].item.forEach(el => {
      let rssItem: any = {};
      if (el.hasOwnProperty('title')) { rssItem.title = el.title[0].replace(/<(.|\n)*?>/g, ''); }
      if (el.hasOwnProperty('description')) { rssItem.description = el.description[0].replace(/<(.|\n)*?>/g, ''); }
      formatted.push(rssItem);
    })
    for (let i = 0; i < formatted.length; i++) {
      let prev: string = formatedStripe;
      formatedStripe += Object.keys(formatted[i]).map(e => formatted[i][e]).join('. ').concat('; ');
      if (formatedStripe.length > 1700) {
        formatedStripe = prev;
        break;
      }
    }
    return formatedStripe;
  }

  private checkForIncludingMediaType(files: any[], checkForType: string): boolean {
    let result: boolean = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith(checkForType)) {
        result = true;
        break;
      }
    }
    return result;
  }

  public closeModal(modalId: string): void {
    this.isCodeValid = true;

    this.modalService.close(modalId);
    switch (modalId) {
      case this.uploadMediaModalId:
        this.resetFormFields();
        this.modalService.close(this.uploadMediaModalId);
        break;
      case this.mediaPreviewModalId:
        this.resetUpdatingMedia();
      default:
        break;
    }
  }

  public cancel(): void {
    this.isCodeValid = true;
    this.resetFormFields();
    this.modalService.close(this.uploadMediaModalId);
  }

  public update(): void {
    this.modalService.close(this.mediaPreviewModalId);
    if (this.selectedMedia.mediaType === mediaTypes.stripe && this.newMedia !== this.selectedMedia.text) {
      this.tvService.updateStripeText(this.selectedMedia.stripe_id, this.newMedia);
    } else if (this.selectedMedia.mediaType === mediaTypes.rss) {
      this.tvService.updateRss(this.selectedMedia.id, this.newMedia, this.mediaName, this.mediaNote);
      this.resetUpdatingMedia();
      return;
    } else if (this.selectedMedia.mediaType === mediaTypes.webPage) {
      this.tvService.updateWebPage(this.selectedMedia.id, {
        url: this.newMedia,
        mediaName: this.mediaName,
        note: this.mediaNote
      });
      return;
    }
    this.tvService.updateMediaRecords(this.selectedMedia.id, this.mediaName, this.mediaNote);
    this.resetUpdatingMedia();
  }


  private canMediaBeDeleted(id: string | number, url: string): boolean {
    let cantBeDeleted: boolean = false;
    if (this.userData.fallback_media == id) {
      cantBeDeleted = true;
    }
    this.playlists.forEach((playlist: any) => {
      if (playlist.stripe_id == id) { cantBeDeleted = true; }
      if (playlist.overlayId == id) { cantBeDeleted = true; }
      playlist.media.forEach(playlistMedia => {
        if (playlistMedia.id == id) { cantBeDeleted = true; }
      });
    })
    this.devices.forEach((device: IDevice) => {
      if ((device.url === url) && !device.on_schedule) { cantBeDeleted = true; }
    })
    this.scheduleEvents.forEach((scheduleEvent: any) => {
      scheduleEvent.events.forEach((e: any) => {
        if (e.URL == url && (moment(e.end).valueOf() >= moment().valueOf())) { cantBeDeleted = true; }
      })
    })
    getGroupsWithConstantEvent(this.scheduleEvents, this.groups).forEach((group: IGroup) => {
      if (group.URL == url) { cantBeDeleted = true; }
    })
    if (cantBeDeleted) {
      this.translate.get('errors.canNotDelete')
        .subscribe((res: string) => {
          alert(res);
        });
    };
    return !cantBeDeleted;
  }

  public deleteMedia(media: any): boolean {
    if (media.mediaType === mediaTypes.stripe) {
      if (this.canMediaBeDeleted(media.id, '')) {
        this.tvService.removeVideoUrl(media.id);
      }
    } else if (media.mediaType === mediaTypes.rss) {
      if (this.canMediaBeDeleted(media.id, '')) {
        this.tvService.removeRss(media.id);
      }
    } else if (media.mediaType === mediaTypes.webPage) {
      if (this.canMediaBeDeleted(media.id, media.url)) {
        this.tvService.deleteWepPage(media.id);
      }
    } else if (media.mediaType === mediaTypes.overlay) {
      if (this.canMediaBeDeleted(media.id, '')) {
        this.tvService.removeOverlay(media.id);
      }
    } else if (this.canMediaBeDeleted(media.id, media.url)) {
      this.tvService.removeVideoUrl(media.url);
    }

    this.modalService.close(this.mediaPreviewModalId);
    this.resetUpdatingMedia();

    return false;
  }

  private resetUpdatingMedia(): void {
    this.editMode = false;
    this.selectedMedia = null;
    this.mediaNote = null;
    this.newMedia = null;
    this.mediaName = null;
  }

  public enableEditing(): void {
    this.editMode = true;
    this.mediaNote = this.selectedMedia.note;
    this.mediaName = this.selectedMedia.name;
    if (this.selectedMedia.mediaType === mediaTypes.stripe || this.selectedMedia.mediaType === mediaTypes.rss) {
      this.newMedia = this.selectedMedia.text || this.selectedMedia.url;
    } else if (this.selectedMedia.mediaType === mediaTypes.webPage) {
      this.newMedia = this.selectedMedia.url;
    }
  }

  public closeMediaPreview(event): void {
    event.preventDefault();
    this.modalService.close(this.mediaPreviewModalId);
    this.resetUpdatingMedia();
  }

  public cancelUpdate(event): void {
    if (this.selectedMedia.mediaType == mediaTypes.rss) { this.testRss($('.marquee'), this.selectedMedia.url); }
    this.editMode = false;
    this.mediaNote = null;
    this.newMedia = null;
    this.mediaName = null;
  }

  public addNewMedia(event): void {
    event.preventDefault();
    let sub;
    switch (this.selectedType) {
      case mediaTypes.youTube:
        let url = this.newMedia.replace(/\s/g, '');
        this.loading.isLoading = true;
        this.tvService.loadFromYouTube(url, this.mediaName, this.mediaNote)
          .subscribe((data) => {
            this.stopLoading();
          }, (err) => {
            this.stopLoading();
          })
        sub = this.tvService.uploadingProgress
          .subscribe((data: any) => {
            this.translate.get('media.loading')
              .subscribe((res: any) => {
                this.loading.percentage = res.concat('...');
              });
          }, (err) => {
            this.loading.isLoading = false;
          }, () => {
            this.loading.isLoading = false;
          });
        this.modalService.close(this.uploadMediaModalId);
        break;
      case mediaTypes.webPage:
        this.tvService.addWebPage({
          url: this.newMedia,
          mediaName: this.mediaName,
          note: this.mediaNote
        });
        this.resetFormFields();
        this.modalService.close(this.uploadMediaModalId);
        break;
      case mediaTypes.stripe:
        this.tvService.saveMediaStripe(this.newMedia, this.mediaName, this.mediaNote);
        this.resetFormFields();
        this.modalService.close(this.uploadMediaModalId);
        break;
      case mediaTypes.rss:
        this.tvService.addRss(this.newMedia, this.mediaName, this.mediaNote);
        this.resetFormFields();
        this.modalService.close(this.uploadMediaModalId);
        break;
      case mediaTypes.file:
        let files = [];
        this.loading.isLoading = true;
        this.loading.image = this.checkForIncludingMediaType(this.newMedia, mediaTypes.image);
        this.loading.video = this.checkForIncludingMediaType(this.newMedia, mediaTypes.video);
        this.newMedia.forEach((media: any, i: number) => {
          let formData = new FormData();
          let fileName = new URLSearchParams();
          let fileNote = new URLSearchParams();
          formData.append(this.newMedia[i].mediaName, this.newMedia[i], this.newMedia[i].name);
          fileName.append('fileName', this.newMedia[i].name);
          fileNote.append('fileNote', this.newMedia[i].mediaNote);
          files.push({ form: formData, fileName, fileNote, size: media.size });
        })
        if (files.reduce((prev, cur) => prev + cur.size, 0) + (40000 * (files.length + 1)) > this.userData.file_storage_byte - this.userData.file_storage_used_byte) {
          this.translate.get('errors.noEnoughSpace')
            .subscribe((res: string) => {
              alert(res);
            });
          this.stopLoading();
        } else {
          this.tvService.loadLocalFiles(files)
            .subscribe(data => {
              this.tvService.getAllMedia();
              this.stopLoading();
            }, (err) => {
              this.stopLoading();
              this.translate.get('errors.uploadFileErr')
                .subscribe((res: string) => {
                  alert(res);
                });
            })
          this.tvService.uploadingProgress
            .subscribe((data: any) => {
              this.loading.percentage = data.percentage + '%';
            });
        }
        this.modalService.close(this.uploadMediaModalId);
        break;
      case mediaTypes.overlay:
        this.isCodeValid = true;
        if (!this.isHTML(this.newMedia)) {
          alert('not valid html code');
          return;
        } else if (this.isExtPathesInvalid(this.newMedia)) {
          this.isCodeValid = false;
          break;
        } else {
          // Close all tags, if we have some invalid html.
          const tmpDiv = document.createElement('html');
          tmpDiv.innerHTML = this.newMedia;

          // Remove script tags.
          // const scr = tmpDiv.getElementsByTagName('script');
          //
          // for (let i = scr.length - 1; i >= 0; i--) {
          //   scr[i].parentNode.removeChild(scr[i]);
          // }

          const overlayCode = tmpDiv.outerHTML;
          // console.log('overlayCode \n', overlayCode);
          this.tvService.saveMediaOverlay(overlayCode, this.mediaName, this.mediaNote);

          this.resetFormFields();
          this.modalService.close(this.uploadMediaModalId);

          break;
        }

      default:
        break;
    }
  }

  private stopLoading(): void {
    this.loading.isLoading = false;
    this.loading.image = false;
    this.loading.video = false;
    this.resetFormFields();
  }

  public removeFile(index: number): void {
    this.newMedia.splice(index, 1);
    if (!this.newMedia.length) { this.resetFormFields(); }
  }

  private resetFormFields(): void {
    this.form.nativeElement.reset();
    this.selectedType = undefined;
    this.selectedMedia = undefined;
    this.mediaName = undefined;
    this.mediaNote = undefined;
    this.newMedia = undefined;
  }

  public selectMedia(media: any): void {
    this.modalService.open(this.mediaPreviewModalId);
    this.selectedMedia = media;

    let timeOut = !detectIE() ? 0 : 500;
    setTimeout(() => {
      let source = $('source.modal-video-source');
      source.src = this.selectedMedia.url;
      $('video.modal-video-elem').mediaelementplayer();
      if (this.selectedMedia.mediaType == mediaTypes.rss) {
        this.testRss($('.marquee'), this.selectedMedia.url);
      }
    }, timeOut);
  }

  private isHTML(str): boolean {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
  }

  private isExtPathesInvalid(code: string): boolean {
    const reg = new RegExp('[\"\']\/\/');
    return reg.test(code);

  }
}
