import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QRCodeModule } from 'angular2-qrcode';

import { SharedModule } from '../shared/shared.module';

import { DevicesRoutes } from './devices.routing';

import { TvsTabComponent } from '../../components/tvs-tab/tvs-tab.component';
import { TvListItemComponent } from '../../components/tv-list-item/tv-list-item.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    QRCodeModule,
    DevicesRoutes
  ],
  declarations: [
    TvsTabComponent,
    TvListItemComponent
  ]
})
export class DevicesModule { }
