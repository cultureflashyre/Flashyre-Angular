import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';import { CandidatePreferenceService } from '../../services/candidate-preference.service';
import { RecruiterPreferenceService } from 'src/app/services/recruiter-preference.service';
import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertMessageComponent } from '../alert-message/alert-message.component';

@Component({
    selector: 'app-morefilterscomponent1',
    templateUrl: 'morefilterscomponent1.component.html',
    styleUrls: ['morefilterscomponent1.component.css'],
    standalone: true,
    imports: [
        NgClass,
        NgTemplateOutlet,
        FormsModule,
        CommonModule,
        AlertMessageComponent,
    ],
})
export class Morefilterscomponent1 implements OnChanges {

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionToConfirm: string = '';

  experienceError: string = '';
  companyNameError: string = '';
  locationError: string = '';
  roleError: string = '';
  salaryError: string = '';
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
  @Input() preferenceToLoad: any;

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

  recJobType: string = '';

  // Outputs for actions
  @Output() applyFiltersEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() savePreferenceEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private preferenceService: CandidatePreferenceService,
    private recruiterPreferenceService: RecruiterPreferenceService
  ) {}

  @Input() callerType: 'candidate' | 'recruiter' = 'candidate';

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['callerType']) {
      if (this.callerType === 'recruiter') {
        console.log("[MORE FILTERS-1] callerType: ",this.callerType);
        this.recJobType = this.recruiterPreferenceService.getActiveTab();
        console.log("[MORE FILTERS-1] rec Job Type: ",this.recJobType);
      }
    }

    // Check if the 'preferenceToLoad' input has changed and has a value
    if (changes.preferenceToLoad && changes.preferenceToLoad.currentValue) {
      const data = changes.preferenceToLoad.currentValue;
      
      // Populate all the filter fields with data from the preference
      this.filterDatePosted = data.date_posted || '';
      this.filterExperienceLevel = data.experience_level || '';
      this.filterDepartment = data.department || '';
      this.filterSalary = data.salary || '';
      this.filterLocation = data.location || '';
      this.filterCompanyName = data.company_name || '';
      this.filterIndustries = data.industries || '';
      this.filterWorkMode = data.work_mode || '';
      this.filterRole = data.role || '';
      this.filterJobType = data.job_type || '';
    }
  }

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
    this.experienceError = '';
    this.companyNameError = '';
    this.locationError = '';
    this.roleError = '';
    this.salaryError = '';
  }

  applyFilters(): void {
    this.validateExperience();
    this.validateCompanyName();
    this.validateLocation();
    this.validateRole();
    this.validateSalary();

    // Check if any errors exist
    if (this.experienceError || this.companyNameError || this.locationError || this.roleError || this.salaryError) {
      return; // Stop execution if there's an error
    }

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
    this.validateExperience();
    this.validateCompanyName();
    this.validateLocation();
    this.validateRole();
    this.validateSalary();

    // Check if any errors exist
    if (this.experienceError || this.companyNameError || this.locationError || this.roleError || this.salaryError) {
      return; // Stop execution if there's an error
    }

    const filters = {
      date_posted: this.filterDatePosted,
      experience_level: this.filterExperienceLevel,
      department: this.filterDepartment,
      salary: this.filterSalary,
      location: this.filterLocation,
      company_name: this.filterCompanyName,
      industries: this.filterIndustries,
      work_mode: this.filterWorkMode,
      role: this.filterRole,
      job_type: this.filterJobType
    };

    // 1. Check if at least one field is filled
    if (Object.values(filters).every(value => value === '' || value === null)) {
      this.openAlert('Please fill in at least one field to save a preference.', ['OK'], 'info');
      return;
    }
    
    // 2. Determine which service to use
    const preferenceService = this.callerType === 'recruiter' 
      ? this.recruiterPreferenceService 
      : this.preferenceService;

    // 3. Check if the user has reached the preference limit
    preferenceService.getPreferences().subscribe(preferences => {
      if (preferences.length >= 3) {
        this.openAlert('You can only save up to 3 preferences.', ['OK'], 'info');
      } else {
        // 4. If checks pass, ask for final confirmation
        this.openAlert('Are you sure you want to save these filters as a new preference?', ['Cancel', 'Save'], 'save');
      }
    });
  }

  private confirmSavePreference(): void {
    const filters = {
      date_posted: this.filterDatePosted,
      experience_level: this.filterExperienceLevel,
      department: this.filterDepartment,
      salary: this.filterSalary,
      location: this.filterLocation,
      company_name: this.filterCompanyName,
      industries: this.filterIndustries,
      work_mode: this.filterWorkMode,
      role: this.filterRole,
      job_type: this.filterJobType
    };

    const successCallback = (response: any) => {
      console.log('Preference saved successfully!', response);
      this.savePreferenceEvent.emit(filters);
      this.openAlert('Preference saved!', ['OK'], 'success');
    };

    const errorCallback = (error: any) => {
      console.error('Error saving preference:', error);
      this.openAlert('Failed to save preference.', ['OK'], 'error');
    };

    if (this.callerType === 'recruiter') {
      this.recruiterPreferenceService.savePreference(filters, this.recJobType).subscribe({
        next: successCallback,
        error: errorCallback
      });
    } else {
      this.preferenceService.savePreference(filters).subscribe({
        next: successCallback,
        error: errorCallback
      });
    }
  }

  private openAlert(message: string, buttons: string[], action: string) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.actionToConfirm = action;
    this.showAlert = true;
  }

  onAlertButtonClicked(buttonClicked: string) {
    this.showAlert = false;
    const action = buttonClicked.toLowerCase();

    if (this.actionToConfirm === 'save' && action === 'save') {
        this.confirmSavePreference();
    }
    // For other actions ('ok', 'cancel'), we just need to close the dialog, which is already done.
  }

  validateExperience(): void {
    const numericRegex = /^[0-9]*$/;
    if (!numericRegex.test(this.filterExperienceLevel)) {
      this.experienceError = 'Experience Level must be a number.';
    } else {
      this.experienceError = '';
    }
  }

  validateCompanyName(): void {
    const charsRegex = /^[a-zA-Z\s]*$/;
    if (!charsRegex.test(this.filterCompanyName)) {
      this.companyNameError = 'Company Name must only contain characters.';
    } else {
      this.companyNameError = '';
    }
  }

  validateLocation(): void {
    const charsRegex = /^[^\d]*$/;
    if (!charsRegex.test(this.filterLocation)) {
      this.locationError = 'Location must only contain characters.';
    } else {
      this.locationError = '';
    }
  }

  validateRole(): void {
    const charsRegex = /^[a-zA-Z\s]*$/;
    if (!charsRegex.test(this.filterRole)) {
      this.roleError = 'Role must only contain characters.';
    } else {
      this.roleError = '';
    }
  }

  validateSalary(): void {
    const numericRegex = /^[0-9]*$/;
    if (!numericRegex.test(this.filterSalary)) {
      this.salaryError = 'Salary must be a number.';
    } else {
      this.salaryError = '';
    }
  }

}