import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-component2',
    templateUrl: 'component2.component.html',
    styleUrls: ['component2.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, FormsModule],
})
export class Component2 {
  @ContentChild('selectText')
  selectText: TemplateRef<any>
  @ContentChild('totalExperienceText')
  totalExperienceText: TemplateRef<any>
  @ContentChild('selectText1')
  selectText1: TemplateRef<any>
  @ContentChild('educationText')
  educationText: TemplateRef<any>
  @ContentChild('selectYearText')
  selectYearText: TemplateRef<any>
  @ContentChild('universityInstituteText')
  universityInstituteText: TemplateRef<any>
  @ContentChild('selectText2')
  selectText2: TemplateRef<any>
  @ContentChild('courseText')
  courseText: TemplateRef<any>
  @ContentChild('educationText1')
  educationText1: TemplateRef<any>
  constructor() {}
}
