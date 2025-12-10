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

  isBackwardMoveConfirmation: boolean = false;

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
          this.loadJobList(this.jobId);
        }

        this.loadPipeline();
        this.loadAllCandidates();
      }
    });
  }

  // --- DATA LOADING & PERMISSIONS ---

  // --- UPDATED: Load List with Robust Filtering & Debugging ---
  // --- UPDATED: Load List with Deep Inspection & Trimming ---
  loadJobList(targetId?: number) {
    this.reqService.getRequirements().subscribe({
      next: (data: any[]) => {
        
        // 1. Get Current User Credentials & Clean them
        const rawUserId = localStorage.getItem('user_id');
        const currentUserId = rawUserId ? rawUserId.trim() : ''; 
        const isSuperUser = localStorage.getItem('isSuperUser') === 'true';

        console.log("ATS Filtering - Current User ID (Cleaned):", `'${currentUserId}'`);
        console.log("ATS Filtering - Is Super User:", isSuperUser);

        // 2. Apply Filtering
        if (isSuperUser) {
          this.availableJobs = data;
        } else {
          if (!currentUserId) {
            console.warn("No user_id found in localStorage. Cannot filter jobs.");
            this.availableJobs = [];
            return;
          }

          // Debug: Print the structure of the first job's assigned list to console
          if (data.length > 0) {
            console.log("DEBUG: First Job Assigned Users Data:", JSON.stringify(data[0].assigned_users, null, 2));
          }

          this.availableJobs = data.filter(job => {
            const assignedList = job.assigned_users || [];
            
            // Check if ANY entry in the assigned list matches
            const isAssigned = assignedList.some((u: any) => {
              // Normalize Comparison: Convert to String and Trim Whitespace
              // This fixes issues where ' ID ' != 'ID'
              const target = currentUserId;

              // Case A: Direct Value (String/Int)
              if (u !== null && typeof u !== 'object') {
                return String(u).trim() === target;
              }

              // Case B: Object with user_id or id
              if (u && typeof u === 'object') {
                const uId = u.user_id ? String(u.user_id).trim() : '';
                const id = u.id ? String(u.id).trim() : '';
                return uId === target || id === target;
              }

              return false;
            });

            return isAssigned;
          });
        }

        console.log(`ATS Filtering - Total Jobs: ${data.length}, Visible Jobs: ${this.availableJobs.length}`);

        // 3. Handle Navigation / Selection
        if (targetId) {
          const hasAccess = this.availableJobs.find(j => j.id === targetId);
          if (hasAccess) {
            this.loadJobPermissions(targetId);
          } else {
            this.alertMessage = "You do not have permission to view this requirement.";
            this.alertButtons = ['OK'];
            this.showAlert = true;
            
            if (this.availableJobs.length > 0) {
               this.selectedJobId = this.availableJobs[0].id;
               this.onJobSwitch();
            } else {
               this.selectedJobId = null;
               this.stages.forEach(s => this.pipelineData[s] = []);
            }
          }
        } else if (this.availableJobs.length > 0 && !this.jobId) {
            // Optional: Auto-load first job
            // this.selectedJobId = this.availableJobs[0].id;
            // this.onJobSwitch();
        }
      },
      error: (err) => {
        // Handle 403 specifically if needed, though this call is for requirements
        console.error('Failed to load jobs', err);
      }
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
      const assignedList = job.assigned_users_details || job.assigned_users || [];
      if (Array.isArray(assignedList)) {
        assignedList.forEach((u: any) => {
          const uid = typeof u === 'object' ? u.user_id : u;
          this.authorizedUserIds.push(String(uid));
        });
      }
    }
  }

  canMoveCandidate(): boolean {
    if (this.isSuperUser) return true;
    if (this.currentUserId && this.authorizedUserIds.includes(this.currentUserId)) {
      return true;
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
    
    // 1. Check Permissions
    if (event.previousContainer !== event.container || event.currentIndex !== event.previousIndex) {
       if (!this.canMoveCandidate()) {
         this.alertMessage = "Access Denied: You are not assigned to this requirement.";
         this.alertButtons = ['OK'];
         this.showAlert = true;
         return; 
       }
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

      // 1. [NEW] Check for BACKWARD move
      if (newIndex < prevIndex) {
        this.pendingDragEvent = event;
        this.pendingNewStage = newStage;
        this.isBackwardMoveConfirmation = true; // Set flag
        
        // Trigger Alert
        this.alertMessage = `You are moving this candidate back to '${newStage}'. Are you sure?`;
        this.alertButtons = ['Yes', 'No'];
        this.showAlert = true;
        return; // Stop here and wait for Alert Action
      }

      // Check for skipped stages
      if (newStage !== 'Rejected' && newIndex > prevIndex + 1) {
        this.alertMessage = `Action Not Allowed: You cannot skip stages. Please move to '${this.stages[prevIndex + 1]}'.`;
        this.alertButtons = ['OK'];
        this.showAlert = true;
        return;
      }

      this.processStageTransition(event, newStage);

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
      
      // FIX: Check BOTH resume_url AND resume fields to ensure we capture the link
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
        // Assign the resolved link here
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

        // Check if cell has a value (URL)
        if (cell && cell.v && cell.v !== '') {
          // Set Hyperlink property
          cell.l = { Target: cell.v as string };
          // Change display text to "OPEN RESUME"
          cell.v = "OPEN RESUME"; 
        } else if (cell) {
          // Explicitly set text if empty
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

    // [NEW LOGIC] Check if we are responding to a backward move warning
    if (this.isBackwardMoveConfirmation) {
      if (btn === 'Yes' && this.pendingDragEvent) {
        // User said YES: Continue with the move
        this.processStageTransition(this.pendingDragEvent, this.pendingNewStage);
      } else {
        // User said NO: Cancel everything
        this.pendingDragEvent = null;
        this.pendingNewStage = '';
      }
      // Reset the flag
      this.isBackwardMoveConfirmation = false;
    }
  }

  processStageTransition(event: CdkDragDrop<any[]>, newStage: string) {
  
  // 1. Check if we need the Interview Modal
  if (newStage === 'Interview') {
    this.pendingDragEvent = event;
    this.pendingNewStage = newStage;
    this.interviewDateInput = ''; // Reset input
    this.showInterviewModal = true; 
    return; 
  }

  // 2. Check if we need the Rejection Modal
  if (newStage === 'Rejected') {
    this.pendingDragEvent = event;
    this.pendingNewStage = newStage;
    this.rejectionReasonInput = ''; // Reset input
    this.showRejectionModal = true; 
    return; 
  }

  // 3. If no modal needed, finalize immediately
  this.finalizeDrop(event, newStage);
}

}