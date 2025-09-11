import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-morefilterscomponent1',
  templateUrl: 'morefilterscomponent1.component.html',
  styleUrls: ['morefilterscomponent1.component.css'],
})
export class Morefilterscomponent1 {
  // ContentChild for labels and button texts
  @ContentChild('text') text: TemplateRef<any>; // Header text
  @ContentChild('text11') text11: TemplateRef<any>; // Date Posted label
  @ContentChild('text114') text114: TemplateRef<any>; // Experience Level label
  @ContentChild('text118') text118: TemplateRef<any>; // Company Name label
  @ContentChild('text1144') text1144: TemplateRef<any>; // Job Type label
  @ContentChild('text117') text117: TemplateRef<any>; // Location label
  @ContentChild('text1143') text1143: TemplateRef<any>; // Role label
  @ContentChild('text116') text116: TemplateRef<any>; // Salary label
  @ContentChild('text1142') text1142: TemplateRef<any>; // Work Mode label
  @ContentChild('text115') text115: TemplateRef<any>; // Department label
  @ContentChild('text1141') text1141: TemplateRef<any>; // Industries label
  @ContentChild('button') button: TemplateRef<any>; // Reset button text
  @ContentChild('button1') button1: TemplateRef<any>; // Apply Filters button text
  @ContentChild('button2') button2: TemplateRef<any>; // Save Preference button text

  // ContentChild for form elements (added to fix errors)
  @ContentChild('text31') text31: TemplateRef<any>; // Date Posted select
  @ContentChild('text314') text314: TemplateRef<any>; // Experience Level select
  @ContentChild('text318') text318: TemplateRef<any>; // Company Name input
  @ContentChild('text3144') text3144: TemplateRef<any>; // Job Type select
  @ContentChild('text317') text317: TemplateRef<any>; // Location input
  @ContentChild('text3143') text3143: TemplateRef<any>; // Role select
  @ContentChild('text316') text316: TemplateRef<any>; // Salary select
  @ContentChild('text3142') text3142: TemplateRef<any>; // Work Mode select
  @ContentChild('text315') text315: TemplateRef<any>; // Department select
  @ContentChild('text3141') text3141: TemplateRef<any>; // Industries select

  @Input() rootClassName: string = '';

  // Filter properties
  filterDatePosted: string = '';
  filterExperienceLevel: string = '';
  filterDepartment: string = '';
  filterSalary: string = '';
  filterLocation: string = '';
  filterCompanyName: string = '';
  filterIndustries: string = '';
  filterWorkMode: string = '';
  filterRole: string = '';
  filterJobType: string = '';

  // Outputs for actions
  @Output() applyFiltersEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() savePreferenceEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  resetFilters(): void {
    this.filterDatePosted = '';
    this.filterExperienceLevel = '';
    this.filterDepartment = '';
    this.filterSalary = '';
    this.filterLocation = '';
    this.filterCompanyName = '';
    this.filterIndustries = '';
    this.filterWorkMode = '';
    this.filterRole = '';
    this.filterJobType = '';
  }

  applyFilters(): void {
    const filters = {
      datePosted: this.filterDatePosted,
      experienceLevel: this.filterExperienceLevel,
      department: this.filterDepartment,
      salary: this.filterSalary,
      location: this.filterLocation,
      companyName: this.filterCompanyName,
      industries: this.filterIndustries,
      workMode: this.filterWorkMode,
      role: this.filterRole,
      jobType: this.filterJobType
    };
    this.applyFiltersEvent.emit(filters);
  }

  savePreference(): void {
    const filters = {
      datePosted: this.filterDatePosted,
      experienceLevel: this.filterExperienceLevel,
      department: this.filterDepartment,
      salary: this.filterSalary,
      location: this.filterLocation,
      companyName: this.filterCompanyName,
      industries: this.filterIndustries,
      workMode: this.filterWorkMode,
      role: this.filterRole,
      jobType: this.filterJobType
    };
    this.savePreferenceEvent.emit(filters);
  }
}