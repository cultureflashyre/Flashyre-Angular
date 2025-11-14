import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-details',
    templateUrl: 'details.component.html',
    styleUrls: ['details.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class Details {
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
