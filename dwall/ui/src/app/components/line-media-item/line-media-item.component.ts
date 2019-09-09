import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

import { mediaTypes, colors } from '../../shared/helpers';

import { getDuration, getSize } from '../../shared/functions';

import { TvService } from '../../services/tv/tv.service';

declare let $: any;

@Component({
  selector: 'app-line-media-item',
  templateUrl: './line-media-item.component.html',
  styleUrls: ['./line-media-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineMediaItemComponent implements OnInit, AfterViewInit {
  // playlists | schedule
  @Input() parentTab: string;
  // media.mediaType: video, image, stripe or playlist
  @Input() media: any;
  @Input() rssInterval: number = 60000;
  //  mode: show | manage
  @Input() mode: string;
  @Input() colors: any = null;

  @Output() selectMedia = new EventEmitter<any>();
  @Output() deleteMedia = new EventEmitter<any>();
  @Output() changeDuration = new EventEmitter<number>();
  @Output() changeRssInterval = new EventEmitter<number>();
  @Output() changeColors = new EventEmitter<any>();

  public transparent: boolean = false;
  public urlCanBePreviewed = false;
  public isFetching = false;

  constructor(
    private tvService: TvService,
    public cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.rssInterval = this.rssInterval / 60000;
    if (this.media.mediaType === mediaTypes.rss) {
      this.tvService.rss(this.media.url)
        .subscribe(data => { }, err => {
          this.media.hasInvalidRss = true;
          this.cd.detectChanges();
        })
    }

    this.media.mediaType = this.media.mediaType ? this.media.mediaType : mediaTypes.playlist;
    if ((this.media.mediaType === mediaTypes.stripe || this.media.mediaType === mediaTypes.rss) && this.mode === 'manage' && this.colors && this.colors.background === colors.transparent) {
      this.transparent = true;
    }
    this.setRssDuration();
    if (this.media.mediaType == mediaTypes.playlist) {
      this.media.duration = getDuration.bind(this, this.media)();
      this.media.size = getSize.bind(this, this.media)();
    }
  }

  ngAfterViewInit() {
    this.initColorPicker();
  }

  public addMedia(event): void {
    event.preventDefault();
    this.selectMedia.emit(Object.assign({}, this.media));
  }

  public removeMedia(): void {
    this.deleteMedia.emit(this.media);
  }

  public updateTotalDuration(): void {
    this.changeDuration.emit(this.media.duration);
  }

  public setTransparentBackground(): void {
    if (this.transparent) {
      this.colors.background = colors.transparent;
    } else {
      this.colors.background = colors.white;
      this.initColorPicker();
    }
    this.setColors();
  }

  public setColors(): void {
    this.changeColors.emit({
      text: this.colors.text,
      background: this.colors.background
    });
  }

  public setRssDuration(): void {
    this.changeRssInterval.emit(this.rssInterval * 60000);
  }

  private initColorPicker(): void {
    let self = this;
    setTimeout(() => {
      const i = document.createElement('input');
      i.setAttribute('type', 'color');
      if (i.type !== 'color') {
        $('input[type="color"]').spectrum({
          change: function (color) {
            self.colors.text = this.name === 'text-color' ? color.toHexString() : self.colors.text;
            self.colors.background = this.name === 'background-color' ? color.toHexString() : self.colors.background;
            self.setColors();
          }
        });
      }
    }, 0);
  }

  public validateDuration(event, duration, minValue = 5) {
    if (duration.value < minValue || duration.value === null) {
      this.media.duration = minValue;
    } else {
      this.media.duration = duration.value;
    }
  }

  public validateDurationRss(durationRss) {
    if (durationRss < 1 || durationRss === null) {
      this.rssInterval = 1;
    } else {
      this.rssInterval = durationRss;
    }
  }

}
