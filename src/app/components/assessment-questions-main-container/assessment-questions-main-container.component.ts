// src/app/components/assessment-questions-main-container/assessment-questions-main-container.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, TemplateRef, ContentChild, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { McqAssessmentService } from '../../services/mcq-assessment.service'; // Adjust path
import { CorporateAuthService } from '../../services/corporate-auth.service'; // Adjust path
import { DisplayableMcqGroup, ParsedMCQItem, ParsedMCQText, AssessmentPayload, McqsBySkillResponse, RawMCQItemFromBackend } from '../../pages/create-job-post-1st-page/types'; // Adjust path
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'assessment-questions-main-container',
  templateUrl: 'assessment-questions-main-container.component.html',
  styleUrls: ['assessment-questions-main-container.component.css'],
})
export class AssessmentQuestionsMainContainer implements OnInit, OnChanges {
  // Existing @ContentChild and @Input properties...
  @ContentChild('aiGeneratedText') aiGeneratedTextRef: TemplateRef<any>; // Use unique names for ContentChild refs
  @ContentChild('phoneAccessText') phoneAccessTextRef: TemplateRef<any>;
  // ... (rename all your @ContentChild refs like this to avoid conflicts with property names)
  @Input() assessmentNameInputPlaceholder: string = 'Assessment Name';
  @Input() uploadInputFieldPlaceholder: string = 'Upload Questions';
  rawbj7x: string = ' '; // Example, ensure these are used or remove
  rawnawq: string = ' '; // Example

  // New properties
  @Input() jobUniqueId: string;
  @ViewChild('assessmentNameInput') assessmentNameInputEl: ElementRef<HTMLInputElement>;
  @ViewChild('selectAllAiCheckbox') selectAllAiCheckboxEl: ElementRef<HTMLInputElement>;


  assessmentName: string = '';
  aiGeneratedMcqsBySkill: DisplayableMcqGroup = {};
  selectedMcqItemIds: Set<number> = new Set<number>(); // Stores MCQItem.id
  isLoadingMcqs: boolean = false;
  activeTab: 'ai' | 'uploaded' = 'ai'; // Default to 'ai'

  // Proctoring and assessment settings
  isProctored: boolean = false; // Default values
  hasVideoRecording: boolean = false;
  allowPhoneAccess: boolean = false;
  shuffleQuestionsOverall: boolean = false;
  totalQuestionsToPresentInput: string = ''; // Bound to the input, will be parsed to number
  
  selectAllAiQuestions: boolean = false; // For the "Select All" checkbox for AI questions

  private isBrowser: boolean;

  constructor(
    private mcqAssessmentService: McqAssessmentService,
    private corporateAuthService: CorporateAuthService,
    private snackBar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Initial load if jobUniqueId is already set
    if (this.jobUniqueId && this.isBrowser) {
      this.loadAiGeneratedMcqs();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobUniqueId'] && this.jobUniqueId && this.isBrowser) {
      this.loadAiGeneratedMcqs();
    }
  }

  loadAiGeneratedMcqs(): void {
    if (!this.jobUniqueId) {
      // console.warn('Job Unique ID is not available to load MCQs.');
      return;
    }
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication token not found.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoadingMcqs = true;
    this.aiGeneratedMcqsBySkill = {}; // Reset before loading
    this.selectedMcqItemIds.clear();
    this.selectAllAiQuestions = false;

    this.mcqAssessmentService.getMcqsForJobPost(this.jobUniqueId, token)
      .subscribe({
        next: (response: McqsBySkillResponse) => {
          if (response && typeof response === 'object') {
            Object.keys(response).forEach(skill => {
              const skillGroup = response[skill];
              if (skillGroup && skillGroup.mcq_items) {
                if (!this.aiGeneratedMcqsBySkill[skill]) {
                  this.aiGeneratedMcqsBySkill[skill] = { jobMcqId: skillGroup.job_mcq_id, items: [] };
                }
                this.aiGeneratedMcqsBySkill[skill].items = skillGroup.mcq_items.map(rawItem => ({
                  ...rawItem,
                  parsedDetails: this.parseMcqRawText(rawItem.question_text),
                  isSelected: false // Initialize isSelected
                }));
              }
            });
          }
          this.isLoadingMcqs = false;
        },
        error: (err) => {
          this.isLoadingMcqs = false;
          this.snackBar.open(`Error loading MCQs: ${err.message || 'Unknown error'}`, 'Close', { duration: 5000 });
          console.error('Error loading MCQs:', err);
        }
      });
  }

