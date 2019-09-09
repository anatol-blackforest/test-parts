import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormWizardModule } from '../wizard/form-wizard.module';

import { SharedModule } from '../shared/shared.module';

import { ScheduleTabComponent } from '../../components/schedule-tab/schedule-tab.component';
import { ScheduleComponent } from '../../components/schedule/schedule.component';
import { EventDetailsComponent } from '../../components/event-details/event-details.component';
import { ScheduleDeviceComponent } from '../../components/schedule-device/schedule-device.component';

import { EventDetailsService } from '../../services/event-details/event-details.service';

import { ScheduleRoutes } from './schedule.routing';

import { ClickOutsideDirective } from '../../directives/click-outside/click-outside.directive';

@NgModule({
  imports: [
    CommonModule,
    ScheduleRoutes,
    SharedModule,
    FormWizardModule
  ],
  declarations: [
    ScheduleTabComponent,
    EventDetailsComponent,
    ScheduleComponent,
    ScheduleDeviceComponent,
    ClickOutsideDirective
  ],
  providers: [
    EventDetailsService
  ],
  entryComponents: [
    EventDetailsComponent
  ],
})
export class ScheduleModule { }
