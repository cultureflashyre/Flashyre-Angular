import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'admin-candidate-sourced-component',
  templateUrl: 'admin-candidate-sourced-component.component.html',
  styleUrls: ['admin-candidate-sourced-component.component.css'],
})
export class AdminCandidateSourcedComponent {
  @ContentChild('selectAllText')
  selectAllText: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('text33')
  text33: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text34')
  text34: TemplateRef<any>
  @ContentChild('text32')
  text32: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text35')
  text35: TemplateRef<any>
  @ContentChild('startProcessText')
  startProcessText: TemplateRef<any>
  constructor() {}
}
