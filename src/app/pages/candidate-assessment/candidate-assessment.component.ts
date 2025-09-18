import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/candidate.service'; // Import AuthService


@Component({
  selector: 'candidate-assessment',
  templateUrl: 'candidate-assessment.component.html',
  styleUrls: ['candidate-assessment.component.css'],
})
export class CandidateAssessment {
  userProfile: any = {};
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";
  assessments: any[] = []; // Array to store fetched assessments

  private baseUrl = environment.apiUrl;

  raw6b6z: string = ' ';

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    
  ) {
    this.title.setTitle('Candidate-Assessment - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Assessment - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched");
    }
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

  // Fetch assessments from the API
  loadAssessments(): void {
    this.spinner.show(); // Show spinner while loading
    this.http.get<any[]>(`${this.baseUrl}api/assessments/assessment-list/`)
      .subscribe({
        next: (data) => {
          this.assessments = data; // Store fetched assessments
          this.spinner.hide(); // Hide spinner on success
        },
        error: (error) => {
          console.error('Error fetching assessments:', error);
          this.spinner.hide(); // Hide spinner on error
        }
      });
  }

  // Navigate to assessment page (dynamic based on assessment ID)
  //startAssessment(assessmentId: number): void {
   // this.router.navigate(['/flashyre-assessment-rules-card'], { queryParams: { id: assessmentId } });
  //}

  startAssessment(assessmentId: number): void {
    // Find the full assessment object for the selected id
    const selectedAssessment = this.assessments.find(a => a.assessment_id === assessmentId);
    if (!selectedAssessment) {
      console.error("Assessment not found for id", assessmentId);
      return;
    }

    // Serialize the object to JSON string to send as query param or use router state
    const assessmentDataString = JSON.stringify(selectedAssessment);

    // Navigate with serialized object as query param (or use state)
    this.router.navigate(['/flashyre-assessment-rules-card'], 
      { queryParams: { data: assessmentDataString } });
  }



  ngOnInit(): void {
    this.loadUserProfile();
    this.loadAssessments(); // Fetch assessments on component initialization
  }

  onLogoutClick() {
    this.authService.logout(); // Call the logout method in AuthService
    //this.router.navigate(['/login-candidate']); // Redirect to login page after logout
  }

  // Kept for compatibility with static SAP Survey button (optional)
  /*async sapSurvey() {
    this.router.navigate(['/flashyre-assessment1']);
  }*/
}