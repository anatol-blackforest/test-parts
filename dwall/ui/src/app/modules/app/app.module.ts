import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule, XHRBackend, RequestOptions, JsonpModule } from '@angular/http';
import { HttpClientModule, HttpClientJsonpModule, HttpClientXsrfModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { DevicesModule } from '../devices/devices.module';
import { MediaModule } from '../media/media.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { AuthModule } from '../auth/auth.module';

import { AppComponent } from '../../components/app/app.component';
import { MainComponent } from '../../components/main/main.component';
import { InfoComponent } from '../../components/info/info.component';

import { AppRoutingModule } from './app-routing.module';

import { TvService } from '../../services/tv/tv.service';
import { UserService } from '../../services//user/user.service';

import { NoCacheHttpInterceptor } from '../../interceptors/no-cache-http/tv-http.interceptor';
import { NoCacheHttpFactory } from '../../interceptors/no-cache-http/tv-http.factory';

import { TranslateConfig } from '../../shared/translate/translate.config';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    InfoComponent
  ],
  imports: [
    TranslateConfig,
    SharedModule,
    BrowserModule,
    HttpModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientJsonpModule,
    JsonpModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'My-Xsrf-Cookie',
      headerName: 'My-Xsrf-Header',
    }),
    ScheduleModule,
    DevicesModule,
    MediaModule,
    PlaylistsModule,
    AuthModule
  ],
  providers: [
    TvService,
    UserService,
    {
      provide: NoCacheHttpInterceptor,
      useFactory: NoCacheHttpFactory,
      deps: [XHRBackend, RequestOptions, Router]
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
