import { Component, OnInit, Input, ContentChild, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
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
  imageSrc: string = ''; // Holds the preview URL of the selected image
  defaultImageSrc: string = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDIwfHxnaXJsfGVufDB8fHx8MTczNDA4MzI2NHww&ixlib=rb-4.0.3&w=200';
  imageAlt: string = 'Profile Picture';

  constructor(private profileService: ProfileService, private router: Router) {}

  ngOnInit() {
    this.fetchUserDetails();
  }

  fetchUserDetails() {
    this.profileService.getUserDetails().subscribe(
      (response: any) => {
        this.firstName = response.first_name || '';
        this.lastName = response.last_name || '';
        this.email = response.email || '';
        this.phoneNumber = response.phone_number || '';
      },
      (error) => {
        console.error('Error fetching user details', error);
        if (error.status === 401) {
          this.router.navigate(['/login-candidate']); // Redirect to login if unauthorized
        } else {
          alert('Failed to load user details. Please try again.');
        }
      }
    );
  }

  triggerProfilePictureUpload() {
    this.profilePictureInput.nativeElement.click();
  }

  triggerResumeUpload() {
    this.resumeInput.nativeElement.click();
  }

  onProfilePictureSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.validateProfilePicture(file)) {
      this.profilePicture = file;
      this.imageSrc = URL.createObjectURL(file);
      console.log("Picture selected: ", this.imageSrc);
    } else {
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return allowedTypes.includes(file.type) && file.size <= maxSize;
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

  saveProfile(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.resume) {
        alert('Recommended to upload a Resume before saving.');
        resolve(false);
        return;
      }
  
      const formData = new FormData();
      formData.append('profile_picture', this.profilePicture);
      formData.append('resume', this.resume);
  
      this.profileService.saveProfile(formData).subscribe(
        (response) => {
          console.log('Profile saved successfully', response);
          resolve(true);
        },
        (error) => {
          console.error('Error saving profile', error);
          alert('Error saving profile: ' + (error.error?.detail || 'Unknown error'));
          resolve(false);
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

