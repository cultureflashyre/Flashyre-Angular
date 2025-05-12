import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser'
import { AssessmentTakenService } from '../../services/assessment-taken.service';
import { AuthService } from '../../services/candidate.service'; // Import AuthService
import { Router } from '@angular/router';

@Component({
  selector: 'assessment-taken-page',
  templateUrl: 'assessment-taken-page.component.html',
  styleUrls: ['assessment-taken-page.component.css'],
})
export class AssessmentTakenPage implements OnInit {
    assessments: any[] = [];

  constructor(
    private title: Title,
    private meta: Meta,
    private assessmentTakenService: AssessmentTakenService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.title.setTitle('Assessment-Taken-Page - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Assessment-Taken-Page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit() {
    this.assessmentTakenService.getAllAssessmentScores().subscribe(
      (data) => {
        this.assessments = data;
      },
      (error) => {
        console.error('Error fetching assessment scores', error);
      }
    );
  }

  getFillColor(score: number): string {
    if (score <= 40) return 'red';
    if (score <= 60) return 'orange';
    if (score <= 75) return '#4D91C6';
    if (score <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  onLogoutClick() {
    this.authService.logout(); // Call the logout method in AuthService
    //this.router.navigate(['/login-candidate']); // Redirect to login page after logout
  }

  goToAssessmentDetails(assessment: any) {
    console.log(assessment)
  this.router.navigate(
    ['/assessment-taken-page-2', assessment.assessment_id],
    {
      state: {
        assessment_title: assessment.assessment_title,
        assessment_logo_url: assessment.assessment_logo_url,
        created_by: assessment.created_by,
        assessment_id: assessment.assessment_id,
        attempts_remaining: assessment.attempts_remaining,
        attempts: assessment.attempts
      }
    }
  );
  // If you want to pass more data, use query params:
    // this.router.navigate(['/assessment-taken-page-2', assessment.assessment_id], { queryParams: { title: assessment.assessment_title } });
}
}