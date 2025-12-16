import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'date-selector2-duplicate',
    templateUrl: 'date-selector2-duplicate.component.html',
    styleUrls: ['date-selector2-duplicate.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, FormsModule],
})
export class DateSelector2Duplicate {
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text31')
  text31: TemplateRef<any>
  constructor() {}
}
