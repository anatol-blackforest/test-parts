import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScheduleTabComponent } from '../../components/schedule-tab/schedule-tab.component';

const routes: Routes = [
  { path: '', component: ScheduleTabComponent }
];

export const ScheduleRoutes: ModuleWithProviders = RouterModule.forChild(routes);