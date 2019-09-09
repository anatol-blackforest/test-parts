import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

import { PlaylistsRoutes } from './playlists.routing';

import { PlaylistsTabComponent } from '../../components/playlists-tab/playlists-tab.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    PlaylistsRoutes
  ],
  declarations: [
    PlaylistsTabComponent
  ]
})
export class PlaylistsModule { }
