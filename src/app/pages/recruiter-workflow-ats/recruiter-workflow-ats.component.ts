import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { AtsWorkflowService } from '../../services/ats-workflow.service';
import { RecruiterWorkflowCandidateService } from '../../services/recruiter-workflow-candidate.service';

@Component({
  selector: 'app-recruiter-workflow-ats',
  standalone: true,
  imports: [CommonModule, DragDropModule], // Import DragDropModule here
  templateUrl: './recruiter-workflow-ats.component.html',
  styleUrls: ['./recruiter-workflow-ats.component.css']
})
export class RecruiterWorkflowAtsComponent implements OnInit {
  
  jobId: number | null = null;
  jobTitle: string = 'Loading...';
  clientName: string = '';

  // The 7 Stages
  stages = ['Sourced', 'Screening', 'Submission', 'Interview', 'Offer', 'Hired', 'Rejected'];
  
  // Data Structure: { 'Sourced': [App1, App2], 'Screening': [] ... }
  pipelineData: { [key: string]: any[] } = {};

  // Add Candidate Logic
  showAddCandidate = false;
  allCandidates: any[] = [];
  filteredCandidates: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private atsService: AtsWorkflowService,
    private candidateService: RecruiterWorkflowCandidateService
  ) {}

  ngOnInit() {
    // 1. Get Job ID from URL (e.g., /ats/15)
    this.jobId = Number(this.route.snapshot.paramMap.get('id'));
    
    // 2. Initialize Empty Pipeline buckets
    this.stages.forEach(stage => this.pipelineData[stage] = []);

    // 3. Load Data
    if (this.jobId) {
      this.loadPipeline();
      this.loadAllCandidates(); // For the "Add" dropdown
    }
  }

  loadPipeline() {
    this.atsService.getPipelineForJob(this.jobId!).subscribe(apps => {
      // Clear buckets
      this.stages.forEach(stage => this.pipelineData[stage] = []);
      
      // Distribute applications into buckets
      apps.forEach(app => {
        if (this.pipelineData[app.stage]) {
          this.pipelineData[app.stage].push(app);
        }
      });
    });
  }

  loadAllCandidates() {
    // Fetch all candidates to allow adding them to the pipeline
    this.candidateService.getCandidates().subscribe(data => {
      this.allCandidates = data;
      this.filteredCandidates = data;
    });
  }

  // --- DRAG AND DROP HANDLER ---
  drop(event: CdkDragDrop<any[]>, newStage: string) {
    if (event.previousContainer === event.container) {
      // Reordering in same column (Visual only, usually no backend update needed for simple ATS)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a NEW STAGE
      const application = event.previousContainer.data[event.previousIndex];
      
      // 1. Optimistic UI Update (Visual move immediately)
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // 2. Handle Specific Stage Logic (Prompts)
      let metadata = {};
      
      if (newStage === 'Rejected') {
        const reason = prompt("Reason for rejection?");
        if (!reason) {
            // If cancelled, revert (reload pipeline)
            this.loadPipeline(); 
            return; 
        }
        metadata = { rejection_reason: reason };
      }
      
      if (newStage === 'Interview') {
        // In real app, open a DatePicker modal
        const dateStr = prompt("Enter Interview Date (YYYY-MM-DD):");
        metadata = { interview_date: dateStr }; 
      }

      // 3. Backend Update
      this.atsService.updateStage(application.id, newStage, metadata).subscribe({
        next: (res) => console.log('Stage updated', res),
        error: (err) => {
          alert("Failed to update stage");
          this.loadPipeline(); // Revert on error
        }
      });
    }
  }

  // --- ADD CANDIDATE LOGIC ---
  filterCandidates(event: any) {
    const term = event.target.value.toLowerCase();
    this.filteredCandidates = this.allCandidates.filter(c => 
      c.first_name.toLowerCase().includes(term) || c.last_name.toLowerCase().includes(term)
    );
  }

  addCandidateToPipeline(candidate: any) {
    if (!this.jobId) return;

    const payload = {
      job_requirement: this.jobId,
      candidate: candidate.id,
      stage: 'Sourced' // Start at beginning
    };

    this.atsService.addCandidateToJob(payload).subscribe({
      next: (newApp) => {
        // Add to UI immediately
        // We need to construct the object structure to match the serializer return
        newApp.candidate_details = candidate; 
        this.pipelineData['Sourced'].push(newApp);
        this.showAddCandidate = false;
        alert("Candidate added to Sourced!");
      },
      error: (err) => {
        if (err.error && err.error.non_field_errors) {
            alert("Candidate is already in this pipeline.");
        } else {
            alert("Failed to add candidate.");
        }
      }
    });
  }
}