  private parseMcqRawText(rawText: string): ParsedMCQText {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
    let question = '';
    const options: string[] = [];
    let correctAnswerLabel = '';

    if (lines.length > 0) {
      // Extract question (handle potential "Qx. " prefix)
      question = lines[0].replace(/^Q\d+\.?\s*/i, '').trim();
    }

    const optionRegex = /^\s*([a-dA-D])\)\s*(.+)/; // Matches "a) Option text"
    const answerRegex = /^\s*Correct Answer:\s*([a-dA-D])\s*$/i; // Matches "Correct Answer: a"

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optionMatch = line.match(optionRegex);
      if (optionMatch) {
        // We only store the option text, the label (a,b,c,d) is derived by index later
        options.push(optionMatch[2].trim());
      } else {
        const answerMatch = line.match(answerRegex);
        if (answerMatch) {
          correctAnswerLabel = answerMatch[1].toLowerCase();
          // No break here, continue in case there's more text after answer (though unlikely for well-formed data)
        }
      }
    }
     // Ensure at least 4 options, pad with empty strings if necessary (or handle display differently)
    while (options.length < 4) {
      options.push(''); // Or "N/A"
    }

    return { question, options: options.slice(0, 4), correctAnswerLabel }; // Take only first 4 options
  }


  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(97 + index); // a, b, c, d
  }

  toggleMcqSelection(mcqItemId: number, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedMcqItemIds.add(mcqItemId);
    } else {
      this.selectedMcqItemIds.delete(mcqItemId);
    }
    this.updateSelectAllCheckboxState();
  }

  toggleSelectAllAiQuestions(): void { // Renamed to be more specific
    // This method is called when the "Select All" checkbox state is changed BY THE USER
    // So, this.selectAllAiQuestions already reflects the new desired state
    const currentSkillKeys = this.getObjectKeys(this.aiGeneratedMcqsBySkill);
    if (this.selectAllAiQuestions) { // If "Select All" is now checked
      currentSkillKeys.forEach(skill => {
        this.aiGeneratedMcqsBySkill[skill].items.forEach(item => {
          this.selectedMcqItemIds.add(item.mcq_item_id);
          item.isSelected = true; // Update individual item state for UI if needed
        });
      });
    } else { // If "Select All" is now unchecked
      this.selectedMcqItemIds.clear();
      currentSkillKeys.forEach(skill => {
        this.aiGeneratedMcqsBySkill[skill].items.forEach(item => {
          item.isSelected = false; // Update individual item state
        });
      });
    }
  }
  
  // Call this after individual checkbox changes to see if "Select All" should be checked/unchecked
  private updateSelectAllCheckboxState(): void {
    const currentSkillKeys = this.getObjectKeys(this.aiGeneratedMcqsBySkill);
    if (currentSkillKeys.length === 0 && this.selectedMcqItemIds.size === 0) {
        this.selectAllAiQuestions = false;
        return;
    }

    let allSelected = true;
    for (const skill of currentSkillKeys) {
      for (const item of this.aiGeneratedMcqsBySkill[skill].items) {
        if (!this.selectedMcqItemIds.has(item.mcq_item_id)) {
          allSelected = false;
          break;
        }
      }
      if (!allSelected) break;
    }
    this.selectAllAiQuestions = allSelected;
  }


  setActiveTab(tab: 'ai' | 'uploaded'): void {
    this.activeTab = tab;
    // Potentially load uploaded questions if that tab is selected and not yet loaded
  }

  // Method to be called by the parent component
  public getAssessmentPayload(): AssessmentPayload | null {
    const assessmentNameTrimmed = this.assessmentName.trim();
    if (!assessmentNameTrimmed) {
      this.snackBar.open('Assessment Name is required.', 'Close', { duration: 3000 });
      if (this.assessmentNameInputEl?.nativeElement) {
          this.assessmentNameInputEl.nativeElement.focus();
      }
      return null;
    }

    if (this.activeTab === 'ai' && this.selectedMcqItemIds.size === 0) {
      this.snackBar.open('Please select at least one AI-generated question.', 'Close', { duration: 3000 });
      return null;
    }
    // Add similar validation if activeTab === 'uploaded'

    let totalQuestionsNum: number | null = null;
    if (this.totalQuestionsToPresentInput.trim() !== '') {
      const parsedNum = parseInt(this.totalQuestionsToPresentInput.trim(), 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        totalQuestionsNum = parsedNum;
      } else {
        this.snackBar.open('Total Questions to Present must be a valid positive number if provided.', 'Close', { duration: 4000 });
        return null;
      }
    }
    
    // Ensure total_questions_to_present is not greater than selected questions
    if (totalQuestionsNum !== null && totalQuestionsNum > this.selectedMcqItemIds.size) {
        this.snackBar.open(`Total Questions to Present (${totalQuestionsNum}) cannot exceed the number of selected questions (${this.selectedMcqItemIds.size}).`, 'Close', { duration: 5000 });
        return null;
    }


    return {
      job_unique_id: this.jobUniqueId,
      name: assessmentNameTrimmed,
      selected_mcq_item_ids: Array.from(this.selectedMcqItemIds),
      is_proctored: this.isProctored,
      has_video_recording: this.hasVideoRecording,
      allow_phone_access: this.allowPhoneAccess,
      shuffle_questions_overall: this.shuffleQuestionsOverall,
      total_questions_to_present: totalQuestionsNum,
    };
  }

  // --- Functions to update proctoring settings based on toggle switch events ---
  onProctoredChange(event: Event): void {
    this.isProctored = (event.target as HTMLInputElement).checked;
  }
  onVideoRecordingChange(event: Event): void {
    this.hasVideoRecording = (event.target as HTMLInputElement).checked;
  }
  onPhoneAccessChange(event: Event): void {
    this.allowPhoneAccess = (event.target as HTMLInputElement).checked;
  }
   onShuffleChange(event: Event): void {
    this.shuffleQuestionsOverall = (event.target as HTMLInputElement).checked;
  }
}