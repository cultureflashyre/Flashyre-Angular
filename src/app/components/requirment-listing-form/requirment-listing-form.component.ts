import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'requirment-listing-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requirment-listing-form.component.html',
  styleUrls: ['./requirment-listing-form.component.css'],
})
export class RequirmentListingFormComponent {
  @Input() companyNameInputPlaceholder5: string = 'Max Experience';

  @ContentChild('interviewProcessText') interviewProcessText: TemplateRef<any> | null = null;
  @ContentChild('credentialsText') credentialsText: TemplateRef<any> | null = null;
  @ContentChild('issuingDateText') issuingDateText: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder1: string = 'Enter Date';

  @ContentChild('submitText') submitText: TemplateRef<any> | null = null;

  @Input() jobTitleInputPlaceholder: string = 'Enter Job Description';

  @ContentChild('companyNameText1') companyNameText1: TemplateRef<any> | null = null;
  @ContentChild('text1') text1: TemplateRef<any> | null = null;
  @ContentChild('text4') text4: TemplateRef<any> | null = null;

  @Input() rootClassName: string = '';

  @ContentChild('selectText') selectText: TemplateRef<any> | null = null;

  @Input() uploadFileInputPlaceholder: string = 'Select file';
  @Input() dateInputPlaceholder2: string = 'Number of vacencies';

  @ContentChild('enterManuallyText') enterManuallyText: TemplateRef<any> | null = null;
  @ContentChild('renewalDateText') renewalDateText: TemplateRef<any> | null = null;
  @ContentChild('text5') text5: TemplateRef<any> | null = null;
  @ContentChild('jobTitleText1') jobTitleText1: TemplateRef<any> | null = null;
  @ContentChild('skillText') skillText: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder6: string = 'Min Salary';

  @ContentChild('certificateNameText') certificateNameText: TemplateRef<any> | null = null;
  @ContentChild('text3') text3: TemplateRef<any> | null = null;
  @ContentChild('issuingDateText1') issuingDateText1: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder3: string = 'Max Experience';

  @ContentChild('skillStarText') skillStarText: TemplateRef<any> | null = null;
  @ContentChild('companyNameText') companyNameText: TemplateRef<any> | null = null;

  @Input() dateInputPlaceholder1: string = 'Spoc';
  @Input() jobTitleInputPlaceholder1: string = 'Enter Client Name';

  @ContentChild('addSectionText') addSectionText: TemplateRef<any> | null = null;
  @ContentChild('text2') text2: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder4: string = 'Min Experience';
  @Input() companyNameInputPlaceholder7: string = 'Max Salary';

  @ContentChild('heading1') heading1: TemplateRef<any> | null = null;
  @ContentChild('removeSectionText') removeSectionText: TemplateRef<any> | null = null;
  @ContentChild('issuingDateText2') issuingDateText2: TemplateRef<any> | null = null;
  @ContentChild('text') text: TemplateRef<any> | null = null;
  @ContentChild('jobTitleText') jobTitleText: TemplateRef<any> | null = null;

  @Input() dateInputPlaceholder: string = 'Location';

  @ContentChild('selectText1') selectText1: TemplateRef<any> | null = null;

  @Input() jobTitleInputPlaceholder2: string = 'Enter Job Location';

  @ContentChild('selectText2') selectText2: TemplateRef<any> | null = null;
  @ContentChild('heading') heading: TemplateRef<any> | null = null;
  @ContentChild('text6') text6: TemplateRef<any> | null = null;
  @ContentChild('noteForFile') noteForFile: TemplateRef<any> | null = null;
  @ContentChild('text7') text7: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder: string = 'Enter Sub Client Name';

  @ContentChild('cancelText') cancelText: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder2: string = 'Min Experience';

  constructor() {}
}
