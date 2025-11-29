import {
  Component,
  Input,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'recruiter-workflow-client-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-workflow-client-list.component.html',
  styleUrls: ['./recruiter-workflow-client-list.component.css'],
})
export class RecruiterWorkflowClientListComponent {
  @ContentChild('startProcessText') startProcessText: TemplateRef<any> | null = null;
  @ContentChild('text8') text8: TemplateRef<any> | null = null;
  @ContentChild('text14') text14: TemplateRef<any> | null = null;
  @ContentChild('heading1') heading1: TemplateRef<any> | null = null;
  @ContentChild('text16') text16: TemplateRef<any> | null = null;
  @ContentChild('heading') heading: TemplateRef<any> | null = null;
  @ContentChild('text15') text15: TemplateRef<any> | null = null;
  @ContentChild('text6') text6: TemplateRef<any> | null = null;
  @ContentChild('text1') text1: TemplateRef<any> | null = null;
  @ContentChild('text3') text3: TemplateRef<any> | null = null;
  @ContentChild('text13') text13: TemplateRef<any> | null = null;
  @ContentChild('text2') text2: TemplateRef<any> | null = null;
  @ContentChild('text17') text17: TemplateRef<any> | null = null;
  @ContentChild('text4') text4: TemplateRef<any> | null = null;
  @ContentChild('text12') text12: TemplateRef<any> | null = null;
  @ContentChild('text10') text10: TemplateRef<any> | null = null;
  @ContentChild('text') text: TemplateRef<any> | null = null;
  @ContentChild('text5') text5: TemplateRef<any> | null = null;
  @ContentChild('text9') text9: TemplateRef<any> | null = null;

  @Input() rootClassName: string = '';

  @ContentChild('text11') text11: TemplateRef<any> | null = null;
  @ContentChild('heading3') heading3: TemplateRef<any> | null = null;
  @ContentChild('text91') text91: TemplateRef<any> | null = null;
  @ContentChild('heading2') heading2: TemplateRef<any> | null = null;
  @ContentChild('text7') text7: TemplateRef<any> | null = null;
  @ContentChild('startProcessText1') startProcessText1: TemplateRef<any> | null = null;
}
