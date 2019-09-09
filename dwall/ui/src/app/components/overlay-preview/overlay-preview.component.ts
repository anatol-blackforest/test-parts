import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ViewChild, ElementRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-overlay-preview',
  templateUrl: './overlay-preview.component.html',
  styleUrls: ['./overlay-preview.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverlayPreviewComponent implements OnInit, OnChanges {

  @ViewChild('overlay') overlayWrap: ElementRef;

  @Input() overlay: any;
  @Input() sizeNum: number;
  private sizes = {
    0: {
      width: 550,
      height: 320
    },
    1: {
      width: 1210,
      height: 750
    },
    2: {
      width: 2000,
      height: 800
    }
  }
  public size: any;

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.size = this.sizes[this.sizeNum];
  }

  ngOnChanges(changes) {
    setTimeout(() => {
      if (this.overlay.hasOwnProperty('overlay') && this.overlayWrap) {
        // this.overlayWrap.nativeElement.src = `data:text/html;charset=utf-8,${encodeURIComponent(this.overlay.overlay)}`;
        this.overlayWrap.nativeElement.srcdoc = this.overlay.overlay;
      }
      this.cd.markForCheck();
    }, 0);
  }

}
