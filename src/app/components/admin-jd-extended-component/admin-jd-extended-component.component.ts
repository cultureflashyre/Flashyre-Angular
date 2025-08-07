import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'admin-jd-extended-component',
  templateUrl: 'admin-jd-extended-component.component.html',
  styleUrls: ['admin-jd-extended-component.component.css'],
})
export class AdminJdExtendedComponent {
  @Input()
  noticePeriodInputFiledPlaceholder: string = 'Enter Notice Period'
  @ContentChild('skillText')
  skillText: TemplateRef<any>
  @ContentChild('noticePeriodStarText')
  noticePeriodStarText: TemplateRef<any>
  @ContentChild('relevantExperienceText')
  relevantExperienceText: TemplateRef<any>
  @ContentChild('totalExperienceText')
  totalExperienceText: TemplateRef<any>
  @Input()
  roleInputFieldPlaceholder: string = 'Enter Role'
  @ContentChild('locationText')
  locationText: TemplateRef<any>
  @ContentChild('locationStarText')
  locationStarText: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('universityInstituteText')
  universityInstituteText: TemplateRef<any>
  @ContentChild('roleText')
  roleText: TemplateRef<any>
  @ContentChild('roleStarText')
  roleStarText: TemplateRef<any>
  @ContentChild('skillStarText')
  skillStarText: TemplateRef<any>
  constructor() {}
}
