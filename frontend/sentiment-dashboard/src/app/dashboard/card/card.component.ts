import { Component, OnInit, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  host: {'class': 'card card-body mr-2'}
})
export class CardComponent implements OnInit {
  @Input() title: String = "";

  constructor() { }

  ngOnInit() {
  }

}
