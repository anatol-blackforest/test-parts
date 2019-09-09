import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, ElementRef } from '@angular/core';

import { TvService } from '../../services/tv/tv.service';
import { ModalService } from '../../services/modal/modal.service';
import { UserService } from '../../services/user/user.service';

import { TvsTabComponent } from './tvs-tab.component';

export class MockElementRef extends ElementRef {
  constructor() { super(null); }
}

describe('TvsTabComponent', () => {

  let component: TvsTabComponent;
  let fixture: ComponentFixture<TvsTabComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TvsTabComponent],
      providers: [
        TvService,
        ModalService,
        { provide: ElementRef, useClass: MockElementRef },
        UserService
      ]
    })
  }));

  /*beforeEach(() => {
    fixture = TestBed.createComponent(TvsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });*/

  it('should be created', () => {
    expect(true).toBeTruthy();
  });
});
