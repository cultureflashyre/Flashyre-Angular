import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router } from '@angular/router';
import { AssessmentTakenService } from '../../services/assessment-taken.service'; // Import the service
import { JobsService } from '../../services/job.service';
import { Subscription, interval, of } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';

@Component({
  selector: 'assessment-detailed-results',
  templateUrl: 'assessment-detailed-results.html',
  styleUrls: ['assessment-detailed-results.css'],
})
export class AssessmentDetailedResults implements OnChanges  {
    @Input() assessmentData: any;  // This will receive the selected attempt object
    @ViewChild('capsuleContainer') capsuleContainer!: ElementRef;
    @Output() back = new EventEmitter<void>();
    public isReattempting = false;

    questions: any[] = [];
    groupedQuestions: { [key: string]: any[] } = {};  // Grouped by section
    sectionOrder: string[] = [];  // Ordered list of section names
    totalQuestions: number = 0;  // Total for numbering
    selectedSection: string | null = null;  // New: Track currently selected section

     // --- NEW PROPERTIES FOR AI RECOMMENDATION ---
    recommendation: any = null;
    recommendationStatus: 'NOT_STARTED' | 'PENDING' | 'COMPLETE' | 'FAILED' = 'NOT_STARTED';
    private pollingSubscription: Subscription | null = null;

    codingSectionsMap: { [key: string]: any } = {};
    // --- END NEW PROPERTIES ---


    rawhg86: string = ' '
    rawdt3n: string = ' '
    rawrm7v: string = ' '
    rawvn2j: string = ' '
    rawvdwg: string = ' '
    constructor(private title: Title, private meta: Meta, private router: Router, private assessmentTakenService: AssessmentTakenService, private jobsService: JobsService // Inject service
) {
      this.title.setTitle('Assessment-Detailed-Results - Flashyre')
      this.meta.addTags([
        {
          property: 'og:title',
          content: 'Assessment-Detailed-Results - Flashyre',
        },
        {
          property: 'og:image',
          content:
            'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
        },
      ])
    }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assessmentData'] && this.assessmentData) {
      this.questions = this.assessmentData.detailed_questions || [];
      this.totalQuestions = this.questions.length;

      // Reset properties for the new attempt data
      this.sectionOrder = [];
      this.groupedQuestions = {};
      this.codingSectionsMap = {};

      // 1. Process MCQ sections
      this.groupedQuestions = this.questions.reduce((acc: { [key: string]: any[] }, q: any) => {
        const sectionName = q.section || 'Unnamed Section';
        if (!acc[sectionName]) {
          acc[sectionName] = [];
          this.sectionOrder.push(sectionName);
        }
        acc[sectionName].push(q);
        return acc;
      }, {});

      // 2. Process Coding sections
      const codingSections = this.assessmentData.coding_sections || [];
      codingSections.forEach((codingSection: any) => {
        const sectionName = codingSection.section_name;
        if (sectionName) {
          this.sectionOrder.push(sectionName);
          this.codingSectionsMap[sectionName] = codingSection;
        }
      });

      // 3. Set default selected section
      this.selectedSection = this.sectionOrder[0] || null;

