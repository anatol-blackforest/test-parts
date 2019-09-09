import { Component, OnInit, Inject } from '@angular/core';

import { DOCUMENT } from '@angular/platform-browser';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
declare let gtag: Function;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public email: string = '';
  public pass: string = '';
  public errorMsg: any = null;
  public gtag: any;

  constructor(
    private router: Router,
    private auth: AuthService,
    @Inject(DOCUMENT) private document: Document
  ) {
      this.gtag = gtag;
  }

  ngOnInit() {
    let img = new Image();
    img.onload = () => {
      let loginBody: any = this.document.getElementsByClassName('login-body')[0];
      loginBody.style.backgroundImage = `url(${img.src})`;
    }
    img.onerror = (err) => {
      console.log('error while loading DWall default wallpapper');
      //img.src = '';
    }
    img.src = '/assets/images/Sign-in-bg.jpg';
  }

  public login(): void {
    this.errorMsg = null;
    if (!this.email || !this.pass) {
      this.errorMsg = 'Enter E-mail and password';
    } else {
      this.auth.login(this.email, this.pass)
        .subscribe((data) => {
        },
          (err) => {
            if (err.status === 401) {
              try {
                this.errorMsg = err.json().message;
              } catch (e) {
                this.errorMsg = 'Invalid e-mail or password';
              }
            } else {
              this.errorMsg = 'Something went wrong. Please, try later';
            }
          })
    }
  }

}
