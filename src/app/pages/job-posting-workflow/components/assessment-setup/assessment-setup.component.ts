import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { Subscription, forkJoin, of, Observable } from 'rxjs';
import { switchMap, tap, finalize, catchError, map, debounceTime } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Import Services and Types
import { AdminJobDescriptionService } from '../../../../services/admin-job-description.service';
import { CorporateAuthService } from '../../../../services/corporate-auth.service';
import { AdminJobCreationWorkflowService } from '../../../../services/admin-job-creation-workflow.service';
import { MCQItem as IMcqItem } from '../../../../pages/create-job/types';
import { environment } from '../../../../../environments/environment';

// Import Child Components
import { AlertMessageComponent } from '../../../../components/alert-message/alert-message.component';

// --- Interfaces ---
interface ParsedDetails {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
}
interface McqQuestion extends IMcqItem {
  isSelected: boolean;
  isAiGenerated: boolean;
  parsed: ParsedDetails;
}
interface SkillSection {
  skillName: string;
  questions: McqQuestion[];
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  generationStatus: 'pending' | 'loading' | 'completed' | 'failed';
}
interface UploadedQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    marks: number;
    difficulty: string;
    isSelected: boolean;
}
interface UploadedSkillSection {
    skillName: string;
    questions: UploadedQuestion[];
    isAllSelected: boolean;
    totalCount: number;
    selectedCount: number;
}
interface CodingProblem {
    id: number;
    title: string;
    description: string;
    input_format: string;
    output_format: string;
    constraints: string;
    example: string;
    isSelected: boolean;
}


// Custom Validator
export function timeNotZeroValidator(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value === '00:00' ? { timeIsZero: true } : null;
}

