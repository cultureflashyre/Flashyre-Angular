import { Component, OnInit } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router, ActivatedRoute } from '@angular/router';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { TrialAssessmentService } from '../../services/trial-assessment.service';

@Component({
  selector: 'flashyre-assessment-rules-card',
  templateUrl: 'flashyre-assessment-rules-card.component.html',
  styleUrls: ['flashyre-assessment-rules-card.component.css'],
})
export class FlashyreAssessmentRulesCard implements OnInit {

  assessmentId: number | null = null;
  assessmentData: any = null;
  attemptsAllowed: number = 0;
  attemptsRemaining: number = 0;
  assessmentTitle: string = '';
  totalAssessmentDuration: number = 0;

  constructor(
    private title: Title, 
    private meta: Meta, 
    private router: Router,
    private route: ActivatedRoute,
    private videoRecorder: VideoRecorderService,
    private proctoringService: ProctoringService,
    private trialAssessmentService: TrialAssessmentService
  ) {
    this.title.setTitle('Flashyre-Assessment-Rules-Card - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessment-Rules-Card - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.assessmentId = +id;
        this.fetchAssessmentData(this.assessmentId);
      }
    });
  }

  fetchAssessmentData(assessmentId: number): void {
    this.trialAssessmentService.getAssessmentDetails(assessmentId).subscribe({
      next: (data) => {
        console.log('Assessment data fetched:', data);
        this.assessmentData = data;
        this.attemptsAllowed = data.attempts_allowed;
        this.attemptsRemaining = data.attempts_remaining;
        this.assessmentTitle = data.assessment_title;
        this.totalAssessmentDuration = data.total_assessment_duration;
      },
      error: (error) => {
        console.error('Error fetching assessment data:', error);
        alert('Failed to load assessment details.');
      }
    });
  }

  async startAssessment() {
    if (this.assessmentId) {
      this.router.navigate(['/flashyre-assessment11'], { queryParams: { id: this.assessmentId } });
    } else {
      alert('Assessment ID is missing!');
    }
  }

}
