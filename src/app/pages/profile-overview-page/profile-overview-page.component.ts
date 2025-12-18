import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ProfileService } from '../../services/profile.service';
import { EmploymentService } from '../../services/employment.service';
import { EducationService } from '../../services/education.service';
import { CertificationService } from '../../services/certification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { ProfileBasicinformationComponent } from '../../components/profile-basicinformation-component/profile-basicinformation-component.component';
import { ProfileEmploymentComponent } from '../../components/profile-employment-component/profile-employment-component.component';
import { ProfileEducationComponent } from '../../components/profile-education-component/profile-education-component.component';
import { ProfileCertificationsComponent } from '../../components/profile-certifications-component/profile-certifications-component.component';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView1 } from 'src/app/components/navbar-for-candidate-view1/navbar-for-candidate-view1.component';
import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { ProgressBarStep1 } from 'src/app/components/progress-bar-step-1/progress-bar-step-1.component';
import { ProgressBarStep2 } from 'src/app/components/progress-bar-step-2/progress-bar-step-2.component';
import { ProgressBarStep3 } from 'src/app/components/progress-bar-step-3/progress-bar-step-3.component';
import { ProgressBarStep4 } from 'src/app/components/progress-bar-step-4/progress-bar-step-4.component';
import { ProgressBarStep5 } from 'src/app/components/progress-bar-step-5/progress-bar-step-5.component';
import { ProfileCreationNavigation2 } from 'src/app/components/profile-creation-navigation2/profile-creation-navigation2.component';
import { BufferName1 } from 'src/app/components/buffer-name-1/buffer-name-1.component';

@Component({
  selector: 'profile-overview-page',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForCandidateView1, AlertMessageComponent,
    ProgressBarStep1, ProgressBarStep3, ProgressBarStep4,
    ProgressBarStep2, ProgressBarStep5, ProfileCreationNavigation2,
    ProfileBasicinformationComponent, ProfileEmploymentComponent,
    ProfileEducationComponent, ProfileCertificationsComponent,
    BufferName1,
  ],
  templateUrl: './profile-overview-page.component.html',
  styleUrls: ['./profile-overview-page.component.css'],
})
export class ProfileOverviewPage implements OnInit, OnDestroy, AfterViewInit {
  currentStep: number = 1;
  isSaving: boolean = false;
  
  // New Alert and Popup Properties
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  // Basic Information
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phoneNumber: string = '';
  profilePicture: File | null = null;
  resume: File | null = null;
  resumeName: string = '';
  imageSrc: string = '';
  defaultImageSrc: string = 'https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg';
  
  userType: 'candidate' | 'recruiter' | 'admin' = 'candidate'; // Default value
  isCandidate: boolean = true;

  navigationSource: 'candidate' | 'recruiter' = 'candidate'; // default

  @ViewChild('profilePictureInput') profilePictureInput!: ElementRef<HTMLInputElement>;
  @ViewChild('resumeInput') resumeInput!: ElementRef<HTMLInputElement>;

  @ViewChild('profileComponent') profileComponent!: ProfileBasicinformationComponent;
  @ViewChild('employmentComponent') employmentComponent!: ProfileEmploymentComponent;
  @ViewChild('educationComponent') educationComponent!: ProfileEducationComponent;
  @ViewChild('certificationComponent') certificationComponent!: ProfileCertificationsComponent;

