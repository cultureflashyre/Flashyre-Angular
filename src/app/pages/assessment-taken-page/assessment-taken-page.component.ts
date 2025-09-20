import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AssessmentTakenService } from '../../services/assessment-taken.service';
import { AuthService } from '../../services/candidate.service';
import { Router, ActivatedRoute } from '@angular/router';

interface UserProfile {
  first_name: string;
  last_name: string;
}

@Component({
  selector: 'assessment-taken-page',
  templateUrl: 'assessment-taken-page.component.html',
  styleUrls: ['assessment-taken-page.component.css']
})
export class AssessmentTakenPage implements OnInit {
  assessments: any[] = [];
  showAttempts: { [key: string]: boolean } = {};
  selectedAssessmentId: string | null = null;
  searchQuery: string = '';
  userProfile: UserProfile | null = null;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 6; // Set how many items to load per page/scroll

  constructor(
    private title: Title,
    private meta: Meta,
    private assessmentTakenService: AssessmentTakenService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.title.setTitle('Assessment-Taken-Page - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Assessment-Taken-Page - Flashyre' },
      // ... other meta tags
    ]);
  }

   ngOnInit() {
    this.loadUserProfile();
    
    this.route.queryParams.subscribe(params => {
      this.selectedAssessmentId = params['assessmentId'] || null;
    });
    
    this.assessmentTakenService.getAllAssessmentScores().subscribe(
      (data) => {
        // Sort assessments by the latest_end_time in descending order (recent first)
        this.assessments = data.sort((a, b) => {
          const dateA = new Date(a.latest_end_time).getTime();
          const dateB = new Date(b.latest_end_time).getTime();
          return dateB - dateA;
        });
      },
      (error) => { console.error('Error fetching assessment scores', error); }
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
  }

  selectAssessment(assessmentId: string) {
    this.router.navigate([], { 
      relativeTo: this.route,
      queryParams: { assessmentId: assessmentId },
      queryParamsHandling: 'merge' 
    });
  }

  closeDetailView() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { assessmentId: null, attemptIndex: null },
      queryParamsHandling: 'merge'
    });
  }

  // This method provides the full filtered list
  getFilteredAssessments() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.assessments;
    }
    return this.assessments.filter(assessment =>
      assessment.assessment_title.toLowerCase().includes(query) ||
      String(assessment.assessment_id).toLowerCase().includes(query)
    );
  }

  // When the user searches, we must reset to the first page
  onSearchQueryChange(query: string) {
    this.searchQuery = query;
    this.currentPage = 1; 
  }

  // MODIFIED: This method now returns a growing list of displayed items
  getDisplayedAssessments() {
    const filtered = this.getFilteredAssessments();
    // It slices from the beginning to the end of the current page
    return filtered.slice(0, this.currentPage * this.itemsPerPage);
  }

  // MODIFIED: This method now handles loading the next page on scroll
  onScroll(event: any) {
    const target = event.target;
    const threshold = 5; // A small pixel buffer
    
    // Check if the user has scrolled to the bottom of the container
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
      const totalAssessments = this.getFilteredAssessments().length;
      const currentlyDisplayed = this.getDisplayedAssessments().length;

      // Load more assessments only if there are more to show
      if (currentlyDisplayed < totalAssessments) {
        this.currentPage++;
      }
    }
  }
}