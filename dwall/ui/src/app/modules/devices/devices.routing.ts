import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TvsTabComponent } from '../../components/tvs-tab/tvs-tab.component';

const routes: Routes = [
  { path: '', component: TvsTabComponent }
];

export const DevicesRoutes: ModuleWithProviders = RouterModule.forChild(routes);