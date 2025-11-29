import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'candidate-input-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-input-form.component.html',
  styleUrls: ['./candidate-input-form.component.css'],
})
export class CandidateInputFormComponent {
  @Input() jobTitleInputPlaceholder1: string = 'Enter Skills';

  @ContentChild('text6') text6: TemplateRef<any> | null = null;
  @ContentChild('selectText1') selectText1: TemplateRef<any> | null = null;
  @ContentChild('issuingDateText') issuingDateText: TemplateRef<any> | null = null;

  @Input() jobTitleInputPlaceholder5: string = 'Enter Job Location';

  @ContentChild('skillStarText') skillStarText: TemplateRef<any> | null = null;

  @Input() jobTitleInputPlaceholder3: string = 'Enter Phone Number';

  @ContentChild('noteForFile') noteForFile: TemplateRef<any> | null = null;
  @ContentChild('selectText') selectText: TemplateRef<any> | null = null;
  @ContentChild('text5') text5: TemplateRef<any> | null = null;

  @Input() uploadFileInputPlaceholder: string = 'Select file';
  @Input() companyNameInputPlaceholder4: string = 'Min Experience';
  @Input() companyNameInputPlaceholder2: string = 'Min Experience';
  @Input() jobTitleInputPlaceholder2: string = 'Enter Client Name';

  @ContentChild('text2') text2: TemplateRef<any> | null = null;
  @ContentChild('selectText2') selectText2: TemplateRef<any> | null = null;

  @Input() jobTitleInputPlaceholder4: string = 'Enter Job Location';

  @ContentChild('heading') heading: TemplateRef<any> | null = null;
  @ContentChild('skillStarText1') skillStarText1: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder6: string = 'Min Salary';
  @Input() rootClassName: string = '';

  @ContentChild('jobTitleText3') jobTitleText3: TemplateRef<any> | null = null;
  @ContentChild('jobTitleText') jobTitleText: TemplateRef<any> | null = null;

  @Input() jobTitleInputPlaceholder: string = 'Enter Work Experience';
  @Input() companyNameInputPlaceholder7: string = 'Max Salary';

  @ContentChild('text7') text7: TemplateRef<any> | null = null;
  @ContentChild('issuingDateText1') issuingDateText1: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder: string = 'Enter Sub Client Name';
  @Input() companyNameInputPlaceholder5: string = 'Max Experience';

  @ContentChild('text') text: TemplateRef<any> | null = null;
  @ContentChild('heading1') heading1: TemplateRef<any> | null = null;
  @ContentChild('certificateNameText') certificateNameText: TemplateRef<any> | null = null;
  @ContentChild('companyNameText1') companyNameText1: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder3: string = 'Max Experience';

  @ContentChild('text1') text1: TemplateRef<any> | null = null;

  @Input() companyNameInputPlaceholder1: string = 'Enter Email';

  @ContentChild('cancelText') cancelText: TemplateRef<any> | null = null;
  @ContentChild('skillText') skillText: TemplateRef<any> | null = null;
  @ContentChild('enterManuallyText') enterManuallyText: TemplateRef<any> | null = null;
  @ContentChild('text4') text4: TemplateRef<any> | null = null;
  @ContentChild('renewalDateText') renewalDateText: TemplateRef<any> | null = null;
  @ContentChild('text3') text3: TemplateRef<any> | null = null;
  @ContentChild('skillText1') skillText1: TemplateRef<any> | null = null;
  @ContentChild('companyNameText') companyNameText: TemplateRef<any> | null = null;
  @ContentChild('jobTitleText1') jobTitleText1: TemplateRef<any> | null = null;
  @ContentChild('jobTitleText2') jobTitleText2: TemplateRef<any> | null = null;
  @ContentChild('issuingDateText2') issuingDateText2: TemplateRef<any> | null = null;
  @ContentChild('submitText') submitText: TemplateRef<any> | null = null;
  @ContentChild('credentialsText') credentialsText: TemplateRef<any> | null = null;

  constructor() {}
}
