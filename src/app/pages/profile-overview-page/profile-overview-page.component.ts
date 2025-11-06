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

@Component({
  selector: 'profile-overview-page',
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

    if (storedUserType === 'candidate' || storedUserType === 'recruiter') {
      this.navigationSource = storedUserType;
      console.log('Navigating from userType stored locally:', this.navigationSource);
    } else {
      // fallback or default value
      this.navigationSource = 'candidate';
      console.log('No userType found in localStorage, defaulting to:', this.navigationSource);
    }

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
    }
  }

  // --- Navigation ---
    onSaveAndNext() {
    let formIsEmpty = false;
    
    // Check the state of the form for the current step
    switch (this.currentStep) {
      case 2: // Employment
        if (this.employmentComponent) {
          formIsEmpty = this.employmentComponent.isFormEmpty();
        }
        break;
      case 3: // Education
        if (this.educationComponent) {
          formIsEmpty = this.educationComponent.isFormEmpty();
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
    if (formIsEmpty) {
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
            if (this.navigationSource === 'recruiter') this.router.navigate(['job-post-list']);
            else this.router.navigate(['candidate-home']);
          }, 3000);
        } else if (this.currentStep < 6) {
          // For all other steps, advance to the next one
          this.currentStep++;
          if (this.currentStep === 4) {
            this.currentStep = 5; // Skip step 4
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
        this.currentStep = 3; // Skip step 4
      }
    }
  }

  onSkipConfirmed() {
    if (this.currentStep < 6) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.currentStep = 5; // Skip step 4
      }
    }
    if (this.currentStep >= 6) {
      setTimeout(() => {
        if (this.navigationSource === 'recruiter') this.router.navigate(['job-post-list']);
        else this.router.navigate(['candidate-home']);
      }, 1000);
    }
  }

  isStepVisible(step: number): boolean {
    return this.currentStep === step;
  }
}