      this.initiateRecommendationCheck();
    }
  }

  ngOnDestroy() {
    // Clean up the subscription to prevent memory leaks
    this.stopPolling();
  }

  
  // --- NEW METHODS FOR AI RECOMMENDATION ---

  initiateRecommendationCheck() {
    this.stopPolling(); // Ensure no previous polling is running
    const resultId = this.assessmentData.result_id;

    this.assessmentTakenService.getRecommendationStatus(resultId).subscribe(response => {
      this.recommendationStatus = response.status;
      if (response.status === 'COMPLETE') {
        this.recommendation = response;
      } else if (response.status === 'NOT_STARTED') {
        // Status is not started, so we trigger generation
        this.recommendationStatus = 'PENDING'; // Visually start loading
        this.assessmentTakenService.generateRecommendation(resultId).subscribe({
          next: () => {
            // Generation triggered, now start polling for completion
            this.startPolling(resultId);
          },
          error: () => {
            this.recommendationStatus = 'FAILED';
          }
        });
      } else if (response.status === 'PENDING') {
        // It's already being generated, just start polling
        this.startPolling(resultId);
      }
    });
  }

  startPolling(resultId: number) {
    this.stopPolling(); // Ensure only one poller is active

    this.pollingSubscription = interval(5000) // Poll every 5 seconds
      .pipe(
        startWith(0), // Immediately check on start
        switchMap(() => this.assessmentTakenService.getRecommendationStatus(resultId)),
        catchError(() => {
          this.recommendationStatus = 'FAILED';
          this.stopPolling();
          return of(null); // Stop the stream on error
        })
      )
      .subscribe(response => {
        if (response && (response.status === 'COMPLETE' || response.status === 'FAILED')) {
          this.recommendationStatus = response.status;
          if(response.status === 'COMPLETE') {
            this.recommendation = response;
          }
          this.stopPolling();
        } else if (response) {
            this.recommendationStatus = response.status;
        }
      });
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // --- END NEW METHODS ---

  onBackClick() {
  this.back.emit();
}

onReattempt() {
      const assessmentIdToFind = this.assessmentData?.assessment_id;

      if (!assessmentIdToFind) {
        console.error('Cannot re-attempt: Assessment ID is missing from the data.');
        alert('An error occurred. Missing assessment ID.');
        return;
      }
      
      // --- [CHANGE 1] ---
      // Set loading state to true
      this.isReattempting = true;
      
      const numericAssessmentId = parseInt(assessmentIdToFind, 10);

      this.jobsService.fetchAssessments().subscribe({
        next: (allAssessments) => {
          const selectedAssessment = allAssessments.find(a => a.assessment_id === numericAssessmentId);

          if (selectedAssessment) {
            const assessmentDataString = JSON.stringify(selectedAssessment);
            this.router.navigate(['/flashyre-assessment-rules-card'], {
              queryParams: { data: assessmentDataString }
            });
          } else {
            console.error(`Assessment with ID ${numericAssessmentId} not found.`);
            alert('Could not start the assessment. Details not found.');
            this.isReattempting = false; // <-- Reset on failure
          }
        },
        error: (error) => {
          console.error('Failed to fetch the list of assessments for re-attempt:', error);
          alert('An error occurred while fetching assessment data. Please try again later.');
          // --- [CHANGE 2] ---
          // Re-enable button on error
          this.isReattempting = false;
        }
      });
  }


// Helper methods for options and correct answer
  //getOptions(question: any) {
  //  const options = [];
  //  if (question.q_option1) options.push({ value: question.q_option1, label: 'A' });
  //  if (question.q_option2) options.push({ value: question.q_option2, label: 'B' });
  //  if (question.q_option3) options.push({ value: question.q_option3, label: 'C' });
  //  if (question.q_option4) options.push({ value: question.q_option4, label: 'D' });
  //  return options;
  //}

  getOptions(question: any) {
  // Returns [{key: 'option1', value: 'x = 5', image: ...}, ...]
  const options = [];
  for (let i = 1; i <= 4; i++) {
    const key = `option${i}`;
    const value = question[`q_option${i}`];
    if (value) {
      options.push({
        key,
        value,
        image: question[`q_option${i}_image`]
      });
    }
  }
  return options;
}

  getCorrectOptionLetter(question: any): string {
    switch (question.q_correct_answer) {
      case 'option1': return 'A';
      case 'option2': return 'B';
      case 'option3': return 'C';
      case 'option4': return 'D';
      default: return '';
    }
  }

  logRadioStatus(question: any, opt: any, i: number): boolean {
    const isChecked = question.user_selected_option === opt.key;
    console.log(
      `Question #${i + 1}, Option: ${opt.key}, User Selected: ${question.user_selected_option}, Checked: ${isChecked}`
    );
    return isChecked;
  }

  getOptionStatus(question: any, opt: any): string {
    if (question.user_selected_option === opt.key && question.q_correct_answer === opt.key) {
      console.log('Correct:', opt.key);
      return 'correct';
    }
    if (question.user_selected_option === opt.key && question.q_correct_answer !== opt.key) {
      console.log('Incorrect:', opt.key);
      return 'incorrect';
    }
    return '';
  }

    getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }
  
  scrollLeft() {
        this.capsuleContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
    }

  scrollRight() {
        this.capsuleContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
    }

  // New: Method to handle section selection
  selectSection(section: string) {
    this.selectedSection = section;
  }

  isCodingSection(sectionName: string | null): boolean {
    return !!sectionName && sectionName in this.codingSectionsMap;
  }
}