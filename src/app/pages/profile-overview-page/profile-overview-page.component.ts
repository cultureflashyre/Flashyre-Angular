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
  showSuccessPopup() {
    this.popupMessage = 'Successfully Saved';
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000); // Auto-close after 3 seconds
  }

  showErrorPopup() {
    this.popupMessage = 'Failed to upload';
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000); // Auto-close after 3 seconds
  }

  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
  }

  // --- Navigation ---
  async onSaveAndNext() {
    console.log('onSaveAndNext called, currentStep:', this.currentStep);
    this.isSaving = true;
    let success = false;

    // Move to next step immediately
    if (this.currentStep < 6) {
      const previousStep = this.currentStep;
      this.currentStep++;
      if (this.currentStep === 4) {
        console.log('Skipping step 4 as per logic.');
        this.currentStep = 5; // Skip step 4
      }
      console.log('Navigated to step:', this.currentStep);

      // Save data in the background
      try {
        switch (previousStep) {
          case 1:
            console.log('Saving profile information...');
            success = await this.profileComponent.saveProfile();
            console.log('Profile save result:', success);
            break;
          case 2:
            console.log('Saving employment information...');
            success = await this.employmentComponent.saveEmployment();
            console.log('Employment save result:', success);
            break;
          case 3:
            console.log('Saving education information...');
            success = await this.educationComponent.saveEducation();
            console.log('Education save result:', success);
            break;
          case 5:
            console.log('Saving certifications information...');
            success = await this.certificationComponent.saveCertifications();
            console.log('Certifications save result:', success);

            if (success) {
              this.showSuccessPopup();
            } else {
              this.showErrorPopup();
            }

            // Redirect to 'candidate-home' after 5 seconds regardless of success or failure
            setTimeout(() => {
              this.router.navigate(['candidate-home']);
            }, 3000);
            break;
          default:
            console.warn('Invalid step encountered:', previousStep);
            this.showErrorPopup();
            this.isSaving = false;
            return;
        }

        if (success) {
          console.log(`Step ${previousStep} saved successfully.`);
          this.showSuccessPopup();
        } else {
          console.warn(`Saving step ${previousStep} failed.`);
          this.showErrorPopup();
        }
      } catch (error) {
        console.error(`Exception caught during save at step ${previousStep}:`, error);
        this.showErrorPopup();
      } finally {
        this.isSaving = false;
        console.log('onSaveAndNext completed, isSaving set to false');
      }
    } else {
      this.isSaving = false;
    }
  }

  onPrevious() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 4) {
        console.log('Skipping step 4 on previous, moving back to step 3');
        this.currentStep = 3; // Skip step 4
      }
    }
    console.log('onPrevious called, currentStep:', this.currentStep);
  }

  onSkip() {
    if (this.currentStep < 6) {
      this.currentStep++;
      if (this.currentStep === 4) {
        console.log('Skipping step 4 on skip, moving forward to step 5');
        this.currentStep = 5; // Skip step 4
      }
    }
    console.log('onSkip called, currentStep:', this.currentStep);

    // If user has reached or passed the last step, navigate to candidate-home
    if (this.currentStep >= 6) {
      console.log('All steps skipped or completed, navigating to candidate-home');
      setTimeout(() => {
        this.router.navigate(['candidate-home']);
      }, 3000);
    }
  }

  isStepVisible(step: number): boolean {
    const visible = this.currentStep === step;
    console.log(`isStepVisible(${step}) called, returning:`, visible);
    return visible;
  }
}