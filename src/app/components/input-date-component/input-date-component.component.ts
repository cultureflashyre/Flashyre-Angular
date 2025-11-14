import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'input-date-component',
    templateUrl: 'input-date-component.component.html',
    styleUrls: ['input-date-component.component.css'],
    standalone: true,
    imports: [
        NgClass,
        NgTemplateOutlet,
        FormsModule,
    ],
})
export class InputDateComponent {
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
