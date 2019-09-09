import { Component, Input, OnInit, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { ModalService } from '../../services/modal/modal.service';


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ModalComponent implements OnInit {

  @Input() width: number | string;
  @Input('modalId') modalId: string;
  @Input('modalTitle') modalTitle: string;
  @Input() blocking = false;
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  public isOpen: boolean = false;
  public calculatedWidth: number;
  public scrollTop: number;

  constructor(
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.modalService.registerModal(this);
  }

  public close(checkBlocking = false): void {
    this.closeModal.emit();
  }

  public keyup(event: KeyboardEvent): void {
    if (event.keyCode === 27) { this.modalService.close(this.modalId, true); }
  }

}
