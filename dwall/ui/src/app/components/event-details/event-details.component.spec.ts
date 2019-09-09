import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EventDetailsComponent } from './event-details.component';

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent;
  let fixture: ComponentFixture<EventDetailsComponent>;
  let mockData = {
    top: 10,
    target: 'ngDevice',
    constant_play: true,
    media: {
      mediaType: 'image'
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventDetailsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDetailsComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should be display target name', () => {
    let e = fixture.debugElement.query(By.css('.event-device'));
    fixture.detectChanges();
    expect(e.nativeElement.textContent).toContain(mockData.target);
  });

  it('constant play to be shown', () => {
    let e = fixture.debugElement.query(By.css('.event-time'));
    fixture.detectChanges();
    expect(e.nativeElement.textContent).toContain('play constantly');
  });
});
