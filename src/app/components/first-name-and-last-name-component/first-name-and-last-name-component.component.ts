import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'first-name-and-last-name-component',
    templateUrl: 'first-name-and-last-name-component.component.html',
    styleUrls: ['first-name-and-last-name-component.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class FirstNameAndLastNameComponent {
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  textinputPlaceholder: string = 'First Name'
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  textinputPlaceholder1: string = 'Last Name'
  constructor() {}
}
