import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms'; 

// Services
import { AtsWorkflowService } from '../../services/ats-workflow.service';
import { RecruiterWorkflowCandidateService } from '../../services/recruiter-workflow-candidate.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';

// Components
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component'; 

// External Libraries for Excel
import * as XLSX from 'xlsx'; 
import * as FileSaver from 'file-saver'; 

@Component({
  selector: 'recruiter-workflow-ats',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule,
    FormsModule, 
    RouterModule, 
    RecruiterWorkflowNavbarComponent,
    AlertMessageComponent 
  ],
  templateUrl: 'recruiter-workflow-ats.component.html',
  styleUrls: ['recruiter-workflow-ats.component.css']
})
export class RecruiterWorkflowAtsComponent implements OnInit {
  
  // --- JOB DATA ---
  jobId: number | null = null;
  jobTitle: string = 'Loading...';
  clientName: string = '';

  // --- JOB SWITCHING ---
  availableJobs: any[] = [];
  selectedJobId: number | null = null;

  // --- PIPELINE DATA ---
  stages = ['Sourced', 'Screening', 'Submission', 'Interview', 'Offer', 'Hired', 'Rejected'];
  pipelineData: { [key: string]: any[] } = {};

  // --- ADD CANDIDATE STATE ---
  showAddCandidate = false;
  allCandidates: any[] = [];
  filteredCandidates: any[] = [];

  // --- CANDIDATE DETAILS MODAL STATE ---
  showCandidateDetails: boolean = false;
  selectedCandidate: any = null;

  // --- ALERT COMPONENT STATE ---
  showAlert: boolean = false;
  alertMessage: string = '';
  alertButtons: string[] = ['OK'];

  // --- CUSTOM INPUT MODALS STATE ---
  showInterviewModal: boolean = false;
  showRejectionModal: boolean = false;
  interviewDateInput: string = '';
  rejectionReasonInput: string = '';

  // --- DRAG & DROP STATE ---
  // Holds the event temporarily while waiting for user input in modal
  pendingDragEvent: CdkDragDrop<any[]> | null = null;
  pendingNewStage: string = '';

  // --- PERMISSION LOGIC ---
  currentUserId: string | null = null;
  isSuperUser: boolean = false;
  authorizedUserIds: string[] = [];

  constructor(
    private title: Title,
    private meta: Meta,
    private route: ActivatedRoute,
    private router: Router,
    private atsService: AtsWorkflowService,
    private candidateService: RecruiterWorkflowCandidateService,
    private reqService: AdbRequirementService
  ) {
    this.title.setTitle('Recruiter-Workflow-ATS - Flashyre');
  }

