import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { InterviewService, InterviewStage } from '../../../../services/interview.service';
import { CorporateAuthService } from '../../../../services/corporate-auth.service';
import { AlertMessageComponent } from '../../../../components/alert-message/alert-message.component';

@Component({
  selector: 'app-interview-flow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertMessageComponent],
  templateUrl: './interview-flow.component.html',
  styleUrls: ['./interview-flow.component.css']
})
export class InterviewFlowComponent implements OnInit, OnDestroy {
  @Input() jobUniqueId: string;
  @Output() dataChanged = new EventEmitter<any>();
  @Output() validityChanged = new EventEmitter<boolean>();

  interviewForm: FormGroup;
  isLoading = true;
  minDateString: string;
  private formChangesSubscription: Subscription;

  // Alert properties for local actions (e.g., remove stage)
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private stageToRemoveIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private interviewService: InterviewService,
    private authService: CorporateAuthService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.minDateString = today.toISOString().split('T')[0];

    this.interviewForm = this.fb.group({
      stages: this.fb.array([])
    });

    this.loadInitialStages();

    // Subscribe to form changes and emit them to the parent
    this.formChangesSubscription = this.interviewForm.statusChanges.pipe(
      debounceTime(100) // Prevent rapid firing
    ).subscribe(status => {
      this.validityChanged.emit(status === 'VALID');
      if (status === 'VALID') {
        this.dataChanged.emit(this.preparePayload());
      }
    });
  }

  ngOnDestroy(): void {
    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
    }
  }

  private loadInitialStages(): void {
    const token = this.authService.getJWTToken();
    if (!this.jobUniqueId || !token) {
      this.addStage(); // Add a default empty stage if no ID or token
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.interviewService.getInterviewStages(this.jobUniqueId, token).subscribe({
      next: (stagesData) => {
        if (stagesData && stagesData.length > 0) {
          stagesData.forEach(stage => this.stages.push(this.createStageGroupWithData(stage)));
        } else {
          this.addStage(); // Add a default stage if none exist
        }
        this.isLoading = false;
        this.interviewForm.updateValueAndValidity(); // Ensure initial status is emitted
      },
      error: (err) => {
        console.error("Failed to load interview stages:", err);
        this.addStage();
        this.isLoading = false;
      }
    });
  }

  get stages(): FormArray {
    return this.interviewForm.get('stages') as FormArray;
  }

  private createStageGroup(): FormGroup {
    const stageGroup = this.fb.group({
      stage_name: ['Screening', Validators.required],
      custom_stage_name: [''],
      stage_date: [null, Validators.required],
      mode: ['Online', Validators.required],
      assigned_to: ['', [Validators.required, Validators.email]]
    });

    this.setupCustomStageValidation(stageGroup);
    return stageGroup;
  }

  private createStageGroupWithData(data: InterviewStage): FormGroup {
    const standardStages = ['Screening', 'Technical interview - 1', 'Technical interview - 2', 'HR interview'];
    const isCustom = !standardStages.includes(data.stage_name);

    const stageGroup = this.fb.group({
      stage_name: [isCustom ? 'Customize' : data.stage_name, Validators.required],
      custom_stage_name: [isCustom ? data.stage_name : ''],
      stage_date: [data.stage_date, Validators.required],
      mode: [data.mode, Validators.required],
      assigned_to: [data.assigned_to, [Validators.required, Validators.email]]
    });
    
    this.setupCustomStageValidation(stageGroup);
    return stageGroup;
  }
  
  private setupCustomStageValidation(stageGroup: FormGroup): void {
      const customNameControl = stageGroup.get('custom_stage_name');
      stageGroup.get('stage_name')?.valueChanges.subscribe(value => {
          if (value === 'Customize') {
              customNameControl?.setValidators(Validators.required);
          } else {
              customNameControl?.clearValidators();
              customNameControl?.setValue('');
          }
          customNameControl?.updateValueAndValidity();
      });
      // Initial check
      if (stageGroup.get('stage_name')?.value === 'Customize') {
          customNameControl?.setValidators(Validators.required);
          customNameControl?.updateValueAndValidity();
      }
  }

  addStage(): void {
    this.stages.push(this.createStageGroup());
    this.interviewForm.markAsDirty();
  }

  removeStage(index: number): void {
    if (this.stages.length > 1) {
      this.stageToRemoveIndex = index;
      this.alertMessage = 'Are you sure you want to remove this interview stage?';
      this.alertButtons = ['Cancel', 'Remove'];
      this.showAlert = true;
    } else {
      // If it's the only stage, just show a simple notification that it can't be removed.
      this.alertMessage = 'You must have at least one interview stage.';
      this.alertButtons = ['OK'];
      this.showAlert = true;
    }
  }

  handleAlertAction(action: string): void {
    this.showAlert = false;
    if (action === 'Remove' && this.stageToRemoveIndex !== null) {
      this.stages.removeAt(this.stageToRemoveIndex);
      this.interviewForm.markAsDirty();
    }
    this.stageToRemoveIndex = null;
  }

  private preparePayload(): any[] {
    return this.stages.value.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      stage_date: stage.stage_date,
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1
    }));
  }
}