  constructor(
    private title: Title,
    private meta: Meta,
    private profileService: ProfileService,
    private employmentService: EmploymentService,
    private educationService: EducationService,
    private certificationService: CertificationService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {
    this.title.setTitle('Profile Overview - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Profile Overview - Flashyre' },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
    console.log('ProfileOverviewPage constructor executed');
  }

  ngOnInit() {
    console.log('ngOnInit called');

     // Get userType from localStorage instead of navigation state
    const storedUserType = localStorage.getItem('userType');

    if (storedUserType && ['candidate', 'recruiter', 'admin'].includes(storedUserType)) {
      this.userType = storedUserType as 'candidate' | 'recruiter' | 'admin';
      console.log('User type set to:', this.userType);
    } else {
      this.userType = 'candidate'; // Fallback or default value
      console.log('No valid userType found in localStorage, defaulting to:', this.userType);
    }
    this.isCandidate = this.userType === 'candidate';

    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      try {
        const userProfile = JSON.parse(profileData);
        this.firstName = userProfile.first_name || '';
        this.lastName = userProfile.last_name || '';
        this.email = userProfile.email || '';
        this.phoneNumber = userProfile.phone_number || '';
        this.imageSrc = userProfile.profile_picture_url || '';
        console.log('Loaded user profile from localStorage:', userProfile);
      } catch (error) {
        console.error('Error parsing userProfile from localStorage:', error);
      }
    } else {
      console.log('No userProfile found in localStorage');
    }
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    console.log('Current step:', this.currentStep);
    console.log('profileComponent initialized:', !!this.profileComponent);
    console.log('employmentComponent initialized:', !!this.employmentComponent);
    console.log('educationComponent initialized:', !!this.educationComponent);
    console.log('certificationComponent initialized:', !!this.certificationComponent);
  }

