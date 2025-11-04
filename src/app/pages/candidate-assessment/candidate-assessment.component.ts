import { Component, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/candidate.service'; // Import AuthService
import { AssessmentDataService } from 'src/app/services/assessment-data.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'candidate-assessment',
  templateUrl: 'candidate-assessment.component.html',
  styleUrls: ['candidate-assessment.component.css'],
})
export class CandidateAssessment implements AfterViewInit {
  userProfile: any = {};
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";

  // The component now works with Observables provided by the service
  assessments$: Observable<any[]>;
  isLoading$: Observable<boolean>;

    // This local variable will hold the resolved data for methods that need it
  private currentAssessments: any[] = [];

  @ViewChildren('descriptionElement') descriptions!: QueryList<ElementRef>;

  private baseUrl = environment.apiUrl;

  raw6b6z: string = ' ';

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private assessmentDataService: AssessmentDataService,
    
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

        // Initialize the observables from the service
    this.assessments$ = this.assessmentDataService.assessments$;
    this.isLoading$ = this.assessmentDataService.loading$;
  }

  ngAfterViewInit(): void {
    this.descriptions.changes.subscribe(() => {
      this.checkOverflows();
    });
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

  checkOverflows(): void {
    if (this.descriptions) {
      this.descriptions.forEach((elRef, index) => {
        const el = elRef.nativeElement;
        const ass = this.currentAssessments[index];
        if (ass && !ass.isExpanded && el.scrollHeight > el.clientHeight) {
          ass.showReadMore = true;
        }
      });
    }
  }

  expandDescription(assessment: any, index: number): void {
    assessment.isExpanded = true;
    setTimeout(() => {
      const el = this.descriptions.toArray()[index].nativeElement;
      if (el.scrollHeight > el.clientHeight) {
        assessment.isScrollable = true;
      }
    }, 0);
  }

  startAssessment(assessmentToStart: any): void {
    const assessmentDataString = JSON.stringify(assessmentToStart);
    this.router.navigate(['/flashyre-assessment-rules-card'], 
      { queryParams: { data: assessmentDataString } });
  }



  ngOnInit(): void {
    this.loadUserProfile();
    // 1. Tell the service to load data. It will handle caching internally.
    this.assessmentDataService.loadAssessments();

    // Subscribe to keep a local copy for methods like startAssessment
    this.assessments$.subscribe(data => {
        this.currentAssessments = data.map(ass => ({
            ...ass,
            showReadMore: false,
            isExpanded: false,
            isScrollable: false
        }));
    });
  }

  onLogoutClick() {
    this.authService.logout();
    this.assessmentDataService.disconnectSocket(); // Disconnect socket on logout
  }

  // Kept for compatibility with static SAP Survey button (optional)
  /*async sapSurvey() {
    this.router.navigate(['/flashyre-assessment1']);
  }*/
}