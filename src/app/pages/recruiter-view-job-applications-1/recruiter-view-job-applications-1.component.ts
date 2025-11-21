import { Component, OnInit, ViewChild, ElementRef, Renderer2, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { InterviewService, InterviewStage } from 'src/app/services/interview.service';
import { CorporateAuthService } from 'src/app/services/corporate-auth.service';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { formatDate } from '@angular/common';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { NavbarForRecruiterView } from 'src/app/components/navbar-for-recruiter-view/navbar-for-recruiter-view.component';
import { RecruiterFlowLargeCard } from 'src/app/components/recruiter-flow-large-card/recruiter-flow-large-card.component';

// --- MODIFICATION START ---
// Import jsPDF and the autoTable plugin for PDF generation.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- MODIFICATION END ---

@Component({
  selector: 'recruiter-view-job-applications1',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    AlertMessageComponent, NavbarForRecruiterView, RecruiterFlowLargeCard,
    ReactiveFormsModule,
  ],
  templateUrl: './recruiter-view-job-applications-1.component.html',
  styleUrls: ['./recruiter-view-job-applications-1.component.css'],
})
export class RecruiterViewJobApplications1 implements OnInit, AfterViewInit {

  showAddStagePopup = false;
  newStageForm: FormGroup;
  minDateString: string;
  isSubmitting = false;

  showJdDropdown = false;
  isDownloading = false;

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private pendingAction: string = '';
  private pendingStageData: InterviewStage | null = null;

  @ViewChild('stageViewport') stageViewport: ElementRef<HTMLDivElement>;
  @ViewChild('stageTrack') stageTrack: ElementRef<HTMLDivElement>;

  interviewStages: InterviewStage[] = [];
  activeStage: any = { id: 'applied', stage_name: 'Applied' }; // Default to 'Applied'
  nextStage: InterviewStage | null = null;
  
  currentScrollIndex = 0;
  maxScrollIndex = 0;

  private apiUrl = environment.apiUrl;

  job: any = null;
  safeJobDescription: SafeHtml;
  candidates: any[] = [];
  allCandidates: any[] = [];
  filteredAndSortedCandidates: any[] = [];
  moreCandidatesCount: number = 0;
  masterChecked: boolean = false;
  jobId: string | null;

  appliedCount: number = 0;

  sortColumn: string = 'name';
  sortDirection: string = 'asc';

  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';

  defaultProfilePicture: string = environment.defaultProfilePicture;
  defaultCompanyIcon: string = environment.defaultCompanyIcon;
  fhThumbnailIcon: string = environment.fh_logo_thumbnail;
  chcsThumbnailIcon: string = environment.chcs_logo_thumbnail;

  // Add a HostListener to close the dropdown when clicking outside of it.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.jd-dropdown-container')) {
      this.showJdDropdown = false;
    }
  }
    

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private interviewService: InterviewService, 
    private authService: CorporateAuthService,   
    private renderer: Renderer2,                 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.title.setTitle('Recruiter-View-Job-Applications-1 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-View-Job-Applications-1 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
    
  }

