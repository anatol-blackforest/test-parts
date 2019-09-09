import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent implements OnInit {

  public currentTemplate: string = '';
  public error: string = '';

  constructor(
    private location: Location,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.error = this.route.snapshot.data.error;
    this.currentTemplate = this.location.path().slice(1);
  }

}
