import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'recruiter-workflow-candidate-lists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-workflow-candidate-lists.component.html',
  styleUrls: ['./recruiter-workflow-candidate-lists.component.css'],
})
export class RecruiterWorkflowCandidateListsComponent {
  @ContentChild('text17') text17: TemplateRef<any> | null = null;
  @ContentChild('text19') text19: TemplateRef<any> | null = null;
  @ContentChild('text14') text14: TemplateRef<any> | null = null;
  @ContentChild('text8') text8: TemplateRef<any> | null = null;
  @ContentChild('selectAllText') selectAllText: TemplateRef<any> | null = null;
  @ContentChild('text18') text18: TemplateRef<any> | null = null;
  @ContentChild('text21') text21: TemplateRef<any> | null = null;
  @ContentChild('text27') text27: TemplateRef<any> | null = null;
  @ContentChild('startProcessText2') startProcessText2: TemplateRef<any> | null = null;
  @ContentChild('text28') text28: TemplateRef<any> | null = null;
  @ContentChild('text2') text2: TemplateRef<any> | null = null;
  @ContentChild('text12') text12: TemplateRef<any> | null = null;
  @ContentChild('text6') text6: TemplateRef<any> | null = null;

  @Input() rootClassName: string = '';

  @ContentChild('text23') text23: TemplateRef<any> | null = null;
  @ContentChild('heading1') heading1: TemplateRef<any> | null = null;
  @ContentChild('text7') text7: TemplateRef<any> | null = null;
  @ContentChild('text20') text20: TemplateRef<any> | null = null;
  @ContentChild('heading') heading: TemplateRef<any> | null = null;
  @ContentChild('text1') text1: TemplateRef<any> | null = null;
  @ContentChild('text4') text4: TemplateRef<any> | null = null;
  @ContentChild('text5') text5: TemplateRef<any> | null = null;
  @ContentChild('text15') text15: TemplateRef<any> | null = null;
  @ContentChild('text26') text26: TemplateRef<any> | null = null;
  @ContentChild('text13') text13: TemplateRef<any> | null = null;
  @ContentChild('text') text: TemplateRef<any> | null = null;
  @ContentChild('text16') text16: TemplateRef<any> | null = null;
  @ContentChild('text24') text24: TemplateRef<any> | null = null;
  @ContentChild('startProcessText1') startProcessText1: TemplateRef<any> | null = null;
  @ContentChild('text25') text25: TemplateRef<any> | null = null;
  @ContentChild('text10') text10: TemplateRef<any> | null = null;
  @ContentChild('text9') text9: TemplateRef<any> | null = null;
  @ContentChild('text29') text29: TemplateRef<any> | null = null;
  @ContentChild('text11') text11: TemplateRef<any> | null = null;
  @ContentChild('text22') text22: TemplateRef<any> | null = null;
  @ContentChild('text3') text3: TemplateRef<any> | null = null;
}
