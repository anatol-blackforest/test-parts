import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';

import { IDevice } from '../../interfaces/device';

@Component({
  selector: 'app-tv-list-item',
  templateUrl: './tv-list-item.component.html',
  styleUrls: ['./tv-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TvListItemComponent implements OnInit {

  @Input() tv: IDevice;
  @Input() showInGroup: string = 'false';

  @Output() openTvModalPreview: EventEmitter<any> = new EventEmitter();
  @Output() removeTv: EventEmitter<any> = new EventEmitter();

  private colunmWidthes: any = {
    'false': [28, 28, 0, 16, 14, 14],
    'true': [23, 22, 15, 13, 13, 14]
  }

  public columns: Array<number>;

  constructor(
    private tvService: TvService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.columns = this.colunmWidthes[this.showInGroup];
  }

  public remove(): void {
    this.removeTv.emit(this.tv.guid);
  }

  public showPreview(): void {
    this.openTvModalPreview.emit();
  }

}
