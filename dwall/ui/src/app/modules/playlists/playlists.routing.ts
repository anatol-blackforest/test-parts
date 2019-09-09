import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlaylistsTabComponent } from '../../components/playlists-tab/playlists-tab.component';

const routes: Routes = [
  { path: '', component: PlaylistsTabComponent }
];

export const PlaylistsRoutes: ModuleWithProviders = RouterModule.forChild(routes);