@Component({
  selector: 'app-assessment-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    AlertMessageComponent
  ],
  templateUrl: './assessment-setup.component.html',
  styleUrls: ['./assessment-setup.component.css']
})
export class AssessmentSetupComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() jobUniqueId: string;
  @Output() dataChanged = new EventEmitter<any>();
  @Output() validityChanged = new EventEmitter<boolean>();

  // --- COMPONENT STATE ---
  hasInitialChoiceBeenMade = false;
  isCheckingInitialState = true;
  isGenerating = false;
  isUploading = false;
  isLoading = false;
  isSubmitting = false;

  // --- POPUPS & ALERTS ---
  showUploadPopup = false;
  showAddSkillPopup = false;
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  
  // --- FORM & DATA ---
  @ViewChild('skillViewport') skillViewport: ElementRef<HTMLDivElement>;
  @ViewChild('skillTrack') skillTrack: ElementRef<HTMLDivElement>;
  
  private subscriptions = new Subscription();
  assessmentForm: FormGroup;
  skillSections: SkillSection[] = [];
  uploadedSkillSections: UploadedSkillSection[] = [];
  codingProblems: CodingProblem[] = [];

  // --- UI STATE ---
  activeTab: 'ai-generated' | 'uploaded' | 'coding-problem' = 'ai-generated';
  activeSectionIndex = 0;
  activeUploadedSectionIndex = 0;
  isAllCodingSelected = false;
  currentScrollIndex = 0;
  maxScrollIndex = 0;
  newSkillName = '';
  isAddingNewSkill = false;
  selectedExcelFile: File | null = null;
  private currentAssessmentId: string | null = null;
  private isGeneratingSequentially = false;
  
  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private authService: CorporateAuthService,
    private jobService: AdminJobDescriptionService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    if (!this.jobUniqueId) {
      this.showErrorPopup("Error: Job ID is missing.");
      this.isCheckingInitialState = false;
      return;
    }
    this.currentAssessmentId = this.workflowService.getCurrentAssessmentId();
    this.checkInitialState();

    const formChanges$ = this.assessmentForm.statusChanges.pipe(debounceTime(200));
    this.subscriptions.add(formChanges$.subscribe(status => {
      this.validityChanged.emit(status === 'VALID' && this.totalSelectedCount > 0);
      if (status === 'VALID') {
        this.emitData();
      }
    }));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.calculateCarouselState(), 100);
  }

  private checkInitialState(): void {
    this.isCheckingInitialState = true;
    this.spinner.show();
    const token = this.authService.getJWTToken();
    if (!token) {
        this.showErrorPopup("Authentication session has expired.");
        this.spinner.hide();
        this.isCheckingInitialState = false;
        return;
    }

    this.jobService.checkMcqStatus(this.jobUniqueId, token).subscribe({
      next: (status) => {
        if (status.status === 'not_started' && !status.filename) {
          this.hasInitialChoiceBeenMade = false;
        } else {
          this.hasInitialChoiceBeenMade = true;
          this.loadAllInitialData();
        }
        this.isCheckingInitialState = false;
        this.spinner.hide();
      },
      error: () => {
        this.showErrorPopup("Could not verify assessment status.");
        this.isCheckingInitialState = false;
        this.spinner.hide();
      }
    });
  }

  // --- Methods for Step 2 (Initial Choice) ---
  onGenerateAi(): void {
    if (this.isGenerating) return;
    const token = this.authService.getJWTToken();
    if (!token) { this.showErrorPopup("Authentication error."); return; }

    this.isGenerating = true;
    this.spinner.show();
    this.jobService.generateMcqsForJob(this.jobUniqueId, token)
      .pipe(finalize(() => { this.isGenerating = false; this.spinner.hide(); }))
      .subscribe({
        next: () => {
          this.showSuccessPopup('AI questions generated successfully!');
          this.hasInitialChoiceBeenMade = true;
          this.loadAllInitialData();
        },
        error: (err) => this.showErrorPopup(`Error: ${err.message || 'Could not generate questions.'}`)
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.selectedExcelFile = input.files[0];
      this.handleUploadAndProceed();
      this.closeUploadPopup();
    }
  }

  handleUploadAndProceed(): void {
    if (!this.selectedExcelFile) return;
    const token = this.authService.getJWTToken();
    if (!token) { this.showErrorPopup("Authentication error."); return; }

    this.isUploading = true;
    this.spinner.show();
    this.jobService.uploadExcelFile(this.selectedExcelFile, this.jobUniqueId, token)
      .pipe(finalize(() => { this.isUploading = false; this.spinner.hide(); }))
      .subscribe({
        next: () => {
          this.showSuccessPopup('File uploaded and processed!');
          this.hasInitialChoiceBeenMade = true;
          this.loadAllInitialData();
        },
        error: (err) => this.showErrorPopup(`Upload failed: ${err.message || 'Unknown error'}`)
      });
  }
  
  downloadTemplate(): void { window.open(environment.mcq_upload_template, '_blank'); }
  openUploadPopup() { this.showUploadPopup = true; }
  closeUploadPopup() { this.showUploadPopup = false; }
  
  // --- Methods for Step 3 (Editor) ---

  private initializeForm(): void {
    this.assessmentForm = this.fb.group({
      assessmentName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern('^(?=.*[a-zA-Z])[a-zA-Z0-9 ]*$')]],
      shuffleQuestions: [true],
      isProctored: [true],
      allowPhoneAccess: [true],
      allowVideoRecording: [true],
      timeLimit: ['01:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), timeNotZeroValidator]],
      attemptsAllowed: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  loadAllInitialData(): void {
    this.isLoading = true;
    this.spinner.show();
    const token = this.authService.getJWTToken();
    if (!token) {
        this.showErrorPopup('Authentication error.');
        this.isLoading = false;
        this.spinner.hide();
        return;
    }

    const mcqStatus$ = this.jobService.checkMcqStatus(this.jobUniqueId, token).pipe(catchError(() => of({ skills: {} })));
    const uploadedQuestions$ = this.jobService.getUploadedQuestions(this.jobUniqueId, token).pipe(catchError(() => of({ data: {} })));
    const codingProblems$ = this.jobService.getAllCodingAssessmentQuestions(token).pipe(catchError(() => of({ problems: [] })));

    this.subscriptions.add(
        forkJoin({ mcqStatus: mcqStatus$, uploadedQuestions: uploadedQuestions$, codingProblems: codingProblems$ }).pipe(
            tap(({ mcqStatus, uploadedQuestions, codingProblems }) => {
                this.skillSections = Object.keys(mcqStatus.skills).map(skillName => ({
                    skillName, questions: [], totalCount: 0, selectedCount: 0, isAllSelected: false,
                    generationStatus: mcqStatus.skills[skillName] as 'pending' | 'loading' | 'completed' | 'failed',
                }));
                this.uploadedSkillSections = Object.keys(uploadedQuestions.data).map(skillName => {
                    const questions = (uploadedQuestions.data[skillName].mcq_items || []).map((q: any) => ({
                        id: q.mcq_item_id, ...this.parseUploadedQuestionText(q.question_text), marks: 2, isSelected: false
                    }));
                    return { skillName, questions, totalCount: questions.length, selectedCount: 0, isAllSelected: false };
                });
                this.codingProblems = (codingProblems.problems || []).map((p: any) => ({ ...p, isSelected: false }));
            }),
            switchMap(() => {
                const assessmentFetch$ = this.currentAssessmentId
                    ? this.jobService.getAssessmentDetails(this.currentAssessmentId, token)
                    : this.jobService.getLatestAssessmentForJob(this.jobUniqueId, token);
                return assessmentFetch$.pipe(catchError(() => of(null)));
            }),
            switchMap(assessmentDetails => {
                if (assessmentDetails) {
                    this.currentAssessmentId = assessmentDetails.assessment_uuid;
                    this.workflowService.setCurrentAssessmentId(this.currentAssessmentId);
                    this.applyAssessmentDetails(assessmentDetails);
                }
                return this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).pipe(
                    tap(mcqResponse => {
                        const skillData = mcqResponse.data;
                        this.skillSections.forEach(section => {
                            if (skillData[section.skillName]) {
                                section.questions = this.processMcqItems(skillData[section.skillName].mcq_items);
                                section.totalCount = section.questions.length;
                                if (assessmentDetails?.selected_mcqs) {
                                    const selectedIds = new Set(assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id));
                                    section.questions.forEach(q => q.isSelected = selectedIds.has(q.mcq_item_id));
                                }
                                this.updateCountsForSection(section);
                            }
                        });
                    }),
                    catchError(() => of(null)),
                    map(() => assessmentDetails)
                );
            }),
            tap(() => this.updateCounts()),
            finalize(() => {
                this.isLoading = false;
                this.spinner.hide();
                this.cdr.detectChanges();
                this.generateRemainingSkillsSequentially();
                setTimeout(() => this.calculateCarouselState(), 50);
            })
        ).subscribe({ error: (err) => this.showErrorPopup(`Data loading failed: ${err.message}`) })
    );
  }

  addMoreAiQuestions(): void {
    if (this.isSubmitting) return;
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (!activeSection) return;

    const token = this.authService.getJWTToken();
    if (!token) {
        this.showErrorPopup('Authentication error.');
        return;
    }
    
    this.isSubmitting = true;
    this.spinner.show();

    this.subscriptions.add(
      this.jobService.generateMoreMcqsForSkill(this.jobUniqueId, activeSection.skillName, token).pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.spinner.hide();
        })
      ).subscribe({
        next: (newMcqs) => {
          const newQuestions = this.processMcqItems(newMcqs);
          activeSection.questions.push(...newQuestions);
          activeSection.totalCount = activeSection.questions.length;
          this.updateCounts();
          this.showSuccessPopup(`Added ${newQuestions.length} new questions for ${activeSection.skillName}`);
        },
        error: (err) => {
          this.showErrorPopup(`Failed to generate more questions: ${err.message}`);
        }
      })
    );
  }

  private emitData(): void {
      if (this.assessmentForm.valid && this.totalSelectedCount > 0) {
          this.dataChanged.emit(this.buildPayload());
      }
  }

  private updateCounts(): void {
    this.skillSections.forEach(section => this.updateCountsForSection(section));
    this.uploadedSkillSections.forEach(section => this.updateCountsForUploadedSection(section));
    this.updateCodingSelectedCount();
    this.cdr.detectChanges();
    this.emitData();
    this.validityChanged.emit(this.assessmentForm.valid && this.totalSelectedCount > 0);
  }

  private buildPayload(): any {
    const selectedMcqIds = this.skillSections
        .flatMap(s => s.questions)
        .filter(q => q.isSelected)
        .map(q => q.mcq_item_id);

    const selectedUploadedIds = this.uploadedSkillSections
        .flatMap(s => s.questions)
        .filter(q => q.isSelected)
        .map(q => q.id);

    const selectedCodingIds = this.codingProblems
        .filter(p => p.isSelected)
        .map(p => p.id);

    const timeParts = this.assessmentForm.value.timeLimit.split(':');
    const timeInMinutes = (parseInt(timeParts[0], 10) * 60) + parseInt(timeParts[1], 10);

    return {
        job_unique_id: this.jobUniqueId,
        name: this.assessmentForm.value.assessmentName,
        is_proctored: this.assessmentForm.value.isProctored,
        has_video_recording: this.assessmentForm.value.allowVideoRecording,
        allow_phone_access: this.assessmentForm.value.allowPhoneAccess,
        shuffle_questions_overall: this.assessmentForm.value.shuffleQuestions,
        selected_mcq_item_ids: [...selectedMcqIds, ...selectedUploadedIds],
        selected_coding_problem_ids: selectedCodingIds,
        time_limit: timeInMinutes,
        attempts_allowed: this.assessmentForm.value.attemptsAllowed
    };
  }

  openAddSkillPopup(): void {
    this.newSkillName = '';
    this.showAddSkillPopup = true;
  }

  closeAddSkillPopup(): void {
    if (this.isAddingNewSkill) return;
    this.showAddSkillPopup = false;
  }
  
  onAddNewSkillSubmit(): void {
    if (this.isAddingNewSkill) return;

    const skillNames = this.newSkillName.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (skillNames.length === 0) {
        this.showErrorPopup('Please enter at least one valid skill name.');
        return;
    }

    const existingSkillNames = new Set(this.skillSections.map(s => s.skillName.toLowerCase()));
    const newValidSkills = skillNames.filter(skill => !existingSkillNames.has(skill.toLowerCase()));

    if (newValidSkills.length !== skillNames.length) {
        this.showErrorPopup('One or more skills already exist.');
        return;
    }

    newValidSkills.forEach(skillName => {
        this.skillSections.push({
            skillName, questions: [], totalCount: 0, selectedCount: 0,
            isAllSelected: false, generationStatus: 'loading',
        });
    });

    this.closeAddSkillPopup();
    this.cdr.detectChanges();
    setTimeout(() => this.calculateCarouselState(), 100);

    this.processNewSkillsSequentially(newValidSkills);
  }

  private async processNewSkillsSequentially(skillsToProcess: string[]): Promise<void> {
    this.isAddingNewSkill = true;
    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      this.isAddingNewSkill = false;
      return;
    }
    for (const skillName of skillsToProcess) {
        const section = this.skillSections.find(s => s.skillName === skillName);
        if (!section) continue;
        try {
            const response = await this.jobService.generateMcqForSkill(this.jobUniqueId, skillName, token).toPromise();
            section.questions = this.processMcqItems(response.data);
            section.totalCount = section.questions.length;
            section.generationStatus = 'completed';
        } catch (err) {
            section.generationStatus = 'failed';
            this.showErrorPopup(`Error generating questions for "${skillName}"`);
        } finally {
            this.updateCounts();
            this.cdr.detectChanges();
        }
    }
    this.isAddingNewSkill = false;
  }

  private processMcqItems(items: IMcqItem[]): McqQuestion[] {
    if (!items) return [];
    return items.map((item) => ({
        ...item,
        isSelected: false,
        isAiGenerated: true,
        parsed: this.parseQuestionText(item.question_text)
    }));
  }

  private parseQuestionText(rawText: string): ParsedDetails {
    if (!rawText) return { question: 'Error: Empty question text.', options: [], correctAnswer: '', difficulty: 'Medium' };
    let text = rawText;
    const answerMatch = text.match(/Correct Answer:\s*([a-d])/i);
    const correctAnswer = answerMatch ? answerMatch[1].toLowerCase() : '';
    if (answerMatch) text = text.substring(0, answerMatch.index).trim();
    
    const difficultyMatch = text.match(/\s*\((Easy|Medium|Hard)\)$/i);
    const difficulty = difficultyMatch ? difficultyMatch[1] : 'Medium';
    if (difficultyMatch) text = text.substring(0, difficultyMatch.index).trim();

    const firstOptionIndex = text.toLowerCase().indexOf('a)');
    const question = firstOptionIndex !== -1 ? text.substring(0, firstOptionIndex).trim() : text.trim();
    
    const options: string[] = [];
    const optionRegex = /\b([a-d])\)\s*([\s\S]*?)(?=\s*[a-d]\)|$)/gi;
    let match;
    const tempOptions: { [key: string]: string } = {};
    while ((match = optionRegex.exec(text)) !== null) {
        tempOptions[match[1].toLowerCase()] = match[2].trim();
    }
    ['a', 'b', 'c', 'd'].forEach(key => options.push(tempOptions[key] || ''));

    return { question, options, correctAnswer, difficulty };
  }

  private parseUploadedQuestionText(rawText: string): Omit<UploadedQuestion, 'id' | 'marks' | 'isSelected'> {
    const parsed = this.parseQuestionText(rawText);
    return {
        question: parsed.question,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        difficulty: parsed.difficulty
    };
  }
  
  selectSection(index: number): void { this.activeSectionIndex = index; }
  selectUploadedSection(index: number): void { this.activeUploadedSectionIndex = index; }
  
  private calculateCarouselState(): void {
    if (!this.skillViewport?.nativeElement || !this.skillTrack?.nativeElement) {
      this.maxScrollIndex = 0;
      return;
    }
    const trackWidth = this.skillTrack.nativeElement.scrollWidth;
    const viewportWidth = this.skillViewport.nativeElement.offsetWidth;
    if (trackWidth <= viewportWidth) {
        this.maxScrollIndex = 0;
    } else {
        const childWidth = (this.skillTrack.nativeElement.firstElementChild as HTMLElement)?.offsetWidth || 1;
        this.maxScrollIndex = this.skillSections.length - Math.floor(viewportWidth / childWidth);
    }
    if (this.currentScrollIndex > this.maxScrollIndex) {
        this.currentScrollIndex = this.maxScrollIndex;
    }
    this.cdr.detectChanges();
  }
  
  private updateScrollPosition(): void {
    if (this.skillTrack?.nativeElement?.children[this.currentScrollIndex]) {
        const targetItem = this.skillTrack.nativeElement.children[this.currentScrollIndex] as HTMLElement;
        const newX = Math.min(
            targetItem.offsetLeft,
            this.skillTrack.nativeElement.scrollWidth - this.skillViewport.nativeElement.offsetWidth
        );
        this.renderer.setStyle(this.skillTrack.nativeElement, 'transform', `translateX(-${newX}px)`);
    }
  }

  navigateCarousel(direction: 'prev' | 'next'): void {
    const newIndex = direction === 'next' ? this.currentScrollIndex + 1 : this.currentScrollIndex - 1;
    if (newIndex >= 0 && newIndex <= this.maxScrollIndex) {
        this.currentScrollIndex = newIndex;
        this.updateScrollPosition();
    }
  }

  private applyAssessmentDetails(details: any): void {
    this.assessmentForm.patchValue({
        assessmentName: details.name,
        shuffleQuestions: details.shuffle_questions_overall,
        isProctored: details.is_proctored,
        allowPhoneAccess: details.allow_phone_access,
        allowVideoRecording: details.has_video_recording,
        timeLimit: this.minutesToHHMM(details.time_limit),
        attemptsAllowed: details.attempts_allowed || 1
    }, { emitEvent: false });

    if (details.selected_mcqs) {
        const selectedIds = new Set(details.selected_mcqs.map((q: any) => q.mcq_item_details.id));
        this.uploadedSkillSections.forEach(s => s.questions.forEach(q => q.isSelected = selectedIds.has(q.id)));
    }
    if (details.selected_coding_problems) {
        const selectedIds = new Set(details.selected_coding_problems.map((p: any) => p.coding_problem_details.id));
        this.codingProblems.forEach(p => p.isSelected = selectedIds.has(p.id));
    }
    this.updateCounts();
  }
  
  private async generateRemainingSkillsSequentially(): Promise<void> {
    if (this.isGeneratingSequentially) return;
    this.isGeneratingSequentially = true;
    const token = this.authService.getJWTToken();
    if (!token) { this.isGeneratingSequentially = false; return; }

    const pendingSections = this.skillSections.filter(s => s.generationStatus === 'pending');
    for (const section of pendingSections) {
        section.generationStatus = 'loading';
        this.cdr.detectChanges();
        try {
            const res = await this.jobService.generateMcqForSkill(this.jobUniqueId, section.skillName, token).toPromise();
            section.questions = this.processMcqItems(res.data);
            section.totalCount = section.questions.length;
            section.generationStatus = 'completed';
        } catch {
            section.generationStatus = 'failed';
        }
    }
    this.isGeneratingSequentially = false;
    this.updateCounts();
  }

  private minutesToHHMM(minutes: number): string {
    if (isNaN(minutes) || minutes < 0) return '00:00';
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  // --- UI Interaction Methods ---
  toggleSelectAllForSection(event: Event, section: SkillSection): void {
    section.isAllSelected = (event.target as HTMLInputElement).checked;
    section.questions.forEach(q => q.isSelected = section.isAllSelected);
    this.updateCounts();
  }

  toggleSelectAllForUploadedSection(event: Event, section: UploadedSkillSection): void {
    section.isAllSelected = (event.target as HTMLInputElement).checked;
    section.questions.forEach(q => q.isSelected = section.isAllSelected);
    this.updateCounts();
  }

  toggleSelectAllCoding(event: Event): void {
    this.isAllCodingSelected = (event.target as HTMLInputElement).checked;
    this.codingProblems.forEach(p => p.isSelected = this.isAllCodingSelected);
    this.updateCounts();
  }

  onQuestionSelectionChange(section: SkillSection): void {
    section.isAllSelected = section.questions.length > 0 && section.questions.every(q => q.isSelected);
    this.updateCounts();
  }
  onUploadedQuestionSelectionChange(section: UploadedSkillSection): void {
    section.isAllSelected = section.questions.length > 0 && section.questions.every(q => q.isSelected);
    this.updateCounts();
  }
  onCodingProblemSelectionChange(): void {
    this.isAllCodingSelected = this.codingProblems.length > 0 && this.codingProblems.every(p => p.isSelected);
    this.updateCounts();
  }

  private updateCountsForSection(section: SkillSection): void {
     section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }
  private updateCountsForUploadedSection(section: UploadedSkillSection): void {
    section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }
  private updateCodingSelectedCount(): void {
    this.isAllCodingSelected = this.codingProblems.length > 0 && this.codingProblems.every(p => p.isSelected);
  }

  // --- Getters for Template ---
  get totalSelectedCount(): number {
    const aiCount = this.skillSections.reduce((acc, s) => acc + s.selectedCount, 0);
    const uploadedCount = this.uploadedSkillSections.reduce((acc, s) => acc + s.selectedCount, 0);
    const codingCount = this.codingProblems.filter(p => p.isSelected).length;
    return aiCount + uploadedCount + codingCount;
  }
  get totalAIQuestionCount(): number { return this.skillSections.reduce((acc, s) => acc + s.totalCount, 0); }
  get uploadedQuestionCount(): number { return this.uploadedSkillSections.reduce((acc, s) => acc + s.totalCount, 0); }
  get totalQuestionCount(): number { return this.totalAIQuestionCount + this.uploadedQuestionCount + this.codingProblems.length; }

  // --- Popups ---
  showSuccessPopup(message: string): void { this.popupMessage = message; this.popupType = 'success'; this.showPopup = true; setTimeout(() => this.closePopup(), 3000); }
  showErrorPopup(message: string): void { this.popupMessage = message; this.popupType = 'error'; this.showPopup = true; setTimeout(() => this.closePopup(), 5000); }
  closePopup(): void { this.showPopup = false; }
  
  // ===================================================
  // == <<< [FIX] ADDED THE MISSING METHOD HERE >>> ==
  // ===================================================
  onAlertButtonClicked(buttonLabel: string): void {
    // This is where you would handle the logic for different button clicks.
    // For example, you might check if buttonLabel is 'Confirm', 'Delete', 'Cancel', etc.
    // For now, we'll just close the alert regardless of which button is clicked.
    console.log(`Alert button clicked: ${buttonLabel}`);
    this.showAlert = false;
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}