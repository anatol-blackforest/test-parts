import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MediaTabComponent } from '../../components/media-tab/media-tab.component';

const routes: Routes = [
  { path: '', component: MediaTabComponent }
];

export const MediaRoutes: ModuleWithProviders = RouterModule.forChild(routes);