// src/app/components/create-job-post-22/create-job-post-22.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { McqAssessmentService } from '../../services/mcq-assessment.service';
import { JobDescriptionService } from '../../services/job-description.service';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { MCQItem as IMcqItem } from '../../pages/create-job-post-1st-page/types';

// Interface to hold the structured parts of a parsed question
interface ParsedDetails {
  question: string;
  options: string[];
  correctAnswer: string; // 'a', 'b', 'c', or 'd'
  difficulty: string;    // e.g., 'Easy', 'Medium', 'Hard'
}

// The main interface for a question used within this component
interface McqQuestion extends IMcqItem {
  isSelected: boolean;
  isAiGenerated: boolean;
  parsed: ParsedDetails; // Holds the structured question data for display
}

// The main interface for a section/skill tab
interface SkillSection {
  skillName: string;
  questions: McqQuestion[];
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
}

@Component({
  selector: 'create-job-post22',
  templateUrl: 'create-job-post-22.component.html',
  styleUrls: ['create-job-post-22.component.css'],
})
export class CreateJobPost22 implements OnInit, OnDestroy {
  @Input() jobUniqueId: string;
  @Input() rootClassName: string = '';

  private subscriptions = new Subscription();

  assessmentForm: FormGroup;
  skillSections: SkillSection[] = [];
  activeSectionIndex = 0;
  