  ngOnInit() {
    // 1. Get Current User Info
    this.currentUserId = localStorage.getItem('user_id');
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';

    // 2. Load Jobs
    this.loadJobList();

    // 3. Subscribe to Route Changes
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.jobId = Number(idParam);
        this.selectedJobId = this.jobId;
        
        // Reset Pipeline Buckets
        this.stages.forEach(stage => this.pipelineData[stage] = []);

        // Permission & Data Loading
        if (this.availableJobs.length > 0) {
          this.loadJobPermissions(this.jobId);
        } else {
          // If availableJobs isn't populated yet (rare race condition), 
          // loadJobList will handle calling permissions when done.
          this.loadJobList(this.jobId);
        }

        this.loadPipeline();
        this.loadAllCandidates();
      }
    });
  }

  // --- DATA LOADING & PERMISSIONS ---

  loadJobList(targetId?: number) {
    this.reqService.getRequirements().subscribe({
      next: (data: any[]) => {
        // --- CHANGED: REMOVED FILTERING ---
        // All users can SEE all jobs now.
        this.availableJobs = data;

        // Handle navigation/initial selection
        if (targetId) {
          // We still calculate permissions for the specific target ID to know if they can EDIT
          this.loadJobPermissions(targetId);
        } 
        // Auto-select first job if nothing selected yet
        else if (this.availableJobs.length > 0 && !this.jobId) {
            // Optional: Automatically load the first available job
            // this.selectedJobId = this.availableJobs[0].id;
            // this.onJobSwitch();
        }
      },
      error: (err) => console.error('Failed to load jobs', err)
    });
  }

  loadJobPermissions(id: number) {
    const job = this.availableJobs.find(j => j.id === id);
    if (job) {
      this.clientName = job.client_name;
      // Prefer job_role, fallback to role, fallback to description
      const roleDisplay = job.role || job.job_role || (job.job_description ? job.job_description.slice(0, 30) : 'Job');
      this.jobTitle = roleDisplay;
      
      this.authorizedUserIds = [];

      // Add Creator
      if (job.created_by) {
        const creatorId = typeof job.created_by === 'object' ? job.created_by.user_id : job.created_by;
        this.authorizedUserIds.push(String(creatorId));
      }

      // Add Assigned Users
      const assignedList = job.assigned_users || []; // assigned_users contains IDs based on our serializer fix
      
      // Ensure we handle both object list or ID list
      assignedList.forEach((u: any) => {
        if (u && typeof u === 'object') {
             const uid = u.user_id ? String(u.user_id) : (u.id ? String(u.id) : '');
             if(uid) this.authorizedUserIds.push(uid);
        } else {
             this.authorizedUserIds.push(String(u));
        }
      });
      
      console.log('Permission Check - Authorized IDs for this Job:', this.authorizedUserIds);
    }
  }

  canMoveCandidate(): boolean {
    if (this.isSuperUser) return true;
    
    if (this.currentUserId) {
        // Normalize current user ID to string for comparison
        const currentIdStr = String(this.currentUserId).trim();
        // Check if current ID exists in the authorized list
        return this.authorizedUserIds.includes(currentIdStr);
    }
    
    return false;
  }

  loadPipeline() {
    if (!this.jobId) return;
    this.atsService.getPipelineForJob(this.jobId).subscribe(apps => {
      this.stages.forEach(stage => this.pipelineData[stage] = []);
      apps.forEach(app => {
        if (this.pipelineData[app.stage]) {
          this.pipelineData[app.stage].push(app);
        }
      });
    });
  }

  loadAllCandidates() {
    this.candidateService.getCandidates().subscribe(data => {
      this.allCandidates = data;
      this.filteredCandidates = data;
    });
  }

  onJobSwitch() {
    if (this.selectedJobId) {
      this.router.navigate(['/recruiter-workflow-ats', this.selectedJobId]);
    }
  }

  getStageNameByData(data: any[]): string {
    return this.stages.find(stage => this.pipelineData[stage] === data) || '';
  }

  // --- DRAG AND DROP LOGIC ---

  drop(event: CdkDragDrop<any[]>, newStage: string) {
    
    // 1. Check Permissions (The "Read Only" Check)
    // We check this first. If they can't move, we stop immediately.
    if (!this.canMoveCandidate()) {
         this.alertMessage = "Access Denied: You are not authorized to modify the pipeline for this Job Requirement. Only assigned recruiters can perform this action.";
         this.alertButtons = ['OK'];
         this.showAlert = true;
         return; 
    }

    // 2. Handle Drop
    if (event.previousContainer === event.container) {
      // Reordering within the same stage
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a new stage
      const prevStage = this.getStageNameByData(event.previousContainer.data);
      const prevIndex = this.stages.indexOf(prevStage);
      const newIndex = this.stages.indexOf(newStage);

      // Check for skipped stages
      if (newStage !== 'Rejected' && newIndex > prevIndex + 1) {
        this.alertMessage = `Action Not Allowed: You cannot skip stages. Please move to '${this.stages[prevIndex + 1]}'.`;
        this.alertButtons = ['OK'];
        this.showAlert = true;
        return;
      }

      // --- LOGIC TO PAUSE DROP FOR INPUT MODALS ---
      
      if (newStage === 'Interview') {
        this.pendingDragEvent = event;
        this.pendingNewStage = newStage;
        this.interviewDateInput = ''; // Reset input
        this.showInterviewModal = true; // Open Input Modal
        return; // STOP EXECUTION HERE
      }

      if (newStage === 'Rejected') {
        this.pendingDragEvent = event;
        this.pendingNewStage = newStage;
        this.rejectionReasonInput = ''; // Reset input
        this.showRejectionModal = true; // Open Input Modal
        return; // STOP EXECUTION HERE
      }

      // If no input needed, proceed immediately
      this.finalizeDrop(event, newStage);
    }
  }

  // --- MODAL SUBMISSION HANDLERS ---

  submitInterview() {
    if (!this.interviewDateInput) {
      this.alertMessage = "Please select an interview date.";
      this.alertButtons = ['OK'];
      this.showAlert = true;
      return;
    }
    // If we have a pending drop event, execute it now with data
    if (this.pendingDragEvent) {
      this.finalizeDrop(this.pendingDragEvent, 'Interview', { interview_date: this.interviewDateInput });
      this.closeModals();
    }
  }

  submitRejection() {
    if (!this.rejectionReasonInput.trim()) {
      this.alertMessage = "Please enter a reason for rejection.";
      this.alertButtons = ['OK'];
      this.showAlert = true;
      return;
    }
    // If we have a pending drop event, execute it now with data
    if (this.pendingDragEvent) {
      this.finalizeDrop(this.pendingDragEvent, 'Rejected', { rejection_reason: this.rejectionReasonInput });
      this.closeModals();
    }
  }

  closeModals() {
    this.showInterviewModal = false;
    this.showRejectionModal = false;
    this.pendingDragEvent = null;
    this.pendingNewStage = '';
  }

  // --- FINALIZE DROP (VISUAL + API) ---
  
  finalizeDrop(event: CdkDragDrop<any[]>, newStage: string, metadata: any = {}) {
    const application = event.previousContainer.data[event.previousIndex];

    // Visually move the item in the UI arrays
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    // Call API to update status
    this.atsService.updateStage(application.id, newStage, metadata).subscribe({
      next: (res) => console.log('Stage updated successfully', res),
      error: (err) => {
        this.alertMessage = "Failed to update stage on server. Reverting changes.";
        this.alertButtons = ['OK'];
        this.showAlert = true;
        this.loadPipeline(); // Reload to revert UI state
      }
    });
  }

  // --- EXCEL DOWNLOAD LOGIC ---

  downloadStageReport(stage: string) {
    const candidatesInStage = this.pipelineData[stage];

    if (!candidatesInStage || candidatesInStage.length === 0) {
      this.alertMessage = `No candidates found in the '${stage}' stage to export.`;
      this.alertButtons = ['OK'];
      this.showAlert = true;
      return;
    }

    const exportData = candidatesInStage.map(app => {
      const c = app.candidate_details;
      // Resolve resume link
      const resumeLink = c.resume_url || c.resume || '';

      return {
        'Candidate Name': `${c.first_name} ${c.last_name}`,
        'Email': c.email,
        'Phone Number': c.phone_number,
        'Current Location': c.current_location,
        'Preferred Location': c.preferred_location,
        'Total Exp': `${c.total_experience_min} - ${c.total_experience_max} Years`,
        'Relevant Exp': `${c.relevant_experience_min} - ${c.relevant_experience_max} Years`,
        'Current CTC': c.current_ctc,
        'Expected CTC': `${c.expected_ctc_min} - ${c.expected_ctc_max} LPA`,
        'Notice Period': c.notice_period,
        'Skills': c.skills,
        'Gender': c.gender,
        'Stage Updated': app.updated_at ? new Date(app.updated_at).toLocaleDateString() : '',
        'Rejection Reason': app.rejection_reason || 'N/A',
        'Interview Date': app.interview_date || 'N/A',
        'CV Link': resumeLink
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // --- HYPERLINK BUTTON LOGIC ---
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    const headers = Object.keys(exportData[0]);
    const linkColIndex = headers.indexOf('CV Link');

    if (linkColIndex !== -1) {
      for (let R = 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: linkColIndex });
        const cell = worksheet[cellAddress];

        if (cell && cell.v && cell.v !== '') {
          cell.l = { Target: cell.v as string };
          cell.v = "OPEN RESUME"; 
        } else if (cell) {
          cell.v = "No Resume";
        }
      }
    }

    // Adjust column width for visibility
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    worksheet['!cols'][linkColIndex] = { wch: 15 };

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
    
    const dateStr = new Date().toISOString().slice(0,10);
    FileSaver.saveAs(data, fileName + '_' + dateStr + EXCEL_EXTENSION);
  }

  // --- ADD CANDIDATE ---

  filterCandidates(event: any) {
    const term = event.target.value.toLowerCase();
    this.filteredCandidates = this.allCandidates.filter(c => 
      c.first_name.toLowerCase().includes(term) || c.last_name.toLowerCase().includes(term)
    );
  }

  addCandidateToPipeline(candidate: any) {
    if (!this.jobId) return;

    // --- CHECK PERMISSION ---
    if (!this.canMoveCandidate()) {
         this.alertMessage = "Access Denied: You are not authorized to add candidates to this Job Requirement.";
         this.alertButtons = ['OK'];
         this.showAlert = true;
         return; 
    }

    const payload = {
      job_requirement: this.jobId,
      candidate: candidate.id,
      stage: 'Sourced'
    };

    this.atsService.addCandidateToJob(payload).subscribe({
      next: (newApp) => {
        newApp.candidate_details = candidate; 
        this.pipelineData['Sourced'].push(newApp);
        this.showAddCandidate = false;
        this.alertMessage = "Candidate added to Sourced successfully!";
        this.alertButtons = ['OK'];
        this.showAlert = true;
      },
      error: (err) => {
        if (err.error && err.error.non_field_errors) {
            this.alertMessage = "Candidate is already in this pipeline.";
        } else {
            this.alertMessage = "Failed to add candidate.";
        }
        this.alertButtons = ['OK'];
        this.showAlert = true;
      }
    });
  }

  // --- CANDIDATE DETAILS MODAL ---

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
    } else {
      this.alertMessage = "No resume available for this candidate.";
      this.alertButtons = ['OK'];
      this.showAlert = true;
    }
  }

  // --- ALERT CLOSE HANDLERS ---
  onAlertClose() {
    this.showAlert = false;
  }

  onAlertAction(btn: string) {
    this.showAlert = false;
  }
}