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
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component'; 

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
    RecruiterWorkflowNavbarComponent,
    AlertMessageComponent ], // Import DragDropModule here
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

  // --- NEW: ALERT STATE ---
  showAlert: boolean = false;
  alertMessage: string = '';
  alertButtons: string[] = ['OK'];

  // --- PERMISSION LOGIC ---
  currentUserId: string | null = null;
  isSuperUser: boolean = false;
  authorizedUserIds: string[] = []; // Stores IDs of Creator + Assigned Users

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

    // 1. Get Current User Info
    this.currentUserId = localStorage.getItem('user_id');
    // Check if Super Admin (stored as string 'true' in login logic)
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';

    this.loadJobList();

    // 2. Subscribe to URL changes (so switching jobs updates the view)
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.jobId = Number(idParam);
        this.selectedJobId = this.jobId; // Sync dropdown
        
        // Reset and Reload
        this.stages.forEach(stage => this.pipelineData[stage] = []);

        // IF jobs are already loaded, set permissions immediately
        // IF NOT (first page load), loadJobList will handle it
        if (this.availableJobs.length > 0) {
          this.loadJobPermissions(this.jobId);
        } else {
          this.loadJobList(this.jobId);
        }

        this.loadPipeline();
        this.loadAllCandidates();
      }
    });
  }

  // --- UPDATED: Load Permissions from Local Array ---
  loadJobPermissions(id: number) {
    // Find the job object in the already fetched list
    const job = this.availableJobs.find(j => j.id === id);

    if (job) {
      // 1. Update UI Headers
      this.clientName = job.client_name;
      this.jobTitle = job.job_description ? job.job_description.slice(0, 30) + '...' : 'Job Details';
      
      this.authorizedUserIds = [];

      // 2. Add Creator Permission
      if (job.created_by) {
        // Handle case where serializer returns Object vs ID
        const creatorId = typeof job.created_by === 'object' ? job.created_by.user_id : job.created_by;
        this.authorizedUserIds.push(String(creatorId));
      }

      // 3. Add Assigned Users Permission
      // Based on your previous serializer, you likely have 'assigned_users_details' (read) 
      // or just 'assigned_users' (list of IDs). We check both.
      const assignedList = job.assigned_users_details || job.assigned_users || [];
      
      if (Array.isArray(assignedList)) {
        assignedList.forEach((u: any) => {
          // Handle Object (User detail) vs Primitive (User ID)
          const uid = typeof u === 'object' ? u.user_id : u;
          this.authorizedUserIds.push(String(uid));
        });
      }
      
      console.log('Authorized Users for Job:', this.authorizedUserIds);
    }
  }

  // --- CHECK PERMISSION HELPER ---
  canMoveCandidate(): boolean {
    // 1. Allow if Super Admin
    if (this.isSuperUser) return true;

    // 2. Allow if Current User is in the Authorized List
    if (this.currentUserId && this.authorizedUserIds.includes(this.currentUserId)) {
      return true;
    }

    return false;
  }

  // --- UPDATED: Load List + Optional Initial Permission Set ---
  loadJobList(targetId?: number) {
    this.reqService.getRequirements().subscribe({
      next: (data) => {
        this.availableJobs = data;
        
        // If we were waiting for data to set permissions for a specific ID
        if (targetId) {
          this.loadJobPermissions(targetId);
        }
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

  // Helper to identify stage name from the data array
  getStageNameByData(data: any[]): string {
    return this.stages.find(stage => this.pipelineData[stage] === data) || '';
  }

  // --- UPDATED DRAG AND DROP HANDLER ---
  drop(event: CdkDragDrop<any[]>, newStage: string) {
    
    // 1. PERMISSION CHECK (First thing to check)
    if (event.previousContainer !== event.container) {
       // Only restrict moving between stages (columns). 
       // Reordering within same column is usually visual, but we can restrict that too if desired.
       if (!this.canMoveCandidate()) {
         this.alertMessage = "Access Denied: You are not assigned to this requirement. Only assigned recruiters can move candidates.";
         this.showAlert = true;
         return; // Stop execution
       }
    } else {
        // Even for re-ordering within column, let's restrict it to maintain consistency
        if (!this.canMoveCandidate()) {
            return; // Silently fail or alert for reordering
        }
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // 2. STAGE SKIP LOGIC (Existing)
      const prevStage = this.getStageNameByData(event.previousContainer.data);
      const prevIndex = this.stages.indexOf(prevStage);
      const newIndex = this.stages.indexOf(newStage);

      if (newStage !== 'Rejected' && newIndex > prevIndex + 1) {
        this.alertMessage = `Action Not Allowed: You cannot skip stages. Please move from '${prevStage}' to '${this.stages[prevIndex + 1]}'.`;
        this.showAlert = true;
        return;
      }

      // 3. PROCEED WITH MOVE
      const application = event.previousContainer.data[event.previousIndex];
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      let metadata = {};
      
      if (newStage === 'Rejected') {
        const reason = prompt("Reason for rejection?");
        if (!reason) {
            this.loadPipeline(); 
            return; 
        }
        metadata = { rejection_reason: reason };
      }
      
      if (newStage === 'Interview') {
        const dateStr = prompt("Enter Interview Date (YYYY-MM-DD):");
        metadata = { interview_date: dateStr }; 
      }

      this.atsService.updateStage(application.id, newStage, metadata).subscribe({
        next: (res) => console.log('Stage updated', res),
        error: (err) => {
          this.alertMessage = "Failed to update stage on server.";
          this.showAlert = true;
          this.loadPipeline(); 
        }
      });
    }
  }

  // --- ALERT HANDLERS ---
  onAlertClose() {
    this.showAlert = false;
  }

  onAlertAction(btn: string) {
    this.showAlert = false;
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