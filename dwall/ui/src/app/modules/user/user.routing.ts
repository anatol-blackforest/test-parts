import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsComponent } from '../../components/settings/settings.component';

const routes: Routes = [
  { path: '', component: SettingsComponent }
];

export const UserRoutes: ModuleWithProviders = RouterModule.forChild(routes);