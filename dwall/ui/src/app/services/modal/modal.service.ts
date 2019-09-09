import { Injectable, Inject } from '@angular/core';

import { DOCUMENT } from '@angular/platform-browser';

import { ModalComponent } from '../../components/modal/modal.component';

declare let $: any;

@Injectable()
export class ModalService {
  modals: Array<ModalComponent>;

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) {
    this.modals = [];
  }

  private calculateModalWidth(initWidth: number | string): number {
    initWidth = parseInt(initWidth.toString());
    let windowWidth = document.body.clientWidth;
    initWidth = (windowWidth > initWidth) ? initWidth : (windowWidth - 40);
    return initWidth;
  }

  registerModal(newModal: ModalComponent): void {
    const modal = this.findModal(newModal.modalId);
    if (modal) {
      this.modals.splice(this.modals.indexOf(modal));
    }
    this.modals.push(newModal);
  }

  open(modalId: string): void {
    const modal = this.findModal(modalId);
    if (modal) {
      modal.isOpen = true;
      modal.calculatedWidth = this.calculateModalWidth(modal.width);
      modal.scrollTop = Math.max(
        this.document.body.scrollTop,
        this.document.documentElement.scrollTop,
        window.pageYOffset
      );
      $('body').css('overflow', 'hidden');
    }
    /*setTimeout(() => {
      $('.modal-dialog').drags();
    }, 0)*/
  }

  close(modalId: string, checkBlocking = false): void {
    const modal = this.findModal(modalId);
    if (modal) {
      if (checkBlocking && modal.blocking) {
        return;
      }
      modal.isOpen = false;
      $('body').css('overflow', 'visible');
    }
  }

  findModal(modalId: string): ModalComponent {
    for (const modal of this.modals) {
      if (modal.modalId === modalId) {
        return modal;
      }
    }
    return null;
  }
}