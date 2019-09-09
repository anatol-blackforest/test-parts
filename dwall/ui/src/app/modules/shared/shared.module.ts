import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../components/modal/modal.component';
import { VisualMediaItemComponent } from '../../components/visual-media-item/visual-media-item.component';
import { TimezoneSelectComponent } from '../../components/timezone-select/timezone-select.component';
import { LineMediaItemComponent } from '../../components/line-media-item/line-media-item.component';
import { TranslateModule } from '@ngx-translate/core';
import { UrlPreviewComponent } from '../../components/url-preview/url-preview.component';
import { OverlayPreviewComponent } from '../../components/overlay-preview/overlay-preview.component';

import { ModalService } from '../../services/modal/modal.service';

import { SearchFilterPipe } from '../../pipes/search-filter/search-filter.pipe';
import { DevicesWithoutGroupPipe } from '../../pipes/devices-without-group/devices-without-group.pipe';
import { SizeCountPipe } from '../../pipes/size-count/size-count.pipe';
import { CountVideoDurationPipe } from '../../pipes/count-video-duration/count-video-duration.pipe';
import { SafePipe } from '../../pipes/safe-url/safe-url.pipe';

import { StatusStyleDirective } from '../../directives/status-style/status-style.directive';
import { DetectGroupContentDirective } from '../../directives/detect-group-content/detect-group-content.directive';
import { DetectDeviceContentDirective } from '../../directives/detect-device-content/detect-device-content.directive'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  declarations: [
    ModalComponent,
    VisualMediaItemComponent,
    LineMediaItemComponent,
    OverlayPreviewComponent,
    SearchFilterPipe,
    TimezoneSelectComponent,
    UrlPreviewComponent,
    DevicesWithoutGroupPipe,
    StatusStyleDirective,
    SizeCountPipe,
    CountVideoDurationPipe,
    SafePipe,
    DetectDeviceContentDirective,
    DetectGroupContentDirective
  ],
  providers: [
    ModalService
  ],
  exports: [
    FormsModule,
    TranslateModule,
    ModalComponent,
    VisualMediaItemComponent,
    LineMediaItemComponent,
    SearchFilterPipe,
    TimezoneSelectComponent,
    DevicesWithoutGroupPipe,
    StatusStyleDirective,
    SizeCountPipe,
    CountVideoDurationPipe,
    DetectDeviceContentDirective,
    UrlPreviewComponent,
    SafePipe,
    DetectGroupContentDirective,
    OverlayPreviewComponent
  ]
})
export class SharedModule { }
