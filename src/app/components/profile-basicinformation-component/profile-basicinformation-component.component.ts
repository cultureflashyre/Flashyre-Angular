// FIXED Component.ts - Remove SafeUrl and keep it simple
import { Component, OnInit, Input, ContentChild, TemplateRef, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'profile-basicinformation-component',
  templateUrl: './profile-basicinformation-component.component.html',
  styleUrls: ['./profile-basicinformation-component.component.css'],
})
export class ProfileBasicinformationComponent implements OnInit {
  @Input() rootClassName: string = '';
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text51') text51: TemplateRef<any>;
  @ContentChild('text52') text52: TemplateRef<any>;

  @ViewChild('profilePictureInput') profilePictureInput!: ElementRef<HTMLInputElement>;
  @ViewChild('resumeInput') resumeInput!: ElementRef<HTMLInputElement>;

  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phoneNumber: string = '';
  profilePicture: File | null = null;
  resume: File | null = null;
  imageSrc: string = ''; // FIXED: Back to simple string
  defaultImageSrc: string = 'https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg';
  imageAlt: string = 'Profile Picture';

  constructor(
  private profileService: ProfileService, 
  private router: Router,
  private cdr: ChangeDetectorRef,
  private userProfileService: UserProfileService,
) {}
  ngOnInit() {
    console.log('Component initialized');
    console.log('Default image source:', this.defaultImageSrc);
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
          this.fetchUserDetails();
        }
      } else {
        this.fetchUserDetails();
      }
    }

  fetchUserDetails() {
    this.profileService.getUserDetails().subscribe(
      (response: any) => {
        this.firstName = response.first_name || '';
        this.lastName = response.last_name || '';
        this.email = response.email || '';
        this.phoneNumber = response.phone_number || '';
        this.imageSrc = response.profile_picture_url || '';
        console.log('User details fetched:', response);

        // Async localStorage save with setTimeout
        setTimeout(() => {
          try {
            localStorage.setItem('userProfile', JSON.stringify(response));
            console.log('User profile saved asynchronously to localStorage');
          } catch (e) {
            console.warn('Could not save userProfile to localStorage', e);
          }
        }, 0);
      },
      (error) => {
        console.error('Error fetching user details', error);
        if (error.status === 401) {
          this.router.navigate(['/login-candidate']);
        } else {
          alert('Failed to load user details. Please try again.');
        }
      }
    );
  }


  triggerProfilePictureUpload() {
    console.log('Trigger profile picture upload clicked');
    this.profilePictureInput.nativeElement.click();
  }

  triggerResumeUpload() {
    this.resumeInput.nativeElement.click();
  }

  onProfilePictureSelected(event: any) {
  console.log('🔍 File selection triggered');
  
  const file = event.target.files[0];
  console.log('🔍 Selected file:', file);
  
  if (!file) {
    console.log('❌ No file selected');
    return;
  }

  if (this.validateProfilePicture(file)) {
    console.log('✅ File validation passed');
    this.profilePicture = file;
    
    // Clean up previous URL
    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }
    
    // Create new object URL
    const objectURL = URL.createObjectURL(file);
    console.log('🔗 Object URL created:', objectURL);
    
    // Set the image source
    this.imageSrc = objectURL;
    console.log('📝 imageSrc set to:', this.imageSrc);
    
    // Force change detection
    this.cdr.detectChanges();
    console.log('🔄 Change detection triggered');
    
    // Backup: Direct DOM manipulation
    setTimeout(() => {
      const imgElement = document.getElementById('candidate-profile-picture') as HTMLImageElement;
      if (imgElement) {
        console.log('🖼️ Setting image src directly');
        imgElement.src = objectURL;
        
        imgElement.onload = () => {
          console.log('✅ Image loaded successfully');
        };
        imgElement.onerror = (error) => {
          console.log('❌ Image failed to load:', error);
        };
      }
    }, 50);
    
  } else {
    console.log('❌ File validation failed');
    alert('Invalid file. Only JPG, JPEG, PNG allowed. Max size: 5MB.');
    this.profilePictureInput.nativeElement.value = '';
  }
}

  onResumeSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.validateResume(file)) {
      this.resume = file;
    } else {
      alert('Invalid file. Only PDF and Word documents (.pdf, .doc, .docx) allowed. Max size: 1MB.');
      this.resumeInput.nativeElement.value = '';
    }
  }

  validateProfilePicture(file: File): boolean {
    console.log('🔍 Validating file:', file.name, file.type, file.size);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const isValidType = allowedTypes.includes(file.type);
    const isValidSize = file.size <= maxSize;
    
    console.log('📋 Type valid:', isValidType);
    console.log('📋 Size valid:', isValidSize, `(${file.size} bytes vs ${maxSize} max)`);
    
    return isValidType && isValidSize;
  }

  validateResume(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 1 * 1024 * 1024; // 1MB
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  saveProfile(): Promise<{ success: boolean; rateLimited: boolean; message: string; }> {
  return new Promise((resolve) => {
    if (!this.resume) {

          console.log("Inside profile-basic-info-PAGE: with ONLY CV");
      // If only a profile picture is being saved
      if (this.profilePicture) {
        const formData = new FormData();
        formData.append('profile_picture', this.profilePicture);
        console.log("Inside profile-basic-info-PAGE: with ONLY CV", formData);
        this.profileService.saveProfile(formData).subscribe(
          (response) => {
            console.log('Profile picture saved successfully', response);
            resolve({ 
              success: true, 
              rateLimited: response.rate_limited || false, 
              message: response.message || 'Profile picture saved successfully'
            });
          },
          (error) => {
            console.error('Error saving profile picture', error);
            alert('Error saving profile: ' + (error.error?.detail || 'Unknown error'));
            resolve({ 
              success: false, 
              rateLimited: false, 
              message: 'Error saving profile picture' 
            });
          }
        );
      } else {
        alert('Recommended to upload a Resume before saving.');
        resolve({ 
          success: false, 
          rateLimited: false, 
          message: 'No resume or profile picture selected' 
        });
      }
      return;
    }

    const formData = new FormData();
    if (this.profilePicture) {
      formData.append('profile_picture', this.profilePicture);
    }
    formData.append('resume', this.resume);

    console.log("Inside profile-basic-info-PAGE: with Profile pic and CV",this.profilePicture);
    console.log("Inside profile-basic-info-PAGE: with Profile pic and CV",this.resume);

    console.log("Inside profile-basic-info-PAGE: with Profile pic and CV",formData);

    this.profileService.saveProfile(formData).subscribe(
      (response) => {
        console.log('Profile saved successfully', response);
        // Resolve with the detailed object from the backend
        resolve({ 
          success: true, 
          rateLimited: response.rate_limited || false, 
          message: response.message || 'Profile saved successfully'
        });
      },
      (error) => {
        console.error('Error saving profile', error);
        alert('Error saving profile: ' + (error.error?.detail || 'Unknown error'));
        // Resolve with a consistent error object
        resolve({ 
          success: false, 
          rateLimited: false, 
          message: 'Error saving profile' 
        });
      }
    );
  });
}


  skip() {
    this.router.navigate(['/profile-employment-page']);
  }

  ngOnDestroy() {
    // FIXED: Now works properly with string type
    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }
  }
}