import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { NoCacheHttpInterceptor } from '../../interceptors/no-cache-http/tv-http.interceptor';

import { dWallDefaultFallback, dWallDefaultFallbackThumb } from '../../shared/helpers';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/catch';

import * as moment from 'moment-timezone';

@Injectable()
export class UserService {

  public _timeZone: BehaviorSubject<any>;
  public timeZone: Observable<any>;

  public _userData: BehaviorSubject<any>;
  public userData: Observable<any>;

  public _fallback: BehaviorSubject<any>;
  public fallback: Observable<any>;

  public _licence: BehaviorSubject<any>;
  public licence: Observable<any>;

  //private userDefaultFallback: any;

  constructor(
    private http: NoCacheHttpInterceptor
  ) {
    this._timeZone = <BehaviorSubject<any>>new BehaviorSubject('');
    this.timeZone = this._timeZone.asObservable();

    this._userData = <BehaviorSubject<any>>new BehaviorSubject(null);
    this.userData = this._userData.asObservable();

    this._fallback = <BehaviorSubject<any>>new BehaviorSubject({
      url: dWallDefaultFallback,
      thumbnail: dWallDefaultFallbackThumb,
      id: null
    });
    this.fallback = this._fallback.asObservable();

    this._licence = <BehaviorSubject<any>>new BehaviorSubject(null);
    this.licence = this._licence.asObservable();
  }

  public getAllUserData(): void {
    let userData = this.http.get('user/userData')
      .map(res => res.json()).share();
    userData.subscribe(data => {
      this._userData.next(data[0]);
    });
  }

  public getUsersLicence(): void {
    this.http.get('licenses')
      .map(res => res.json())
      .subscribe(data => {
        this._licence.next(data);
      })
  }

  public userFallback(): any {
    return this._fallback.getValue().url;
  }

  public getTimeZone(): Observable<any> {
    let sub = this.http.get('tv/timezone')
      .map((response: any) => response.json())
      .share()
    sub.subscribe((data) => {
      if (!data.timezone) {
        let guessedTimezone: string = moment.tz.guess();
        moment.tz.setDefault(guessedTimezone);
        this.setTimeZone(guessedTimezone);
      } else {
        moment.tz.setDefault(data.timezone);
      }
      this._timeZone.next(data);
    })
    return sub;
  }

  public setTimeZone(timezone): void {
    this.http.post('tv/timezone', { timezone })
      .subscribe((data) => {
        this.getTimeZone();
      })
  }

  public changePass(oldPass: string, newPass: string, confirm: string): Observable<any> {
    return this.http.put('user/updatePass', { oldPass, newPass, confirm });
  }

  public updateUserData(name, address, city, company, country, state, postalCode): Observable<any> {
    let observable = this.http.put('user', {
      first_name: name,
      address,
      company,
      country,
      state,
      postal_code: postalCode,
      city
    }).share();
    observable.subscribe(data => {
      this.getAllUserData();
    });
    return observable;
  }

  public updateUserBillingData(name, address, city, country, state, postalCode): Observable<any> {
    let observable = this.http.put('user', {
      billing_name: name,
      billing_address: address,
      billing_city: city,
      billing_country: country,
      billing_state: state,
      billing_postal_code: postalCode
    }).share();
    observable.subscribe(data => {
      this.getAllUserData();
    })
    return observable;
  }

  public getFallback(): Observable<any> {
    let observable = this.http.get('user/myFallback')
      .map(res => res.json()).share();
    observable.subscribe(fallback => {
      let fallbackImg;
      if (fallback.hasOwnProperty('url')) {
        fallbackImg = fallback;
      } else {
        fallbackImg = {
          url: dWallDefaultFallback,
          thumbnail: dWallDefaultFallbackThumb,
          id: null
        };
      }
      this._fallback.next(fallbackImg);
    });
    return observable;
  }

  public updateFallbackMedia(mediaId: string | number): Observable<any> {
    let observable = this.http.put('user/setFallback', {
      mediaId
    }).share();
    observable.subscribe(data => {
      this.getFallback();
      this.getAllUserData();
    });
    return observable;
  }

}
