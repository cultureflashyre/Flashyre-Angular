import { Component, Input, ContentChild, TemplateRef } from '@angular/core';

interface Employment {
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  jobDetails: string;
}

@Component({
  selector: 'profile-employment-component',
  templateUrl: './profile-employment-component.component.html',
  styleUrls: ['./profile-employment-component.component.css'],
})
export class ProfileEmploymentComponent {
  @ContentChild('text')
  text: TemplateRef<any>;
  @ContentChild('text311')
  text311: TemplateRef<any>;
  @ContentChild('text7')
  text7: TemplateRef<any>;
  @Input()
  rootClassName: string = '';
  @ContentChild('text12')
  text12: TemplateRef<any>;
  @ContentChild('text71')
  text71: TemplateRef<any>;
  @ContentChild('text3')
  text3: TemplateRef<any>;
  @ContentChild('text111')
  text111: TemplateRef<any>;

  employments: Employment[] = [{
    jobTitle: '',
    companyName: '',
    startDate: '',
    endDate: '',
    jobDetails: ''
  }];

  constructor() {}

  addEmployment() {
    this.employments.push({
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: ''
    });
  }

  removeEmployment(index: number) {
    if (this.employments.length > 1) {
      this.employments.splice(index, 1);
    }
  }
}