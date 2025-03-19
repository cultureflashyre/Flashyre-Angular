import { Component, Input, ContentChild, TemplateRef } from '@angular/core';

interface Education {
  startDate: string;
  endDate: string;
  university: string;
  level: string;
  course: string;
  specialization: string;
}

@Component({
  selector: 'profile-education-component',
  templateUrl: './profile-education-component.component.html',
  styleUrls: ['./profile-education-component.component.css'],
})
export class ProfileEducationComponent {
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text1112') text1112: TemplateRef<any>;
  
  @Input() rootClassName: string = '';

  educations: Education[] = [{
    startDate: '',
    endDate: '',
    university: '',
    level: '',
    course: '',
    specialization: ''
  }];

  constructor() {}

  addEducation() {
    this.educations.push({
      startDate: '',
      endDate: '',
      university: '',
      level: '',
      course: '',
      specialization: ''
    });
  }

  removeEducation(index: number) {
    if (this.educations.length > 1) {
      this.educations.splice(index, 1);
    }
  }
}