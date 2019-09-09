import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, Renderer, Inject, OnChanges, SimpleChanges, HostListener, ElementRef, ViewContainerRef, ViewChild, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import { EventDetailsService } from '../../services/event-details/event-details.service';
import { UserService } from '../../services/user/user.service';
import * as moment from 'moment-timezone';
import { getMediaByUrl, findPlaylistById } from '../../shared/functions';
import { targetTypes, colors } from '../../shared/helpers';

declare let $: any;

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() tz: any;
  @Input() images: any[];
  @Input() webPages: any[];
  @Input() videos: any[];
  @Input() playlists: any[];
  @Input() groupEvents: any[] = [];
  @Input() deviceEvents: any[] = [];

  @Output() public deleteEvent = new EventEmitter<any>();
  @Output() public changeEvent = new EventEmitter<any>();
  @Output() public newEvent = new EventEmitter<any>();
  @Output() public changeTimezone = new EventEmitter<any>();
  @Output() public clearAllEvents = new EventEmitter<any>();

  @ViewChild('timeline') timeline: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event) { this.render(); }

  @ViewChild('parent', { read: ViewContainerRef }) parent: ViewContainerRef;
  // for creating timeline
  private weekDays: string[] = [];
  private hours: string[] = [];
  public monthDays: Array<number> = [];
  // available views
  public availableView: {
    day: string;
    week: string;
    month: string } = {
    day:   'day',
    week:  'week',
    month: 'month'
  };
  // selected day to display schedule
  private date: any;
  // curent time
  public current: any;
  // selected schedule view (day or week)
  public scheduleView: string;
  //selected schedule view time period (array of days n week or hours in one day)
  public scheduleViewTimiline: Array<string|number>;
  // selected category to display (groups or devices)
  private selectedCategory: string = targetTypes.device;
  // events to display in schedule
  public selectedCategoryEvents: any[] = [];
  // start and end range of current scheduler
  private start: any;
  private end: any;
  private tzSubscribtion: any;

  constructor(
    private renderer: Renderer,
    private elRef: ElementRef,
    private eventDetailsService: EventDetailsService,
    private userService: UserService,
    @Inject(DOCUMENT) private document: Document
  ) {
    // depends on scheduleView selected
    this.start = moment().startOf('day');
    this.end = moment().endOf('day');
  }

  ngOnInit() {
    // get array of hours in one day
    this.hours = this.generateHoursArray();
    this.generateWeekDayDates(new Date());
    // set init schedule view to day-view
    this.scheduleView = this.availableView.day;
    // set timelines to be according to selected scedule view
    this.scheduleViewTimiline = this.hours;
    this.date = moment();

    this.generateMonthDays(new Date());

    // render red current time line every 60 seconds
    Observable.timer(60000, 60000)
      .subscribe((val: number) => {
        this.drawCurrentTimeLine(this.selectedCategoryEvents.length * 45);
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.deviceEvents && changes.deviceEvents.currentValue || changes.groupEvents && changes.groupEvents.currentValue) {
      this.deviceEvents = changes.deviceEvents.currentValue;
      this.groupEvents = changes.groupEvents.currentValue;
      this.deviceEvents.concat(this.groupEvents).forEach((event: any) => {
        event.events.forEach((e: any) => { e.color = colors.dwBlue; })
      });
      this.selectedCategoryEvents = (this.selectedCategory === targetTypes.device) ? this.deviceEvents : this.groupEvents;
    }

    this.render();
  }

  ngOnDestroy() {
    this.tzSubscribtion.unsubscribe();
  }

  private generateHoursArray(): string[] {
    let arr: string[] = [];
    for (let i = 0; i < 24; i++) {
      if (i < 10) { arr.push(`0${i}:00`); } else { arr.push(`${i}:00`); }
    }
    return arr;
  }

  private generateWeekDayDates(date: any | Date): void {
    this.weekDays = [];
    let day: any = moment(date).startOf('week');
    moment.weekdays(true).forEach((weekDay: string) => {
      this.weekDays.push(weekDay.slice(0, 3) + ' ' + day.format('DD/MM'));
      day = moment(day).add(1, 'days');
    });
    if (this.scheduleView === this.availableView.week) { this.scheduleViewTimiline = this.weekDays; }
  }

  private generateMonthDays(date: any|Date): void {
    const monthDays = moment(date).daysInMonth();
    this.monthDays = Array.from(new Array(monthDays),(val, index) => index + 1);
  }

  ngAfterViewInit() {
    // init date-picker
    let datePicker = $('[data-toggle="datepicker"]');
    datePicker.datepicker({
      trigger: $('#dw-calendar'),
      startView: 0,
      weekStart: 1,
      format: 'mm-dd-yyyy',
      autoHide: true,
      pick: function () {
        this.pickDate();
        this.render();
        this.generateWeekDayDates(this.date);
      }.bind(this)
    });

    this.tzSubscribtion = this.userService.timeZone
      .subscribe((tz: string) => {
        if (tz) {
          let datePicker = $('[data-toggle="datepicker"]');
          datePicker.datepicker('reset');
          datePicker.datepicker('setDate', moment().format('MM-DD-YYYY'));
          let date = datePicker.datepicker('getDate');
          let datePickersDate = moment(`${date.getFullYear()}-${(date.getMonth() + 1 < 10) ? '0' + (date.getMonth() + 1) : date.getMonth() + 1}-${(date.getDate() < 10) ? '0' + date.getDate() : date.getDate()}`);
          this.date = moment(datePickersDate.format('YYYY-MM-DD'));
          datePicker.datepicker('setDate', moment(this.date.valueOf()).format('MM-DD-YYYY'));
          // make current time ticking
          let timer = Observable.timer(0, 1000);
          timer.subscribe(time => {
            this.current = moment().format('dd, MMMM DD, YYYY') + ', ' + moment().format('LTS');
          });
          // setting todays date
          datePicker.datepicker('setDate', moment().format('MM-DD-YYYY'));

          console.log( 'after init', moment().format('MM-DD-YYYY'));
          this.render();
        }
      });
  }

  private drawCurrentTimeLine(height: number): void {
    let timelineWrap: any = this.elRef.nativeElement.querySelector('.timeline-wrap');
    // get full width of timeline row
    let width = (timelineWrap.getBoundingClientRect().width) < 720 ? 720 : timelineWrap.getBoundingClientRect().width;
    if (this.start.valueOf() > moment().valueOf() || this.end.valueOf() < moment().valueOf()) {
      $('.time-line').remove();
      return;
    }
    let timeLine = this.renderer.createElement(this.timeline.nativeElement, 'div');
    this.renderer.setElementClass(timeLine, 'time-line', true);
    this.renderer.setElementStyle(timeLine, 'height', `${height}px`);
    // 86400000 = 1000 * 60 * 60 * 24 milliseconds      604800000 milliseconds = 1000 * 60 * 60 * 24 * 7
    // let msWidth: number = (this.scheduleView === this.availableView.day) ? 86400000 : 604800000;
    let msWidth;
    if (this.scheduleView === this.availableView.day) {
      msWidth = 86400000;
    } else if (this.scheduleView === this.availableView.week) {
      msWidth = 604800000;
    } else if (this.scheduleView === this.availableView.month) {
      msWidth = 1000 * 60 * 60 * 24 * (this.monthDays.length + 1);
    }

    let fromStart = moment().valueOf() - this.start.valueOf();

    this.renderer.setElementStyle(timeLine, 'left', `${(Math.ceil(width / (msWidth / fromStart))) - 1}px`);
    let lines = $('.time-line');
    if (lines.length === 2) { lines.first().remove(); }
  }

  private render(): void {
    // debugger;
    // height of timeline row
    let top = 42;
    let timelineWrap: any = this.elRef.nativeElement.querySelector('.timeline-wrap');
    // get full width of timeline row
    let width = (timelineWrap.getBoundingClientRect().width) < 720 ? 720 : timelineWrap.getBoundingClientRect().width;

    // remove all previos events
    $('.schedule-event-box').remove();

    const drawLine = (scheduleEvent, color) => {
      let line = Object.assign({}, scheduleEvent);
      let ratio, leftRatio: number;

      let msWidth: number;
      if (this.scheduleView === this.availableView.day) {
        msWidth = 86400000;
      } else if (this.scheduleView === this.availableView.week) {
        msWidth = 604800000;
      } else if (this.scheduleView === this.availableView.month) {
        msWidth = 1000 * 60 * 60 * 24 * (this.monthDays.length);
      }

      // event is not in view range
      if (line.end < this.start || this.end < line.start) { return; }
      // make event the same width as timeline for selected view
      if (line.start < this.start) { line.start = new Date(this.start.toString()); }
      if (line.end > this.end) { line.end = new Date(this.end.toString()); }
      let duration = line.end.getTime() - line.start.getTime();
      ratio = msWidth / duration;
      let fromDayStart = line.start.getTime() - this.start.valueOf();
      leftRatio = msWidth / fromDayStart;
      let vLine = this.renderer.createElement(this.timeline.nativeElement, 'div');
      let text = this.renderer.createElement(this.timeline.nativeElement, 'div');
      this.renderer.setElementClass(vLine, 'v-line', true);
      this.renderer.setElementClass(text, 'text-record', true);
      let eventLine = this.renderer.createElement(this.timeline.nativeElement, 'div');
      this.renderer.projectNodes(eventLine, [vLine]);
      this.renderer.projectNodes(eventLine, [text]);
      this.renderer.setElementClass(eventLine, 'schedule-event-box', true);

      this.renderer.setElementStyle(eventLine, 'width', `${Math.round(width / ratio)}px`);

      let textLineObj: any = line.plStatus ? findPlaylistById(this.playlists, line.playlist_id) : getMediaByUrl(this.images, this.videos, this.webPages, line.url);
      if (textLineObj) { this.renderer.createText(text, line.plStatus ? textLineObj.list_name : textLineObj.name); }
      this.renderer.listen(eventLine, 'click', (event) => {
        let scrollTop = Math.max(window.pageYOffset, this.document.body.scrollTop);
        this.parent.clear();
        let component = this.eventDetailsService
          .createEventDetails(this.parent, {
            color: color.toString(),
            top: ((window.innerHeight - event.clientY) < 380) ? (event.clientY - 45 - 75) + this.document.body.scrollTop - (380 - (window.innerHeight - event.clientY)) : (event.clientY - 42 - 75 - 15) + this.document.body.scrollTop,
            left: (event.clientX + 375 < window.innerWidth) ? event.clientX + 25 : event.clientX - 365,
            target: line.name,
            media: getMediaByUrl(this.images, this.videos, this.webPages, line.url),
            playlist: findPlaylistById(this.playlists, line.playlist_id),
            constant_play: line.constant_play,
            usePlaylist: line.plStatus,
            start: ((scheduleEvent.end - scheduleEvent.start) < (1000 * 60 * 60 * 24)) ? moment(scheduleEvent.start).format('LT') : moment(scheduleEvent.start).format('l'),
            end: ((scheduleEvent.end - scheduleEvent.start) < (1000 * 60 * 60 * 24)) ? moment(scheduleEvent.end).format('LT') : moment(scheduleEvent.end).format('l'),
          });
        component.instance.clickOutside.subscribe((event) => {
          if (event.value) { this.parent.clear(); }
        })
        component.instance.deleteEvent.subscribe((event) => {
          this.parent.clear();
          this.deleteEvent.emit(line);
        })
        component.instance.chengeEvent.subscribe((event) => {
          this.parent.clear();
          this.changeEvent.emit(scheduleEvent);
        })
      });
      this.renderer.setElementStyle(eventLine, 'background', color);
      this.renderer.setElementStyle(eventLine, 'left', `${Math.round(width / leftRatio)}px`);
      this.renderer.setElementStyle(eventLine, 'top', `${top}px`);
    }

    // Draw all events
    this.selectedCategoryEvents.forEach((event: any) => {
      event.events.forEach((e: any) => {
        let isDevice = event === targetTypes.device;
        let eventToDraw = Object.assign(e, {
          start: new Date(moment(e.start).valueOf()),
          end: new Date(moment(e.end).valueOf()),
          name: event.tv_name ? event.tv_name : event.name,
          url: e.URL,
          playlist_id: e.playlists_status ? e.playlist_id : e.playlist_id,
        })
        drawLine(eventToDraw, e.color);
      })
      top += 45;
    })

    this.drawCurrentTimeLine(this.selectedCategoryEvents.length * 45);

    let datePicker = $('[data-toggle="datepicker"]');
    setTimeout(() => {
      let text;
      // let text = (this.scheduleView === this.availableView.day) ?
      //   moment(this.getFormattedDate()).format('dddd, MMMM DD, YYYY')
      //   : moment(this.getFormattedDate()).startOf('week').format('MMM DD, YYYY') + ' - ' + moment(this.getFormattedDate()).endOf('week').format('MMM DD, YYYY');

      if (this.scheduleView === this.availableView.day) {
        text = moment(this.getFormattedDate()).format('dddd, MMMM DD, YYYY');
      } else if (this.scheduleView === this.availableView.week) {
        text = moment(this.getFormattedDate()).startOf('week').format('MMM DD, YYYY') + ' - ' + moment(this.getFormattedDate()).endOf('week').format('MMM DD, YYYY');
      } else {
        text = moment(this.getFormattedDate()).format('MMMM');
      }

      datePicker.text('');
      datePicker.text(text);
    }, 0)
  }

  public switchScheduleView(view: string): void {
    this.scheduleView = this.availableView[view];
    if (this.scheduleView === this.availableView.week) {
      this.scheduleViewTimiline = this.weekDays;
    } else if (this.scheduleView === this.availableView.month) {
      this.scheduleViewTimiline = this.monthDays;
    } else {
      this.scheduleViewTimiline = this.hours;
    }


    // this.scheduleViewTimiline = (this.scheduleView === this.availableView.week ? this.weekDays : this.hours);
    this.pickDate();
    this.render();
  }

  public selectCategory(event, category: string): void {
    if (this.selectedCategory === category) { return; }
    this.selectedCategory = category;
    this.selectedCategoryEvents = (category === targetTypes.device ? this.deviceEvents : this.groupEvents);
    this.render();
  }

  private getFormattedDate(): string {
    let date = $('[data-toggle="datepicker"]').datepicker('getDate');
    let datePickersDate = moment(`${date.getFullYear()}-${(date.getMonth() + 1 < 10) ? '0' + (date.getMonth() + 1) : date.getMonth() + 1}-${(date.getDate() < 10) ? '0' + date.getDate() : date.getDate()}`);
    return datePickersDate.format('YYYY-MM-DD');
  }

  private pickDate(): void {
    let formatedDate = this.getFormattedDate();
    this.start = moment(formatedDate).startOf(this.scheduleView);
    this.end = moment(formatedDate).endOf(this.scheduleView);
    this.date = moment(formatedDate);
  }

  public move(direction: number): void {
    let range = 'days';
    if (this.scheduleView === this.availableView.month) {
      range = 'months';
      this.date = this.date.add(direction, range);
      this.generateMonthDays(this.date);
      this.render();
      // It's dublicate bellow line... it's bad

    } else {
      direction = (this.scheduleView === this.availableView.week) ? (direction * 7) : direction;
      this.date = this.date.add(direction, range);
    }


    $('[data-toggle="datepicker"]').datepicker('setDate', this.date.format('MM/DD/YYYY'));
  }

  public setTodaysDate(): void {
    let datePicker = $('[data-toggle="datepicker"]');
    datePicker.datepicker('reset');
    datePicker.datepicker('setDate', moment().format('MM-DD-YYYY'));
    datePicker.text(moment(this.getFormattedDate()).format('dddd') + ', ' + datePicker.text());
  }

  public clearEvents(event): void {
    this.clearAllEvents.emit(event);
  }

}
