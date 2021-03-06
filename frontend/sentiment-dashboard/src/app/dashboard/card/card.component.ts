import { Component, OnInit, Input, HostBinding, Host } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  @HostBinding('class') classes = 'card card-body mr-sm-4 mb-2 mb-sm-4';
  @Input() title: String = '';

  constructor() { }

  ngOnInit() {
  }

}