  isLoading: boolean = true;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: CorporateAuthService,
    private mcqService: McqAssessmentService,
    private jobService: JobDescriptionService,
    private workflowService: JobCreationWorkflowService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.jobUniqueId) {
      this.fetchMcqData();
    } else {
      this.snackBar.open('Error: Job context is missing. Cannot load assessment.', 'Close', { duration: 5000 });
      this.isLoading = false;
    }
  }

  /**
   * Helper method to parse the raw question text from the backend into a structured object.
   * This logic is now centralized here to be used for both initial fetch and AI generation.
   */
  private parseQuestionText(rawText: string): ParsedDetails {
    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    
    // Default structure in case of parsing failure
    const defaultResult: ParsedDetails = {
      question: rawText,
      options: [],
      correctAnswer: '',
      difficulty: 'Medium', // Default difficulty
    };

    try {
      // Find the question line (usually the first line)
      let questionLine = lines.find(line => !/^[a-d]\)|Correct Answer:|easy|medium|hard/i.test(line.trim()));
      defaultResult.question = questionLine ? questionLine.replace(/^Q\d+\.?\s*/, '').trim() : 'Could not parse question.';

      // Extract options
      const optionLines = lines.filter(line => /^[a-d]\)/i.test(line.trim()));
      defaultResult.options = optionLines.map(line => line.trim().substring(3).trim());

      // Extract correct answer
      const answerLine = lines.find(line => /Correct Answer:/i.test(line));
      if (answerLine) {
        const match = answerLine.match(/Correct Answer:\s*([a-d])/i);
        if (match) defaultResult.correctAnswer = match[1].toLowerCase();
      }
      
      // Determine difficulty
      if (rawText.toLowerCase().includes('easy')) defaultResult.difficulty = 'Easy';
      if (rawText.toLowerCase().includes('hard')) defaultResult.difficulty = 'Hard';

      return defaultResult;
    } catch (e) {
      console.error("Failed to parse question text:", rawText, e);
      return defaultResult; // Return default on any error
    }
  }

  private initializeForm(): void {
    this.assessmentForm = this.fb.group({
      assessmentName: ['', Validators.required],
      shuffleQuestions: [true],
      isProctored: [true],
      allowPhoneAccess: [true],
      allowVideoRecording: [true],
      difficulty: [0.6], // Represents 60%
      timeLimit: ['01:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    });
  }

  private fetchMcqData(): void {
    this.isLoading = true;
    const token = this.authService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login-corporate']);
      this.isLoading = false;
      return;
    }

    this.subscriptions.add(
      this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
        next: (response) => {
          const skillData = response.data;
          this.skillSections = Object.keys(skillData).map(skillName => {
            const sectionData = skillData[skillName];
            const questions = sectionData.mcq_items.map((item): McqQuestion => ({
              ...item,
              isSelected: false,
              isAiGenerated: item.question_text.includes('✨'),
              parsed: this.parseQuestionText(item.question_text) // Parse each question
            }));
            return {
              skillName: skillName, questions: questions, totalCount: questions.length,
              selectedCount: 0, isAllSelected: false,
            };
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.snackBar.open(`Failed to load questions: ${err.message}`, 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      })
    );
  }

  // --- UI Event Handlers ---
  onDifficultyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.assessmentForm.get('difficulty')?.setValue(value / 100);
  }
  
  get difficultyPercentage(): number {
    return (this.assessmentForm.get('difficulty')?.value || 0) * 100;
  }

  toggleSelectAllForSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = isChecked;
      activeSection.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts();
    }
  }

  onQuestionSelectionChange(): void {
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = activeSection.questions.length > 0 && activeSection.questions.every(q => q.isSelected);
    }
    this.updateCounts();
  }
  
  private updateCounts(): void {
    this.skillSections.forEach(section => {
      section.selectedCount = section.questions.filter(q => q.isSelected).length;
    });
  }

  // --- Getters for Template Binding ---
  get totalSelectedCount(): number {
    if (!this.skillSections) return 0;
    return this.skillSections.reduce((acc, section) => acc + section.selectedCount, 0);
  }
  get totalQuestionCount(): number {
    if (!this.skillSections) return 0;
    return this.skillSections.reduce((acc, section) => acc + section.totalCount, 0);
  }

  selectSection(index: number): void {
    this.activeSectionIndex = index;
  }

  // --- Action Button Handlers ---
  addMoreAiQuestions(): void {
    if (this.isSubmitting) return;
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (!activeSection) return;

    this.isSubmitting = true;
    const token = this.authService.getJWTToken();
    if (!token) {
        this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
        this.isSubmitting = false; 
        return; 
    }

    this.subscriptions.add(
      this.jobService.generateMoreMcqsForSkill(this.jobUniqueId, activeSection.skillName, token).subscribe({
        next: (newMcqs) => {
          const newQuestions: McqQuestion[] = newMcqs.map(item => ({
            ...item, 
            isSelected: false, // Default new questions to not selected
            isAiGenerated: true,
            parsed: this.parseQuestionText(item.question_text) // Parse new questions
          }));
          activeSection.questions.push(...newQuestions);
          activeSection.totalCount = activeSection.questions.length;
          this.onQuestionSelectionChange(); // Update counts and select-all state
          this.snackBar.open(`Added ${newMcqs.length} new questions for ${activeSection.skillName}`, 'Close', { duration: 3000 });
          this.isSubmitting = false;
        },
        error: (err) => {
          this.snackBar.open(`Failed to generate more questions: ${err.message}`, 'Close', { duration: 5000 });
          this.isSubmitting = false;
        }
      })
    );
  }

  onPrevious(): void { this.router.navigate(['/create-job-post-21-page']); }
  onSkip(): void { this.router.navigate(['/create-job-post-3rd-page']); }
  onCancel(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/dashboard']);
  }

  onNext(): void {
    this.assessmentForm.markAllAsTouched();
    if (this.assessmentForm.invalid) {
      this.snackBar.open('Please fill in all required settings (e.g., Assessment Name).', 'Close', { panelClass: ['error-snackbar'], duration: 3000 });
      return;
    }
    if (this.totalSelectedCount === 0) {
      this.snackBar.open('Please select at least one question to proceed.', 'Close', { panelClass: ['error-snackbar'], duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.assessmentForm.value;
    const selectedIds = this.skillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as McqQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.mcq_item_id);


    const payload = {
      job_unique_id: this.jobUniqueId,
      name: formValue.assessmentName,
      is_proctored: formValue.isProctored,
      has_video_recording: formValue.allowVideoRecording,
      allow_phone_access: formValue.allowPhoneAccess,
      shuffle_questions_overall: formValue.shuffleQuestions,
      selected_mcq_item_ids: selectedIds,
      total_questions_to_present: null
    };

    const token = this.authService.getJWTToken();
    if (!token) {
        this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
        this.isSubmitting = false;
        return;
    }

    this.subscriptions.add(
      this.mcqService.saveAssessment(payload, token).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.snackBar.open('Assessment saved successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/create-job-post-3rd-page']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.snackBar.open(`Save failed: ${err.message}`, 'Close', { panelClass: ['error-snackbar'], duration: 5000 });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}