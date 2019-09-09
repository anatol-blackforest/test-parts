import { Component, OnInit, Input, ViewChild, ElementRef, ChangeDetectionStrategy, AfterViewInit, Output, EventEmitter } from '@angular/core';

import { detectIE } from '../../shared/functions';

declare var $: any;

@Component({
  selector: 'app-visual-media-item',
  templateUrl: './visual-media-item.component.html',
  styleUrls: ['./visual-media-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualMediaItemComponent implements OnInit, AfterViewInit {

  @ViewChild('videoPlayer') videoPlayer: ElementRef;

  @Input() type: string;
  @Input() media: any;

  /**
   * mode (show / manage)
   */
  @Input() mode: string = 'manage';

  @Output() removeMedia: EventEmitter<any> = new EventEmitter();
  @Output() selectMedia: EventEmitter<any> = new EventEmitter();
  @Output() mediaPreview: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  remove() {
    this.removeMedia.emit(this.media.url);
  }

  ngAfterViewInit() {
    let timeOut = !detectIE() ? 0 : 1000;
    if (this.type === 'video') {
      /*let img = new Image();
      img.onload = () => {
        this.videoPlayer.nativeElement.setAttribute('poster', this.media.thumbnail)
      }
      img.onerror = (err) => {
        this.videoPlayer.nativeElement.setAttribute('poster', '/assets/images/hqdefault.jpg')
      }
      img.src = this.media.thumbnail;*/
      let source = $('source');
      source.src = this.media.url;
      if (this.mode === 'show') {
        setTimeout(() => {
          $(this.videoPlayer.nativeElement).mediaelementplayer();
        }, timeOut);
      } else {
        $(this.videoPlayer.nativeElement).mediaelementplayer();
      }
    }
  }

  public select(event): void {
    var elem = event.target;
    elem.classList.remove('mi-add-box');
    elem.classList.add('mi-check-circle');
    setTimeout(() => {
      elem.classList.remove('mi-check-circle');
      elem.classList.add('mi-add-box');
    }, 500)
    this.selectMedia.emit(this.media);
  }

  public openMediaPreview(): void {
    this.mediaPreview.emit(this.media);
  }

}