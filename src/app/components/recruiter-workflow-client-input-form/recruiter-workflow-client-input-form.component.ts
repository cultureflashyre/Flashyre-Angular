import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'recruiter-workflow-client-input-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-workflow-client-input-form.component.html',
  styleUrls: ['./recruiter-workflow-client-input-form.component.css'],
})
export class RecruiterWorkflowClientInputFormComponent {
  @Input() jobTitleInputPlaceholder1: string = 'Enter Job Title';
  @Input() rootClassName: string = '';

  @ContentChild('skillStarText') skillStarText: TemplateRef<any> | null = null;

  @Input() dateInputPlaceholder1: string = 'Spoc';
  @Input() jobTitleInputPlaceholder: string = 'Client Description';

  @ContentChild('jobTitleText') jobTitleText: TemplateRef<any> | null = null;

  @Input() dateInputPlaceholder3: string = 'Email';

  @ContentChild('cancelText') cancelText: TemplateRef<any> | null = null;

  @Input() dateInputPlaceholder2: string = 'Phone Number';

  @ContentChild('removeSectionText') removeSectionText: TemplateRef<any> | null = null;
  @ContentChild('companyNameText') companyNameText: TemplateRef<any> | null = null;

  @Input() dateInputPlaceholder: string = 'Location';
  @Input() companyNameInputPlaceholder: string = 'Enter Company Name';

  @ContentChild('skillText') skillText: TemplateRef<any> | null = null;
  @ContentChild('text') text: TemplateRef<any> | null = null;
  @ContentChild('addSectionText') addSectionText: TemplateRef<any> | null = null;
  @ContentChild('interviewProcessText') interviewProcessText: TemplateRef<any> | null = null;
  @ContentChild('submitText') submitText: TemplateRef<any> | null = null;
}
