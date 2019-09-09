import { Directive, ElementRef, Input, Renderer, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[dwStatusStyle]'
})

export class StatusStyleDirective implements OnChanges {

  @Input() isOnline: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isOnline) {
      let status: any = {};
      status.color = !this.isOnline ? 'red' : 'green';
      status.text = this.isOnline ? 'On' : 'Off';
      this.renderer.setElementStyle(this.el.nativeElement, 'background', status.color);
      this.renderer.setElementStyle(this.el.nativeElement, 'box-shadow', `0 0 5px 0 ${status.color}`);
      this.el.nativeElement.parentElement.lastElementChild.textContent = status.text;
    }
  }

}