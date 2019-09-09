import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

import { MediaRoutes } from './media.routing';

import { MediaTabComponent } from '../../components/media-tab/media-tab.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MediaRoutes
  ],
  declarations: [
    MediaTabComponent
  ]
})
export class MediaModule { }
