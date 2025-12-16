import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'date-selector1',
    templateUrl: 'date-selector1.component.html',
    styleUrls: ['date-selector1.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, FormsModule],
})
export class DateSelector1 {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  textinputPlaceholder: string = 'Name'
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
