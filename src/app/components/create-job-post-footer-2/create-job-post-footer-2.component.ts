import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'create-job-post-footer2',
  templateUrl: 'create-job-post-footer-2.component.html',
  styleUrls: ['create-job-post-footer-2.component.css'],
})
export class CreateJobPostFooter2 {
  @ContentChild('button2')
  button2: TemplateRef<any>
  
  @ContentChild('button11')
  button11: TemplateRef<any>
  
  @ContentChild('button12')
  button12: TemplateRef<any>
  
  @ContentChild('button122')
  button122: TemplateRef<any>
  
  @Input()
  rootClassName: string = ''
  
  @ContentChild('button')
  button: TemplateRef<any>
  
  @ContentChild('button1')
  button1: TemplateRef<any>

  /**
   * This input receives the boolean state from the parent component
   * to control whether the 'Next' button should be disabled.
   * Defaults to 'false' (enabled).
   */
  @Input() 
  isNextDisabled: boolean = false;

  constructor() {}
}