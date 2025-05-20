import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { AuthService } from '../../services/candidate.service'; // Import AuthService
import { Router } from '@angular/router';

@Component({
  selector: 'assessment-violation-message',
  templateUrl: 'assessment-violation-message.component.html',
  styleUrls: ['assessment-violation-message.component.css'],
})
export class AssessmentViolationMessage {
  userProfile: any = {};
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";
  

  constructor(
    private title: Title, 
    private meta: Meta,
    private authService: AuthService,
    private router: Router,
) {
    this.title.setTitle('Assessment-violation-message - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Assessment-violation-message - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

  get candidateProfilePictureUrl(): string {
    return this.userProfile.profile_picture_url ? this.userProfile.profile_picture_url : this.defaultProfilePicture;
  }

  get candidateName(): string {
    return `${this.userProfile.first_name || '--'} ${this.userProfile.last_name || '--'}`;
  }

  get candidateJobRole(): string {
    if (this.userProfile.job_title) {
      return `${this.userProfile.job_title} @ ${this.userProfile.company_name || '--'}`;
    } else if (this.userProfile.education_level) {
      return `${this.userProfile.education_level} from ${this.userProfile.university || '--'}`;
    } else {
      return '--';
    }
  }

    loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched");
    }
  }

    ngOnInit(): void {
    this.loadUserProfile();
    }

    onLogoutClick() {
    this.authService.logout(); // Call the logout method in AuthService
    //this.router.navigate(['/login-candidate']); // Redirect to login page after logout
  }

    onCloseClick() {
    this.router.navigate(['assessment-taken-page']);
  }
}
