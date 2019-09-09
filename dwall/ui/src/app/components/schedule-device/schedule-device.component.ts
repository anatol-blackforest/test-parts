import { Component, OnInit, Input, ChangeDetectionStrategy, ViewChild, Output, EventEmitter } from '@angular/core';

import { colors } from '../../shared/helpers';

@Component({
  selector: 'app-schedule-device',
  templateUrl: './schedule-device.component.html',
  styleUrls: ['./schedule-device.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleDeviceComponent implements OnInit {

  @ViewChild('targetItem') targetItem;

  @Input() target: any;
  /**
   * device | group
   */
  @Input() type: string;

  @Output() scheduleEvent = new EventEmitter<any>();

  constructor() { }

  ngOnInit() { }

  public leaveDrag(event): void {
    this.targetItem.nativeElement.style.background = colors.white;
  }

  public allowDrop(event): void {
    event.preventDefault();
    this.targetItem.nativeElement.style.background = colors.allowDropGray;
  }

  public dropMedia(event): void {
    this.scheduleEvent.emit({ target: this.target });
    this.targetItem.nativeElement.style.background = colors.white;
  }

}
