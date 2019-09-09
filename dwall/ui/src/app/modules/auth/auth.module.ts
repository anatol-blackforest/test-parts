import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XHRBackend, RequestOptions } from '@angular/http';

import { SharedModule } from '../shared/shared.module';

import { AuthRoutes } from './auth.routing';

import { AuthService } from '../../services/auth/auth.service';

import { HttpFactory } from '../../interceptors/http/http.factory';
import { HttpInterceptor } from '../../interceptors/http/http.interceptor';

import { LoginComponent } from '../../components/login/login.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    AuthRoutes
  ],
  declarations: [
    LoginComponent
  ],
  providers: [
    AuthService,
    {
      provide: HttpInterceptor,
      useFactory: HttpFactory,
      deps: [
        XHRBackend,
        RequestOptions
      ]
    }
  ]
})
export class AuthModule { }
