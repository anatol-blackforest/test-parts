import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/timer';

import { AuthService } from '../../services/auth/auth.service';
import { TvService } from '../../services/tv/tv.service';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})

export class MainComponent implements OnInit {

  @HostListener('window:storage', ['$event'])
  onStorageChange(event) {
    if (event.key == 'DWallIsLogged' && event.newValue === null) {
      this.auth.logout();
    }
  }

  @HostListener('window:unload', ['$event'])
  clearDWallLocalStorageData(event) {
    this.auth.clearLocalStorageDWallData();
  }

  constructor(
    private auth: AuthService,
    private location: Location,
    private tvService: TvService,
    private userService: UserService,
  ) { }

  ngOnInit() {

    this.userService.getFallback()
      .subscribe(data => {
        this.tvService.getAllTVs();
        this.tvService.getAllGroups();
        this.tvService.getAllPlaylists();
        this.tvService.getAllMedia();
        this.tvService.getScheduleEvents();
      })

    this.userService.getTimeZone();

    this.tvService.stats
      .subscribe(data => {
        if (data.hasOwnProperty('status') && data.status === 0) {
          subscrubtion.unsubscribe();
        }
      })

    let timer = Observable.timer(60000, 60000);
    let subscrubtion = timer
      .subscribe((val: number) => {
        this.tvService.getDeviceStatuses();
      })

    let expiresTimer = Observable.timer(1000, 1000)
      .subscribe(time => {
        if (new Date(localStorage.getItem('DWallExpiresDate')).valueOf() <= new Date().getTime()) {
          this.auth.logout();
          expiresTimer.unsubscribe();
        }
      })
  }

  public logout(): void {
    this.auth.logout();
  }

  public isLinkActive(path): boolean {
    return this.location.path() === path;
  }

}