/**
   * Formats the assessment score to ensure decimal places are displayed correctly.
   * @param score The raw assessment score from the candidate data.
   * @returns The formatted score as a string (e.g., "85.5%") or "N/A".
   */
  formatAssessmentScore(score: any): string {
    // 1. Check if the score is null, undefined, or an empty string.
    if (score == null || score === '') {
      return 'N/A';
    }

    // 2. Convert the score to a number. This handles cases where it might be a string like "85.50".
    const numericScore = Number(score);

    // 3. Check if the result is a valid number. If not, return 'N/A'.
    if (isNaN(numericScore)) {
      return 'N/A';
    }

    // 4. Format the number to a fixed number of decimal places (e.g., 2),
    //    and then use parseFloat to remove any trailing zeros (e.g., 85.00 -> 85, 85.50 -> 85.5).
    const formattedScore = parseFloat(numericScore.toFixed(2));

    // 5. Return the final formatted string with a percentage sign.
    return `${formattedScore}%`;
  }

  ngOnInit() {
    this.jobId = this.route.snapshot.paramMap.get('jobId');
    
    this.fetchJobDetails();
    this.fetchInterviewStages();

    const today = new Date();
    this.minDateString = today.toISOString().split('T')[0];
    this.initializeNewStageForm();
  }
  

  ngAfterViewInit(): void {
      setTimeout(() => {
          this.calculateCarouselState();
      }, 200);
  }

  /**
   * Toggles the visibility of the JD/Assessment dropdown menu.
   * @param event The mouse click event.
   */
  toggleJdDropdown(event: MouseEvent): void {
    event.stopPropagation(); // Prevents the document:click listener from immediately closing it.
    this.showJdDropdown = !this.showJdDropdown;
  }

  /**
   * Initiates the process of downloading the assessment questions as a PDF.
   */
  downloadAssessment(): void {
    const token = this.authService.getJWTToken();
    if (!this.jobId || !token) {
      alert('Cannot download assessment. Job context or authentication is missing.');
      return;
    }

    this.isDownloading = true;
    this.showJdDropdown = false; // Close the dropdown

    this.interviewService.getAssessmentDetailsForJob(this.jobId, token).subscribe({
      next: (assessmentData) => {
        if (!assessmentData) {
          alert('No assessment details found for this job.');
          return;
        }
        this._generateAssessmentPdf(assessmentData);
        this.isDownloading = false;
      },
      error: (err) => {
        console.error('Failed to download assessment details:', err);
        alert(`Failed to download assessment: ${err.error?.message || 'Server error'}`);
        this.isDownloading = false;
      }
    });
  }

  /**
   * Private helper method to construct and save the PDF document.
   * @param data The detailed assessment data from the API.
   */
   private _generateAssessmentPdf(data: any): void {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let yPos = 20;

    // --- PDF Header ---
    doc.setFontSize(18);
    doc.text(`Assessment Questions for: ${this.job?.title || 'Job'}`, margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Assessment Name: ${data.name}`, margin, yPos);
    yPos += 15;

    // --- MCQs Section ---
    if (data.selected_mcqs && data.selected_mcqs.length > 0) {
      // 1. Group MCQs by skill name
      const mcqsBySkill = data.selected_mcqs.reduce((acc: any, q: any) => {
        const skill = q.mcq_item_details?.skill_name || 'General Questions';
        if (!acc[skill]) {
          acc[skill] = [];
        }
        acc[skill].push(q);
        return acc;
      }, {});

      // 2. Iterate through each skill group and create a table
      for (const skill in mcqsBySkill) {
        // Check for page break before adding a new section header
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Skill Section: ${skill}`, margin, yPos);
        yPos += 4;
        doc.line(margin, yPos, pageWidth - margin, yPos); // Add a separator line
        yPos += 8;
        doc.setFont('helvetica', 'normal');

        const mcqBody = mcqsBySkill[skill].map((q: any, index: number) => {
          const details = q.mcq_item_details;
          const questionText = details.question_text || '';
          
          // Regex to parse all parts of the MCQ text
          const questionMatch = questionText.match(/^(.*?)(?=\s*a\))/i);
          const optionsMatch = questionText.match(/\s*a\)(.*?)\s*b\)(.*?)\s*c\)(.*?)\s*d\)(.*?)(?=Correct Answer:)/i);
          const answerMatch = questionText.match(/Correct Answer:\s*([a-d])/i);

          const question = questionMatch ? questionMatch[1].trim() : 'Could not parse question';
          let options = 'Could not parse options.';
          if (optionsMatch) {
            options = `a) ${optionsMatch[1].trim()}\nb) ${optionsMatch[2].trim()}\nc) ${optionsMatch[3].trim()}\nd) ${optionsMatch[4].trim()}`;
          }
          const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : 'N/A';
          
          // Combine all parts into a single, readable string for the table cell
          const fullQuestionBlock = `${question}\n\n${options}\n\nCorrect Answer: ${correctAnswer}`;
          
          return [index + 1, fullQuestionBlock];
        });

        autoTable(doc, {
          head: [['#', 'Question Details']],
          body: mcqBody,
          startY: yPos,
          theme: 'grid',
          headStyles: { fillColor: [5, 53, 108] },
          styles: { cellPadding: 3, fontSize: 9, valign: 'top' },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
          }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // --- Coding Problems Section ---
    if (data.selected_coding_problems && data.selected_coding_problems.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Coding Problems', margin, yPos);
      yPos += 4;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      data.selected_coding_problems.forEach((p: any, index: number) => {
        const details = p.coding_problem_details;
        if (!details) return;

        // Estimate height to check for page break
        const descriptionLines = doc.splitTextToSize(details.description || '', 170).length;
        const estimatedHeight = 20 + (descriptionLines * 5);
        if (yPos + estimatedHeight > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${details.title}`, margin, yPos);
        yPos += 8;

        const addWrappedText = (label: string, text: string | null) => {
          if (!text || text.trim() === 'N/A' || text.trim() === '') return;
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
          doc.text(lines, margin, yPos);
          yPos += (lines.length * 4) + 6;
        };
        
        addWrappedText('Description:', details.description);
        addWrappedText('Input Format:', details.input_format);
        addWrappedText('Output Format:', details.output_format);
        addWrappedText('Constraints:', details.constraints);
        addWrappedText('Example:', details.example);
        yPos += 5;
      });
    }

    // --- Save the PDF ---
    const fileName = `Assessment_Questions_${this.job?.title.replace(/\s/g, '_') || 'Job'}.pdf`;
    doc.save(fileName);
  }


  fetchJobDetails() {
    if (this.jobId) {
      this.http.get(this.apiUrl+`api/recruiter/jobs/${this.jobId}/applications/`).subscribe(
          (data: any) => {
            this.job = data;
            this.safeJobDescription = this.sanitizer.bypassSecurityTrustHtml(this.job?.description || '');
            this.allCandidates = data.applications.map(c => ({...c, isSelected: false }));
            
            // This now dynamically updates counts
            this.updateStageCounts();
            
            this.applyFiltersAndSorting();
            this.masterChecked = false;
          },
          (error) => console.error('Error fetching job details:', error)
      );
    }
  }

  changeTab(stage: any) {
    this.activeStage = stage;
    this.masterChecked = false;
    this.applyFiltersAndSorting();
    this.calculateNextStage();
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  onSearchClick() {
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting() {
    let results = [...this.allCandidates];
    
    // Search filter logic (remains unchanged)
    if (this.searchJobTitle.trim()) {
      const searchTerm = this.searchJobTitle.toLowerCase().trim();
      results = results.filter(candidate =>
        candidate.designation && candidate.designation.toLowerCase().includes(searchTerm)
      );
    }

    // --- MODIFICATION START: Conditional Filtering ---
    // We only filter by a specific stage if the active tab is NOT the 'applied' tab.
    // If it is the 'applied' tab, this block is skipped, and all candidates are shown.
    if (this.activeStage.id !== 'applied') {
      const activeStageName = this.activeStage.stage_name.toLowerCase();
      results = results.filter(c => c.status.toLowerCase() === activeStageName);
    }
    // --- MODIFICATION END ---
    
    // Sorting logic (remains unchanged)
    results.sort((a, b) => {
      const isAsc = this.sortDirection === 'asc';
      let comparison = 0;
      switch (this.sortColumn) {
        case 'name':
          comparison = a.user.full_name.localeCompare(b.user.full_name);
          break;
        case 'score':
           comparison = (a.matching_score || 0) - (b.matching_score || 0);
          break;
        case 'assessment_score': // NEW case for 'Assessment Score'
          comparison = (a.assessment_score || 0) - (b.assessment_score || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return comparison * (isAsc ? 1 : -1);
    });

    this.filteredAndSortedCandidates = results;
    this.candidates = this.filteredAndSortedCandidates.slice(0, 5);
    this.moreCandidatesCount = this.filteredAndSortedCandidates.length - this.candidates.length;
  }

  sendInvite() {
    const selectedCandidates = this.allCandidates.filter(c => c.isSelected);

    if (selectedCandidates.length === 0) {
      this.openAlert('Please select at least one candidate.', ['Ok']);
      return;
    }
    
    // Add a check to ensure nextStage is not null before proceeding
    if (!this.nextStage) {
      this.openAlert('This is the final stage, or the next stage is not defined. No invite can be sent.', ['Ok']);
      return;
    }

    const applicationIds = selectedCandidates.map(c => c.application_id).filter(id => id != null);

    if (applicationIds.length === 0) {
        this.openAlert('Could not send invite. No valid candidate IDs were selected.', ['Ok']);
        return;
    }

    // Define the stage name from the component property to use it consistently
    const stageName = this.nextStage.stage_name;

    this.http
      .post(this.apiUrl + `api/recruiter/jobs/${this.jobId}/send-invites/`, {
        application_ids: applicationIds,
        invite_type: stageName, // Send the stage name
      })
      .subscribe(
        () => {
          this.openAlert(`${stageName} invites sent successfully.`, ['Ok']);
          this.fetchJobDetails();
          this.fetchInterviewStages();
        },
        (error) => {
          console.error(`Error sending ${stageName} invites:`, error);
          const errorDetail = error.error?.error || "Please try again.";
          this.openAlert(`Failed to send ${stageName} invites: ${JSON.stringify(errorDetail)}`, ['Ok']);
        }
      );
  }

  
  toggleAll(checked: boolean) {
    this.masterChecked = checked;
    this.candidates.forEach(candidate => candidate.isSelected = checked);
  }

  onCheckboxChange(candidate: any, isChecked: boolean) {
    candidate.isSelected = isChecked;
    this.updateMasterChecked();
  }

  updateMasterChecked() {
    if (this.candidates.length === 0) {
        this.masterChecked = false;
    } else {
        this.masterChecked = this.candidates.every(c => c.isSelected);
    }
  }

  loadMoreCandidates() {
    this.candidates = this.filteredAndSortedCandidates;
    this.moreCandidatesCount = 0;
  }

  openCV(url: string): void {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('No CV available for this candidate.');
    }
  }

  // --- MODIFICATION START ---
  /**
   * Opens the job description URL in a new tab.
   * @param url The relative URL of the job description file.
   */
  openJD(url: string): void {
    if (!url) {
      alert('No Job Description document available for this job.');
      return;
    }
    
    let fullUrl: string;

    // Check if the URL is absolute. If so, use it directly.
    if (url.startsWith('http')) {
      fullUrl = url;
    } else {
      // If it's a relative path, construct the full URL.
      fullUrl = `${this.apiUrl}media/${url}`;
    }
    
    window.open(fullUrl, '_blank');
  }
  // --- MODIFICATION END ---

  navigateToRecruiterHome() {
    this.router.navigate(['/job-post-list']);
  }

  fetchInterviewStages() {
    const token = this.authService.getJWTToken();
    if (this.jobId && token) {
      console.log(`Attempting to fetch interview stages for job_id: ${this.jobId}`);
      this.interviewService.getInterviewStages(this.jobId, token).subscribe(
        (stages) => {
          console.log('API call successful. Received stages:', stages);
          if (!Array.isArray(stages)) {
            console.error("The API did not return an array. Received:", stages);
            this.interviewStages = [];
            return;
          }
          const sortedStages = stages.sort((a, b) => a.order - b.order);

          // De-duplication Logic: Ensure each stage name appears only once.
          const uniqueStageNames = new Set<string>();
          const uniqueStages = sortedStages.filter(stage => {
            if (uniqueStageNames.has(stage.stage_name)) {
              return false; // This stage name is a duplicate, so we skip it.
            } else {
              uniqueStageNames.add(stage.stage_name);
              return true; // This is the first time we've seen this stage name, so we keep it.
            }
          });
          // End of De-duplication Logic

          this.interviewStages = uniqueStages; // Assign the de-duplicated array to the component property.

          console.log('Component property this.interviewStages set to (unique):', this.interviewStages);
          this.updateStageCounts();
          this.calculateNextStage();
          this.cdr.detectChanges();
          setTimeout(() => this.calculateCarouselState(), 100);
        },
        (error) => {
          console.error('Error fetching interview stages:', error);
          this.interviewStages = [];
        }
      );
    }
  }

  updateStageCounts() {
      // Calculate counts for each stage
      this.interviewStages.forEach(stage => {
          stage['count'] = this.allCandidates.filter(c => c.status.toLowerCase() === stage.stage_name.toLowerCase()).length;
      });
      // Update applied count separately
      this.appliedCount = this.allCandidates.length;
  }
  
  // addStage() {
  //   // Navigate to the edit page for interview stages
  //   this.router.navigate(['/create-job-step4', this.jobId]);
  // }

  removeStage(stageToRemove: InterviewStage, event: MouseEvent) {
    event.stopPropagation(); // Prevent the tab from being selected
    
    if (confirm(`Are you sure you want to remove the "${stageToRemove.stage_name}" stage?`)) {
      const token = this.authService.getJWTToken();
      if (!token) {
        alert('Authentication error.');
        return;
      }
      this.interviewService.deleteInterviewStage(stageToRemove.id, token).subscribe({
        next: () => {
          alert('Stage removed successfully.');
          this.fetchInterviewStages(); // Refresh the list of stages
        },
        error: (err) => {
          console.error('Error removing stage:', err);
          alert('Failed to remove stage. Please try again.');
        }
      });
    }
  }
  
  calculateNextStage() {
      if (this.activeStage.id === 'applied') {
          this.nextStage = this.interviewStages.length > 0 ? this.interviewStages[0] : null;
      } else {
          const currentIndex = this.interviewStages.findIndex(s => s.id === this.activeStage.id);
          if (currentIndex > -1 && currentIndex < this.interviewStages.length - 1) {
              this.nextStage = this.interviewStages[currentIndex + 1];
          } else {
              this.nextStage = null; // Last stage or not found
          }
      }
  }
  
  // Carousel logic (adapted from create-job-step3)
  calculateCarouselState(): void {
    if (!this.stageViewport?.nativeElement || !this.stageTrack?.nativeElement || this.interviewStages.length === 0) {
      this.maxScrollIndex = 0;
      return;
    }
    const trackWidth = this.stageTrack.nativeElement.scrollWidth;
    const viewportWidth = this.stageViewport.nativeElement.offsetWidth;
    
    if (trackWidth <= viewportWidth) {
      this.maxScrollIndex = 0;
    } else {
        const items = Array.from(this.stageTrack.nativeElement.children);
        let cumulativeWidth = 0;
        let visibleItems = 0;
        for(const item of items) {
            cumulativeWidth += (item as HTMLElement).offsetWidth;
            if(cumulativeWidth > viewportWidth) break;
            visibleItems++;
        }
      this.maxScrollIndex = Math.max(0, this.interviewStages.length - visibleItems);
    }
    if (this.currentScrollIndex > this.maxScrollIndex) {
        this.currentScrollIndex = this.maxScrollIndex;
    }
    this.cdr.detectChanges();
  }

  updateScrollPosition(): void {
    if (this.stageTrack?.nativeElement?.children.length > this.currentScrollIndex) {
      const targetItem = this.stageTrack.nativeElement.children[this.currentScrollIndex] as HTMLElement;
      if (targetItem) {
        const newX = targetItem.offsetLeft;
        this.renderer.setStyle(this.stageTrack.nativeElement, 'transform', `translateX(-${newX}px)`);
      }
    }
  }

  navigateCarousel(direction: 'prev' | 'next'): void {
    const newIndex = direction === 'next' ? this.currentScrollIndex + 1 : this.currentScrollIndex - 1;
    if (newIndex >= 0 && newIndex <= this.maxScrollIndex) {
        this.currentScrollIndex = newIndex;
        this.updateScrollPosition();
    }
  }

  private initializeNewStageForm(): void {
    this.newStageForm = this.fb.group({
      stage_name: ['Screening', Validators.required],
      custom_stage_name: [''],
      stage_date: [null, Validators.required],
      mode: ['Online', Validators.required],
      assigned_to: ['', [Validators.required, Validators.email]]
    });

    // Add listener for the 'Customize' option
    this.newStageForm.get('stage_name')?.valueChanges.subscribe(value => {
      const customNameControl = this.newStageForm.get('custom_stage_name');
      if (value === 'Customize') {
        customNameControl?.setValidators(Validators.required);
      } else {
        customNameControl?.clearValidators();
        customNameControl?.setValue(''); // Clear the custom name when not selected
      }
      customNameControl?.updateValueAndValidity();
    });
  }

  // Method to open the popup (replaces old addStage logic)
  addStage(): void {
    this.initializeNewStageForm(); // Reset the form every time it's opened
    this.showAddStagePopup = true;
  }
  
  closeAddStagePopup(): void {
    if (this.isSubmitting) return;
    this.showAddStagePopup = false;
  }

  // Called when the popup's Save button is clicked
  onSaveNewStage(): void {
    // This log confirms the function is called. We can keep it for now.
    console.log('onSaveNewStage() was called!'); 

    // This check is important. If the form is somehow invalid, we stop here.
    if (this.newStageForm.invalid) {
      this.newStageForm.markAllAsTouched();
      alert('Please fill all required fields correctly.');
      return;
    }
    
    // Prepare the data payload for the backend.
    const formValue = this.newStageForm.value;
    this.pendingStageData = {
      id: 0, // ID is not needed for creation
      stage_name: formValue.stage_name === 'Customize' ? formValue.custom_stage_name : formValue.stage_name,
      stage_date: formatDate(formValue.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: formValue.mode,
      assigned_to: formValue.assigned_to,
      order: 0, // The backend will calculate the correct order
      user_id: null
    };

    // Set the pending action and open the confirmation popup.
    this.pendingAction = 'addStageConfirm';
    this.openAlert('Are you sure you want to add this stage?', ['No', 'Yes']);
  }

  onSaveNewStageConfirmed(): void {
    if (!this.jobId || !this.pendingStageData) return;
    
    const token = this.authService.getJWTToken();
    if (!token) {
      alert('Authentication error.');
      return;
    }

    this.isSubmitting = true;
    this.interviewService.addInterviewStage(this.jobId, this.pendingStageData, token).subscribe({
      next: () => {
        this.showSuccessPopup('Stage added successfully!');
        this.closeAddStagePopup();
        this.fetchInterviewStages(); // Refresh the stage list
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to add stage:', err);
        this.showErrorPopup(`Failed to add stage: ${err.error?.errors || 'Server error'}`);
        this.isSubmitting = false;
      }
    });
  }
  
  private showSuccessPopup(message: string) {
    // This is a placeholder for your actual implementation. 
    // If you don't have this method, add it.
    console.log(`SUCCESS: ${message}`); 
    // Your actual implementation would set properties to show a temporary banner.
  }
  
  private showErrorPopup(message: string) {
    // This is a placeholder for your actual implementation.
    console.error(`ERROR: ${message}`);
  }

  // Alert handling logic
  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    const confirmed = action.toLowerCase() === 'yes';

    if (confirmed && this.pendingAction === 'addStageConfirm') {
        this.onSaveNewStageConfirmed();
    }

    // Reset pending state
    this.pendingAction = '';
    this.pendingStageData = null;
  }

}