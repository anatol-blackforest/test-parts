import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from '../../components/login/login.component';

const routes: Routes = [
  { path: '', component: LoginComponent }
];

export const AuthRoutes: ModuleWithProviders = RouterModule.forChild(routes);