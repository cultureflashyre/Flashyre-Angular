import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Import Router & RouterModule
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { AtsWorkflowService } from '../../services/ats-workflow.service';
import { RecruiterWorkflowCandidateService } from '../../services/recruiter-workflow-candidate.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

import * as XLSX from 'xlsx'; // Import SheetJS
import * as FileSaver from 'file-saver'; // Import FileSaver

@Component({
  selector: 'recruiter-workflow-ats',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule,
    FormsModule, 
    RouterModule, 
    RecruiterWorkflowNavbarComponent], // Import DragDropModule here
  templateUrl: 'recruiter-workflow-ats.component.html',
  styleUrls: ['recruiter-workflow-ats.component.css']
})
export class RecruiterWorkflowAtsComponent implements OnInit {
  
  jobId: number | null = null;
  jobTitle: string = 'Loading...';
  clientName: string = '';

  // Job Switching Data
  availableJobs: any[] = [];
  selectedJobId: number | null = null; // Bound to the dropdown

  // The 7 Stages
  stages = ['Sourced', 'Screening', 'Submission', 'Interview', 'Offer', 'Hired', 'Rejected'];
  
  // Data Structure: { 'Sourced': [App1, App2], 'Screening': [] ... }
  pipelineData: { [key: string]: any[] } = {};

  // Add Candidate Logic
  showAddCandidate = false;
  allCandidates: any[] = [];
  filteredCandidates: any[] = [];

  // --- CANDIDATE DETAILS MODAL STATE ---
  showCandidateDetails: boolean = false;
  selectedCandidate: any = null;

  constructor(
    private title: Title,
    private meta: Meta,
    private route: ActivatedRoute,
    private router: Router, // Inject Router
    private atsService: AtsWorkflowService,
    private candidateService: RecruiterWorkflowCandidateService,
    private reqService: AdbRequirementService // Inject Requirement Service
  ) {
    this.title.setTitle('Recruiter-Workflow-ATS - Flashyre');
  }

  ngOnInit() {

    this.loadJobList();

    // 2. Subscribe to URL changes (so switching jobs updates the view)
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.jobId = Number(idParam);
        this.selectedJobId = this.jobId; // Sync dropdown
        
        // Reset and Reload
        this.stages.forEach(stage => this.pipelineData[stage] = []);
        this.loadPipeline();
        this.loadAllCandidates();
      }
    });
  }

  // --- JOB SWITCHING LOGIC ---
  loadJobList() {
    this.reqService.getRequirements().subscribe({
      next: (data) => {
        this.availableJobs = data;
      },
      error: (err) => console.error('Failed to load jobs', err)
    });
  }

  onJobSwitch() {
    if (this.selectedJobId) {
      // Navigate to the new URL. The route subscription will handle data reloading.
      this.router.navigate(['/recruiter-workflow-ats', this.selectedJobId]);
    }
  }

  loadPipeline() {
    if (!this.jobId) return;
    this.atsService.getPipelineForJob(this.jobId).subscribe(apps => {
      // Clear buckets
      this.stages.forEach(stage => this.pipelineData[stage] = []);
      
      // Distribute
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

  downloadStageReport(stage: string) {
    const candidatesInStage = this.pipelineData[stage];

    if (!candidatesInStage || candidatesInStage.length === 0) {
      alert(`No candidates found in the '${stage}' stage to export.`);
      return;
    }

    // 1. Map Data to Excel Format
    // We flatten the nested 'candidate_details' into a single row object
    const exportData = candidatesInStage.map(app => {
      const c = app.candidate_details;
      return {
        'Candidate Name': `${c.first_name} ${c.last_name}`,
        'Email': c.email,
        'Phone Number': c.phone_number,
        'Current Location': c.current_location,
        'Preferred Location': c.preferred_location,
        'Total Exp (Years)': `${c.total_experience_min} - ${c.total_experience_max}`,
        'Relevant Exp (Years)': `${c.relevant_experience_min} - ${c.relevant_experience_max}`,
        'Current CTC': c.current_ctc,
        'Expected CTC': `${c.expected_ctc_min} - ${c.expected_ctc_max} LPA`,
        'Notice Period': c.notice_period,
        'Skills': c.skills,
        'Gender': c.gender,
        'Work Experience': c.work_experience,
        'Stage Updated At': app.updated_at ? new Date(app.updated_at).toLocaleDateString() : '',
        'Rejection Reason': app.rejection_reason || 'N/A',
        'Interview Date': app.interview_date || 'N/A',
        // We prep this field for the link
        'CV Link': c.resume_url ? c.resume_url : 'Not Available'
      };
    });

    // 2. Create Worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // 3. Add Hyperlinks to the "CV Link" column
    // The "CV Link" is the last column (Column Q if counting fields above).
    // We iterate through rows to set the hyperlink property.
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    
    // Find index of 'CV Link' column
    const headers = Object.keys(exportData[0]);
    const linkColIndex = headers.indexOf('CV Link');

    for (let R = 1; R <= range.e.r; ++R) { // Start from row 1 (skip header)
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: linkColIndex });
      const cell = worksheet[cellAddress];

      if (cell && cell.v && cell.v !== 'Not Available') {
        // Create the hyperlink
        cell.l = { Target: cell.v as string };
        // Change text to "View CV" so it looks like a button/link
        cell.v = "View CV"; 
        // Optional: Style note - pure XLS styling requires 'xlsx-style' (paid/pro), 
        // but standard Excel will recognize the link.
      }
    }

    // 4. Create Workbook and Export
    const workbook: XLSX.WorkBook = { 
      Sheets: { 'Candidates': worksheet }, 
      SheetNames: ['Candidates'] 
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, `${this.clientName}_${stage}_Report`);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    
    // Create format: ClientName_Stage_Date.xlsx
    const dateStr = new Date().toISOString().slice(0,10);
    FileSaver.saveAs(data, fileName + '_' + dateStr + EXCEL_EXTENSION);
  }

  viewCandidateDetails(candidate: any) {
    this.selectedCandidate = candidate;
    this.showCandidateDetails = true;
  }

  closeCandidateDetails() {
    this.showCandidateDetails = false;
    this.selectedCandidate = null;
  }

  openResume(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}