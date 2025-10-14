import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'candidate-job-detail-view',
  templateUrl: './candidate-job-detail-view.component.html',
  styleUrls: ['./candidate-job-detail-view.component.css'],
})
export class CandidateJobDetailView {
  //selectedJobId: number | null = null;
  public activeTab: 'recommended' | 'saved' = 'recommended';

  // --- [NEW] Properties to store the dynamic counts ---
  // Initializing to null allows us to show nothing until the first count is received.
  public recommendedJobCount: number | null = null;
  public savedJobCount: number | null = null;

  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Candidate-Job-Detail-View - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Job-Detail-View - Flashyre',
      },
    ]);
  }

  // onJobSelected(jobId: number): void {
  //   console.log('Received jobId in parent:', jobId);
  //   this.selectedJobId = jobId;
  // }

  selectRecommendedTab(): void {
    if (this.activeTab !== 'recommended') {
      console.log('Switching to Recommended tab');
      this.activeTab = 'recommended';
    }
  }

  selectSavedTab(): void {
    if (this.activeTab !== 'saved') {
      console.log('Switching to Saved tab');
      this.activeTab = 'saved';
    }
  }

  // --- [NEW] Event handler methods for the counts ---

  /**
   * This method is called when the job-cards component emits the recommended job count.
   * @param count The number of recommended jobs.
   */
  onRecommendedJobsCountChanged(count: number): void {
    console.log(`Parent received recommended job count: ${count}`);
    this.recommendedJobCount = count;
  }

  /**
   * This method is called when the job-cards component emits the saved job count.
   * @param count The number of saved jobs.
   */
  onSavedJobsCountChanged(count: number): void {
    console.log(`Parent received saved job count: ${count}`);
    this.savedJobCount = count;
  }
}