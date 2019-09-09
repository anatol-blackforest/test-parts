import { Component, AfterViewInit } from '@angular/core';

import { Location } from '@angular/common';

import { AuthService } from './../../services/auth/auth.service';

import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

//declare let $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  constructor(
    private location: Location,
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {
    const EN = 'en';
    translate.setDefaultLang(EN);
    let lang: string;
    try { 
      lang = localStorage.getItem('dWallLang');
      if (!lang) {
        lang = EN;
        localStorage.setItem('dWallLang', EN);
      }
    } catch(e) {
      lang = EN;
    }
    translate.use(lang);
  }

  ngAfterViewInit() {
    /*$('body').mCustomScrollbar({
      theme:'dark',
      scrollInertia: 50
    });*/
  }

  public changeOfRoutes(): void {
  }

}