import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { TvService } from '../tv/tv.service';
import { UserService } from '../user/user.service';

import { HttpInterceptor } from '../../interceptors/http/http.interceptor';

import 'rxjs/add/operator/share';
import * as moment from 'moment-timezone';

@Injectable()
export class AuthService {

  constructor(
    private http: HttpInterceptor,
    private router: Router,
    private zone: NgZone,
    private tvService: TvService,
    private userService: UserService
  ) { }

  public login(email: string, pass: string): Observable<any> {
    if (localStorage.getItem('DWallIsLogged') === 'true') {
      if (localStorage.getItem('DWallUserEmail') === email && localStorage.getItem('DWallUserPass') === pass) {
        this.router.navigate(['/main/devices']);
        return Observable.create((observer) => {
          observer.next(true);
        })
      } else {
        this.clearLocalStorageDWallData();
      }
    }
    let loginObservable = this.http.post('/login', { email, pass }).share();
    loginObservable.subscribe((res: any) => {
      if (res.status === 200) {
        localStorage.setItem('DWallIsLogged', 'true');
        localStorage.setItem('DWallUserEmail', email);
        localStorage.setItem('DWallUserPass', pass);
        localStorage.setItem('DWallExpiresDate', res.json().expires.valueOf().toString());
        let daysLeft = moment(res.json().accountExpires).diff(moment().today, 'days');
        if (daysLeft < 5) {
          alert(`Your account is expiring on ${moment(res.json().accountExpires).format('LL')}. Feel free to contact us at sales@dwall.online`)
        }
        this.router.navigate(['/main/devices']);
      }
    }, (err: any) => {
      this.router.navigate(['/login']);
    });
    return loginObservable;
  }

  public logout(): Observable<any> {
    this.clearLocalStorageDWallData();
    localStorage.removeItem('DWallExpiresDate');
    this.router.navigate(['/login']);
    let logout = this.http.get('/logout')
    logout.share();
    logout.subscribe(res => {
      if (res.status === 200) {
        this.zone.runOutsideAngular(() => {
          this.tvService._tvs.next(null);
          this.tvService._groups.next([]);
          this.tvService._media.next(null);
          this.tvService._playlists.next(null);
          this.tvService._scheduleEvents.next([]);
          this.tvService._stats.next([]);
          this.userService._licence.next(null);
          this.userService._fallback.next(null);
          this.userService._timeZone.next(null);
          this.userService._userData.next(null);
        });
      }
    });
    return logout;
  }

  public clearLocalStorageDWallData(): void {
    localStorage.removeItem('DWallIsLogged');
    localStorage.removeItem('DWallUserEmail');
    localStorage.removeItem('DWallUserPass');
  }

}
