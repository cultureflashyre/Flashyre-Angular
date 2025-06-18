import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AssessmentTakenService } from '../../services/assessment-taken.service';
import { AuthService } from '../../services/candidate.service';
import { Router } from '@angular/router';

interface UserProfile {
  first_name: string;
  last_name: string;
}

@Component({
  selector: 'assessment-taken-page',
  templateUrl: 'assessment-taken-page.component.html',
  styleUrls: ['assessment-taken-page.component.css'],
})
export class AssessmentTakenPage implements OnInit {
  assessments: any[] = [];
  userProfile: UserProfile | null = null;

  constructor(
    private title: Title,
    private meta: Meta,
    private assessmentTakenService: AssessmentTakenService,
    private authService: AuthService,
    private router: Router
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
    this.loadUserProfile();
    this.assessmentTakenService.getAllAssessmentScores().subscribe(
      (data) => {
        this.assessments = data;
      },
      (error) => {
        console.error('Error fetching assessment scores', error);
      }
    );
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log('User Profile NOT fetched');
    }
  }

  getFillColor(score: number): string {
    if (score <= 40) return 'red';
    if (score <= 60) return 'orange';
    if (score <= 75) return '#4D91C6';
    if (score <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  onLogoutClick() {
    this.authService.logout();
    // this.router.navigate(['/login-candidate']);
  }

  goToAssessmentDetails(assessment: any) {
    this.router.navigate(['/assessment-taken-page-2', assessment.assessment_id]);
  }
}