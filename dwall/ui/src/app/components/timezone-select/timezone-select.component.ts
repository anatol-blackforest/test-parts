import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { UserService } from '../../services/user/user.service';

import * as moment from 'moment-timezone';

@Component({
  selector: 'app-timezone-select',
  templateUrl: './timezone-select.component.html',
  styleUrls: ['./timezone-select.component.css']
})
export class TimezoneSelectComponent implements OnInit {

  @Output() public setTimeZone = new EventEmitter<any>();

  public findTerm: string = '';
  public timeZones: any[] = [];
  public selectedTimeZone: string;
  public selectedLocation: string;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    let timeZones = moment.tz.names();
    for (let zone in timeZones) {
      this.timeZones.push({
        location: timeZones[zone],
        offset: this.formatTimezoneOffset(moment.tz(timeZones[zone]).format('z, Z'))
      })
    }
    this.userService.timeZone
      .subscribe(data => {
        if (data) { this.selectedLocation = data.timezone; }
        this.selectedTimeZone = moment.tz(moment().tz()).format('z, Z');
      });
  }

  private formatTimezoneOffset(value: string): string {
    let offset: string = value;
    if ((offset.startsWith('+') || offset.startsWith('-')) && (offset.slice(1, offset.indexOf(',')).length === 4)) {
      return offset.slice(0, 3).concat(':').concat(offset.slice(3));
    } else { return offset; }
  }

  public selectTimeZone(timeZone: string): void {
    moment.tz.setDefault(timeZone);
    this.setTimeZone.emit(moment.tz(timeZone).format('z, Z'));
    this.findTerm = '';
    this.userService.setTimeZone(timeZone);
  }
}
