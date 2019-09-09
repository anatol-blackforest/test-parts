import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';

import { mediaTypes } from '../../shared/helpers';

declare var $: any;

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventDetailsComponent implements OnInit, AfterViewInit {

  @Input() public data: any;
  @Output() public clickOutside = new EventEmitter<any>();
  @Output() public deleteEvent = new EventEmitter<any>();
  @Output() public chengeEvent = new EventEmitter<any>();

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit() {
    //$('.event-detail-box').drags();
    if (this.data.media && this.data.media.mediaType === mediaTypes.video) {
      let source = $('source');
      source.src = this.data.media.url;
      $('video').mediaelementplayer();
    }
  }

  public closeEventBox(event): void {
    this.clickOutside.emit(event);
  }

  public openEditEventModal(): void {
    this.chengeEvent.emit();
  }

  public deleteScheduleEvent(): void {
    this.deleteEvent.emit();
  }

}