  ngOnDestroy() {
    console.log('ngOnDestroy called');
    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
      console.log('Revoked object URL for imageSrc');
    }
  }

  // --- Popup Handling ---
  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000); // Auto-close after 3 seconds
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000); // Auto-close after 3 seconds
  }

  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
  }

  // --- Alert Handling ---
  openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    switch(action.toLowerCase()) {
      case 'save & next':
        this.onSaveAndNextConfirmed();
        break;
      case 'previous':
        this.onPreviousConfirmed();
        break;
      case 'skip':
        this.onSkipConfirmed();
        break;
      case 'cancel':
        // Do nothing
        break;
      case 'ok':
        // Do nothing, just close the alert
        break;
    }
  }

  handleAlertRequest(eventData: { message: string; buttons: string[] }): void {
    // This function receives the error message from the child component
    // and uses the parent's existing 'openAlert' method to display it.
    this.openAlert(eventData.message, eventData.buttons);
  }


    // --- MODIFICATION START ---
  // This new handler is triggered when the employment component detects a short date range.
  handleDateConfirmationRequest(): void {
    this.openAlert('Is your entered Start Date and End Date correct?', ['OK']);
  }
  // --- MODIFICATION END ---

  // --- Navigation ---
    onSaveAndNext() {
    let formIsEmpty = false;
    let hasDeletions = false; // Variable to hold the deletion state
    
    // Check the state of the form for the current step
    switch (this.currentStep) {
      case 2: // Employment
        if (this.employmentComponent) {
          formIsEmpty = this.employmentComponent.isFormEmpty();

          hasDeletions = this.employmentComponent.hasPendingDeletions;
          // --- MODIFICATION START ---
          // Before showing the save confirmation, check if there's a short employment duration.
          // If so, show the date warning instead of the regular save/skip prompt.
          if (this.employmentComponent.checkForShortEmploymentDurations()) {
            this.openAlert('Is your entered Start Date and End Date correct?', ['Cancel', 'Save & Next']);
            return; // Stop further execution to wait for user input.

        }}
        break;
      case 3: // Education
        if (this.educationComponent) {
          formIsEmpty = this.educationComponent.isFormEmpty();
          // Check the new public property from the child component
          hasDeletions = this.educationComponent.hasPendingDeletions;
        }
        break;
      case 5: // Certifications
        if (this.certificationComponent) {
          formIsEmpty = this.certificationComponent.isFormEmpty();
        }
        break;
      // Step 1 (Basic Info) doesn't have a traditional form, so we always treat it as a "save" action.
      default:
        formIsEmpty = false;
        break;
    }

    // If the form is empty, show the "skip" confirmation pop-up.
    // Otherwise, show the regular "save" confirmation pop-up.
    if (formIsEmpty && !hasDeletions) {
      this.openAlert('Are you sure you want to skip this step?', ['Cancel', 'Skip']);
    } else {
      this.openAlert('Do you want to save your changes and proceed?', ['Cancel', 'Save & Next']);
    }
  }

  onPrevious() {
    this.openAlert('Are you sure you want to go to the previous step?', ['Cancel', 'Previous']);
  }

  onSkip() {
    this.openAlert('Are you sure you want to skip this step?', ['Cancel', 'Skip']);
  }

  // --- Confirmed Actions ---
  async onSaveAndNextConfirmed() {
    console.log('onSaveAndNext confirmed, currentStep:', this.currentStep);
    this.isSaving = true;
    let wasSaveSuccessful = false;

    try {
      // --- Step 1: Perform validation and save data based on the current step ---
      switch (this.currentStep) {
        case 1:
          // First, validate. If it fails, exit immediately.
          if (!this.profileComponent || !this.profileComponent.validateInputs()) {
            this.isSaving = false;
            return;
          }
          const result = await this.profileComponent.saveProfile();
          wasSaveSuccessful = result.success;
          if (result.success) {
            this.showSuccessPopup("Successfully Saved");
          } else {
            this.showErrorPopup(result.message || 'Failed to save profile.');
          }
          break;
        case 2:
          wasSaveSuccessful = await this.employmentComponent.saveEmployment();
          if (wasSaveSuccessful) this.showSuccessPopup("Successfully Saved"); else this.showErrorPopup('Failed to save employment details.');
          break;
        case 3:
          wasSaveSuccessful = await this.educationComponent.saveEducation();
          if (wasSaveSuccessful) this.showSuccessPopup("Successfully Saved"); else this.showErrorPopup('Failed to save education details.');
          break;
        case 5:
          wasSaveSuccessful = await this.certificationComponent.saveCertifications();
          if (wasSaveSuccessful) {
            this.showSuccessPopup("Successfully Saved");
          } else {
            this.showErrorPopup("Failed to upload");
          }
          break;
      }

      // --- Step 2: Navigate to the next step ONLY if the save was successful ---
      if (wasSaveSuccessful) {
        if (this.currentStep === 5) {
          // Special case for the last step to navigate away
          setTimeout(() => {
            if (this.userType === 'recruiter') this.router.navigate(['job-post-list']);
            else this.router.navigate(['candidate-home']);
          }, 3000);
        } else if (this.currentStep < 6) {
          // For all other steps, advance to the next one
          this.currentStep++;
          if (this.currentStep === 3 && !this.isCandidate) {
            this.currentStep = 5; // Skip Education step for non-candidates
          } else if (this.currentStep === 4) {
            this.currentStep = 5; // Skip step 4 (existing logic)
          }
        }
      }
    } catch (error) {
      this.showErrorPopup('An unexpected error occurred.');
    } finally {
      this.isSaving = false;
    }
  }

  onPreviousConfirmed() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 4) {
        this.currentStep = 3; // Skip back over step 4
      }
      // If user is not a candidate and we landed on step 3, go back to step 2
      if (this.currentStep === 3 && !this.isCandidate) {
        this.currentStep = 2;
      }
    }
  }

  onSkipConfirmed() {
    if (this.currentStep < 6) {
      this.currentStep++;
      if (this.currentStep === 3 && !this.isCandidate) {
        this.currentStep = 5; // Skip Education step for non-candidates
      } else if (this.currentStep === 4) {
        this.currentStep = 5; // Skip step 4 (existing logic)
      }
    }
    if (this.currentStep >= 6) {
      setTimeout(() => {
        if (this.userType === 'recruiter') this.router.navigate(['job-post-list']);
        else this.router.navigate(['candidate-home']);
      }, 1000);
    }
  }

  isStepVisible(step: number): boolean {
    return this.currentStep === step;
  }
}