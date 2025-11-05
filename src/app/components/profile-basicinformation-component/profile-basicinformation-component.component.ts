// components/profile-basicinformation-component/profile-basicinformation-component.component.ts

import { Component, OnInit, Input, ContentChild, TemplateRef, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
  
  // --- MODIFICATION START ---
  // This will hold the name of the *existing* resume from the backend.
  resumeFileName: string = ''; 
  resumeError: string = '';
profilePictureError: string = '';
  // --- MODIFICATION END ---

  imageSrc: string = '';
  
  defaultImageSrc: string =   environment.defaultProfilePicture;
  imageAlt: string = 'Profile Picture';

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userProfileService: UserProfileService,
  ) {}

  ngOnInit() {
    console.log('Component initialized');
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      try {
        const userProfile = JSON.parse(profileData);
        this.firstName = userProfile.first_name || '';
        this.lastName = userProfile.last_name || '';
        this.email = userProfile.email || '';
        this.phoneNumber = userProfile.phone_number || '';
        this.imageSrc = userProfile.profile_picture_url || '';
        
        // --- MODIFICATION START ---
        // If a resume URL exists in local storage, extract the file name to display it.
        if (userProfile.resume_url) {
          this.resumeFileName = this.extractFileNameFromUrl(userProfile.resume_url);
        }
        // --- MODIFICATION END ---

        console.log('Loaded user profile from localStorage:', userProfile);
      } catch (error) {
        console.error('Error parsing userProfile from localStorage:', error);
        this.fetchUserDetails();
      }
    } else {
      this.fetchUserDetails();
    }
  }

  // --- MODIFICATION START ---
  // Helper function to get the filename from a full GCS URL.
  extractFileNameFromUrl(url: string): string {
    try {
      // Decodes URL-encoded characters (like %20 for space) and gets the last part.
      return decodeURIComponent(url.split('/').pop() || '');
    } catch (e) {
      console.error('Could not extract file name from URL', e);
      return 'resume.pdf'; // Fallback
    }
  }
  // --- MODIFICATION END ---

  fetchUserDetails() {
    this.profileService.getUserDetails().subscribe(
      (response: any) => {
        this.firstName = response.first_name || '';
        this.lastName = response.last_name || '';
        this.email = response.email || '';
        this.phoneNumber = response.phone_number || '';
        this.imageSrc = response.profile_picture_url || '';

        // --- MODIFICATION START ---
        // The backend now sends the resume_url, so we process it here.
        if (response.resume_url) {
          this.resumeFileName = this.extractFileNameFromUrl(response.resume_url);
        }
        // --- MODIFICATION END ---

        console.log('User details fetched:', response);

        // Save the complete response (including new resume_url) to localStorage.
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

  public validateInputs(): boolean {
  let isValid = true;
  this.profilePictureError = '';
  this.resumeError = '';

  // Check if there is neither a newly selected resume nor an existing one.
  if (!this.resume && !this.resumeFileName) {
    this.resumeError = 'Resume field is mandatory';
    isValid = false;
  }

  return isValid;
}

  triggerProfilePictureUpload() {
    this.profilePictureInput.nativeElement.click();
  }

  triggerResumeUpload() {
    this.resumeInput.nativeElement.click();
  }

onProfilePictureSelected(event: any) {
  const file = event.target.files[0];
  if (!file) {
    return; // Exit if no file was selected
  }

  if (this.validateProfilePicture(file)) {
        this.profilePictureError = ''; // Clear error on valid selection

    this.profilePicture = file; // This sets the file that will be saved
    

    // --- START: New and More Reliable FileReader Logic ---

    // If the previous image was a temporary "blob" preview, we clean it up
    // to prevent memory leaks from multiple selection changes.
    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }

    // 1. Create a new FileReader object.
    const reader = new FileReader();

    // 2. Tell the reader what to do once it has finished reading the file.
    reader.onload = () => {
      // The result is the image content encoded as a string (a data URL).
      // We assign this directly to our image source.
      this.imageSrc = reader.result as string;

      // 3. Manually tell Angular to update the screen. This ensures the
      //    preview appears instantly after the file is read.
      this.cdr.detectChanges();
    };

    // 4. Instruct the reader to start reading the selected image file.
    reader.readAsDataURL(file);

    // --- END: New and More Reliable FileReader Logic ---

  } else {
    alert('Invalid file. Only JPG, JPEG, PNG allowed. Max size: 5MB.');
    this.profilePictureInput.nativeElement.value = '';
  }
}

  onResumeSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.validateResume(file)) {
      this.resumeError = ''; 
      this.resume = file;
      // --- MODIFICATION START ---
      // When a new file is selected, clear the old file name to show the new one.
      this.resumeFileName = ''; 
      // --- MODIFICATION END ---
    } else {
      alert('Invalid file. Only PDF and Word documents (.pdf, .doc, .docx) allowed. Max size: 1MB.');
      this.resumeInput.nativeElement.value = '';
    }
  }

  validateProfilePicture(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  validateResume(file: File): boolean {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 1 * 1024 * 1024; // 1MB
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  saveProfile(): Promise<{ success: boolean; rateLimited: boolean; message: string; }> {
    return new Promise((resolve) => {
      const formData = new FormData();
      let hasDataToSave = false;

      if (this.profilePicture) {
        formData.append('profile_picture', this.profilePicture);
        hasDataToSave = true;
      }
      if (this.resume) {
        formData.append('resume', this.resume);
        hasDataToSave = true;
      }

      // If no new files are selected, resolve successfully without an API call.
      if (!hasDataToSave) {
        console.log("No new files to save.");
        resolve({ success: true, rateLimited: false, message: 'No new information to save.' });
        return;
      }

      this.profileService.saveProfile(formData).subscribe(
        (response) => {
          console.log('Profile saved successfully', response);

          // --- MODIFICATION START ---
          // After a successful save, update local state and storage.
          try {
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
              const userProfile = JSON.parse(profileData);
              // Update the user profile object with the new URLs from the response.
              userProfile.profile_picture_url = response.profile_picture_url || userProfile.profile_picture_url;
              userProfile.resume_url = response.resume_url || userProfile.resume_url;

              // If a new resume was uploaded, update the file name for display.
              if (response.resume_url) {
                  this.resumeFileName = this.extractFileNameFromUrl(response.resume_url);
              }
              
              // Save the updated profile back to local storage.
              localStorage.setItem('userProfile', JSON.stringify(userProfile));

              // Clear the file inputs as they have been saved.
              this.resume = null;
              this.profilePicture = null;
            }
          } catch (e) {
            console.error('Failed to update localStorage after save.', e);
          }
          // --- MODIFICATION END ---

          resolve({
            success: true,
            rateLimited: response.rate_limited || false,
            message: response.message || 'Profile saved successfully'
          });
        },
        (error) => {
          console.error('Error saving profile', error);
          alert('Error saving profile: ' + (error.error?.detail || 'Unknown error'));
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
    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }
  }
}