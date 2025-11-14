import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'more-filters-component',
    templateUrl: 'more-filters-component.component.html',
    styleUrls: ['more-filters-component.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, FormsModule],
})
export class MoreFiltersComponent {
  @ContentChild('text31311')
  text31311: TemplateRef<any>
  @ContentChild('text312')
  text312: TemplateRef<any>
  @ContentChild('text3111')
  text3111: TemplateRef<any>
  @ContentChild('text1112')
  text1112: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text1131')
  text1131: TemplateRef<any>
  @ContentChild('text111211')
  text111211: TemplateRef<any>
  @ContentChild('text313')
  text313: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text3112')
  text3112: TemplateRef<any>
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('text113')
  text113: TemplateRef<any>
  @ContentChild('text3131')
  text3131: TemplateRef<any>
  @ContentChild('text11311')
  text11311: TemplateRef<any>
  @ContentChild('text311211')
  text311211: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text31121')
  text31121: TemplateRef<any>
  @ContentChild('text11121')
  text11121: TemplateRef<any>
  @ContentChild('text311')
  text311: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text1111')
  text1111: TemplateRef<any>
  constructor() {}
}
