import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
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
  templateUrl: 'profile-overview-page.component.html',
  styleUrls: ['profile-overview-page.component.css'],
})
export class ProfileOverviewPage implements OnInit, OnDestroy {
  currentStep: number = 1; // Start at step 1 (Basic Information)

  // Basic Information
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phoneNumber: string = '';
  profilePicture: File | null = null;
  resume: File | null = null;
  resumeName: string = ''; // Track resume file name
  imageSrc: string = '';
  defaultImageSrc: string = 'https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg';
  @ViewChild('profilePictureInput') profilePictureInput!: ElementRef<HTMLInputElement>;
  @ViewChild('resumeInput') resumeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('profileComponent') profileComponent!: ProfileBasicinformationComponent;
  @ViewChild('employmentComponent') employmentComponent!: ProfileEmploymentComponent;
  @ViewChild('educationComponent') educationComponent!: ProfileEducationComponent;
  @ViewChild('certificationComponent') certificationComponent!: ProfileCertificationsComponent;
  
  // Employment
  positions: any[] = [{ jobTitle: '', companyName: '', startDate: '', endDate: '', jobDetails: '' }];

  // Education
  educationForm: FormGroup;

  // Certifications
  certificationForm: FormGroup;
  todayDate: string;

  constructor(
    private title: Title,
    private meta: Meta,
    private profileService: ProfileService,
    private employmentService: EmploymentService,
    private educationService: EducationService,
    private certificationService: CertificationService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private router: Router,
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

    // Initialize Education form
    this.educationForm = this.fb.group({
      educations: this.fb.array([this.createEducationGroup()]),
    });

    // Initialize Certifications form
    this.certificationForm = this.fb.group({
      certifications: this.fb.array([this.createCertificationGroup()]),
    });
    this.todayDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    // Load Basic Information from local storage
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      const userProfile = JSON.parse(profileData);
      this.firstName = userProfile.first_name || '';
      this.lastName = userProfile.last_name || '';
      this.email = userProfile.email || '';
      this.phoneNumber = userProfile.phone_number || '';
      this.imageSrc = userProfile.profile_picture_url || '';
    }
  }

  ngOnDestroy() {
    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }
  }

  // --- Basic Information ---
  triggerProfilePictureUpload() {
    console.log('Triggering profile picture upload');
    this.profilePictureInput.nativeElement.click();
  }
  
  triggerResumeUpload() {
    console.log('Triggering resume upload');
    this.resumeInput.nativeElement.click();
  }

  onProfilePictureSelected(event: any) {
    console.log('Profile picture selection triggered', event);

    // Check if files are present in the event
    if (!event.target.files || event.target.files.length === 0) {
      console.warn('No file selected for profile picture');
      return;
    }

    const file = event.target.files[0];
    console.log('Selected file:', file);
    if (file && this.validateFile(file, ['image/jpeg', 'image/jpg', 'image/png'], 5)) {
      console.log('Profile picture validation passed');
      this.profilePicture = file;
      this.imageSrc = URL.createObjectURL(file);
      console.log('Profile picture set:', this.profilePicture);
    } else {
      console.warn('Invalid profile picture');
      alert('Invalid profile picture. Use JPG, JPEG, or PNG. Max 5MB.');
      this.profilePictureInput.nativeElement.value = '';
    }
  }

  onResumeSelected(event: any) {
    console.log('Resume selected', event);
    // Check if files are present in the event
    if (!event.target.files || event.target.files.length === 0) {
      console.warn('No file selected for resume');
      return;
    }
    
    const file = event.target.files[0];
    console.log('Selected file:', file);
    if (
      file &&
      this.validateFile(
        file,
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        1
      )
    ) {
      console.log('Resume validation passed');
      this.resume = file;
      this.resumeName = file.name;
      console.log('Resume set:', this.resume);
    } else {
      console.warn('Invalid resume');
      alert('Invalid resume. Use PDF or Word (.doc, .docx). Max 1MB.');
      this.resumeInput.nativeElement.value = '';
    }
  }

  validateFile(file: File, allowedTypes: string[], maxSizeMB: number): boolean {
    console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
    const maxSize = maxSizeMB * 1024 * 1024;
    const isValidType = allowedTypes.includes(file.type);
    const isValidSize = file.size <= maxSize;
    console.log('Valid type:', isValidType, 'Valid size:', isValidSize);
    return isValidType && isValidSize;
  }

  async saveBasicInformation(): Promise<boolean> {
    console.log('Saving basic information');
    const formData = new FormData();

    console.log('Profile Picture:', this.profilePicture);
    console.log('Resume:', this.resume);

    if (this.profilePicture) {
      console.log('Appending profile picture to form data');
      formData.append('profile_picture', this.profilePicture);
    }
    if (this.resume) {
      console.log('Appending resume to form data');
      formData.append('resume', this.resume);
    }
  
    console.log('Form data:', formData);
  
    try {
      console.log('Calling profileService.saveProfile');
      await this.profileService.saveProfile(formData).toPromise();
      console.log('Profile saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving profile', error);
      console.error('Error details:', error.error);
      alert('Error saving profile: ' + (error.error?.detail || 'Unknown error'));
      return false;
    }
  }

  // --- Employment ---
  addPosition() {
    this.positions.push({ jobTitle: '', companyName: '', startDate: '', endDate: '', jobDetails: '' });
  }

  removePosition(index: number) {
    if (this.positions.length > 1) {
      this.positions.splice(index, 1);
    }
  }

  async saveEmployment() {
    // Filter out empty positions
    const validPositions = this.positions.filter(
      (pos) => pos.jobTitle || pos.companyName || pos.startDate || pos.endDate || pos.jobDetails
    );

    try {
      if (validPositions.length > 0) {
        await this.employmentService.saveEmployment(validPositions).toPromise();
      }
      this.positions = [{ jobTitle: '', companyName: '', startDate: '', endDate: '', jobDetails: '' }];
      return true;
    } catch (error) {
      console.error('Error saving employment:', error);
      alert('Failed to save employment. Please try again.');
      return false;
    }
  }

  // --- Education ---
  get educations() {
    return this.educationForm.get('educations') as FormArray;
  }

  createEducationGroup(): FormGroup {
    return this.fb.group({
      university: [''],
      educationLevel: [''],
      course: [''],
      specialization: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  addEducation() {
    this.educations.push(this.createEducationGroup());
  }

  removeEducation(index: number) {
    if (this.educations.length > 1) {
      this.educations.removeAt(index);
    }
  }

  async saveEducation() {
    const validEducations = this.educations.controls
      .map((ctrl) => ctrl.value)
      .filter(
        (edu) =>
          edu.university || edu.educationLevel || edu.course || edu.specialization || edu.startDate || edu.endDate
      );

    try {
      if (validEducations.length > 0) {
        const requests = validEducations.map((edu) =>
          this.educationService.addEducation({
            select_start_date: edu.startDate,
            select_end_date: edu.endDate,
            university: edu.university,
            education_level: edu.educationLevel,
            course: edu.course,
            specialization: edu.specialization,
          })
        );
        await forkJoin(requests).toPromise();
      }
      this.educations.clear();
      this.educations.push(this.createEducationGroup());
      return true;
    } catch (error) {
      console.error('Error saving education:', error);
      alert('Failed to save education. Please try again.');
      return false;
    }
  }

  // --- Certifications ---
  get certifications() {
    return this.certificationForm.get('certifications') as FormArray;
  }

  createCertificationGroup(): FormGroup {
    return this.fb.group({
      certificate_name: [''],
      issuing_institute: [''],
      issued_date: [''],
      renewal_date: [''],
      credentials: [''],
    });
  }

  addCertification() {
    this.certifications.push(this.createCertificationGroup());
  }

  removeCertification(index: number) {
    if (this.certifications.length > 1) {
      this.certifications.removeAt(index);
    }
  }

  async saveCertifications() {
    const validCerts = this.certifications.controls
      .map((ctrl) => ctrl.value)
      .filter(
        (cert) =>
          cert.certificate_name || cert.issuing_institute || cert.issued_date || cert.renewal_date || cert.credentials
      );

    try {
      if (validCerts.length > 0) {
        const requests = validCerts.map((cert) => this.certificationService.saveCertification(cert));
        this.spinner.show();
        await forkJoin(requests).toPromise();
      }
      this.certificationForm.reset();
      this.certifications.clear();
      this.certifications.push(this.createCertificationGroup());
      return true;
    } catch (error) {
      console.error('Error saving certifications:', error);
      alert('Failed to save certifications. Please try again.');
      return false;
    } finally {
      this.spinner.hide();
    }
  }

  // --- Navigation ---
  async onSaveAndNext() {
    let success = false;
    if (this.currentStep === 1) {
      success = await this.saveBasicInformation();
    } else if (this.currentStep === 2) {
      success = await this.saveEmployment();
    } else if (this.currentStep === 3) {
      success = await this.saveEducation();
    } else if (this.currentStep === 5) {
      success = await this.saveCertifications();
    }

    if (success && this.currentStep < 6) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.currentStep = 5; // Skip step 4
      }
    }
  }

  onPrevious() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 4) {
        this.currentStep = 3; // Skip step 4
      }
    }
  }

  onSkip() {
    if (this.currentStep < 6) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.currentStep = 5; // Skip step 4
      }
    }
  }

  isStepVisible(step: number): boolean {
    return this.currentStep === step;
  }
}
