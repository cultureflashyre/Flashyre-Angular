import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap, distinctUntilChanged, take  } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Update the import path below if the component exists elsewhere, or create the file if missing.
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { ThumbnailService } from '../../services/thumbnail.service'; 
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';

import { SuperAdminService } from '../../services/super-admin.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { AdbRequirementService as UserService } from '../../services/adb-requirement.service'; // Reusing service to get users if needed, or inject generic user service
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-recruiter-super-admin-analytical-module',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RecruiterWorkflowNavbarComponent,
    AlertMessageComponent,
  ],
  templateUrl: './recruiter-super-admin-analytical-module.component.html',
  styleUrls: ['./recruiter-super-admin-analytical-module.component.css'],
})
export class RecruiterSuperAdminAnalyticalModuleComponent {
  // Tab State
  activeTab: string = 'reports'; // Default to reports
  activityLogs: any[] = []; // New property for logs

  // Data
  userList: any[] = [];
  isLoadingUsers: boolean = false;

  // Form & Modal State
  createUserForm: FormGroup;
  showCreateUserPopup: boolean = false;
  isEditMode: boolean = false;
  editingUserId: string | null = null;
  isSubmitting: boolean = false;

  // Track original values for validation bypass in Edit Mode
  originalEmail: string = '';
  originalPhone: string = '';

  // Form Properties
  errorMessage: string = '';
  successMessage: string = '';
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';
  
  // Alert State
  showAlert: boolean = false;
  alertMessage: string = '';
  alertButtons: string[] = [];
  pendingAction: any = null; // Stores data about the action waiting for confirmation

  private baseUrl = environment.apiUrl;

  // --- ANALYTICS DATA ---
  kpis = {
    // New KPIs
    total_candidates: 0,
    total_clients: 0,
    total_requirements: 0,
    
    // Existing KPIs
    total_submissions: 0,
    active_recruiters: 0,
    avg_time_to_fill: 0,
    
    // Expanded Pipeline (7 stages)
    pipeline: { 
      Sourced: 0, 
      Screening: 0, 
      Submission: 0, 
      Interview: 0, 
      Offer: 0, 
      Hired: 0, 
      Rejected: 0 
    },
    
    sourcing: { top_source: 'N/A', quality_hires: 0, active_sources: 0 }
  };

  reportTableData: any[] = [];

  // --- FILTERS ---
  filters = {
    start_date: '',
    end_date: '',
    recruiter_id: '',
    job_id: '',
    source: '' // New Filter
  };

  // Dropdown Lists
  recruitersList: any[] = [];
  jobsList: any[] = [];

  constructor(
    private title: Title, 
    private meta: Meta,
    private fb: FormBuilder,
    private http: HttpClient,
    private thumbnailService: ThumbnailService,
    private superAdminService: SuperAdminService,
    private reqService: AdbRequirementService,

  ) {
    this.title.setTitle('Super Admin Dashboard - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-Super-Admin-Analytical-module - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit() {
    this.initForm();
    this.loadDropdowns();
    this.fetchAnalytics(); // Load initial data
  }

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
    if (tabName === 'users') {
      this.fetchUsers();
    }
  }

  // --- API: Fetch Users ---
  fetchUsers() {
    this.isLoadingUsers = true;
    // Calling the new backend app view
    this.http.get(`${this.baseUrl}api/super-admin/list/`).subscribe({
      next: (data: any) => {
        this.userList = data;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.isLoadingUsers = false;
      }
    });
  }

  

  // --- POPUP LOGIC ---
  openCreateUserPopup() {
    this.isEditMode = false;
    this.editingUserId = null;
    this.createUserForm.reset();

    this.createUserForm.get('password')?.setValidators([Validators.required, this.passwordComplexityValidator(), Validators.minLength(8)]);
    this.createUserForm.get('confirm_password')?.setValidators([Validators.required]);
    this.showCreateUserPopup = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openEditUserPopup(user: any) {
    this.isEditMode = true;
    this.editingUserId = user.user_id;
    
    // Store original values to skip validation if they haven't changed
    this.originalEmail = user.email;
    this.originalPhone = user.phone_number;

    // Remove required validators for Password in Edit Mode
    this.createUserForm.get('password')?.clearValidators();
    this.createUserForm.get('confirm_password')?.clearValidators();
    
    // Add optional complexity validator (only checks if user types something)
    this.createUserForm.get('password')?.setValidators([this.optionalPasswordComplexityValidator()]);
    
    this.createUserForm.get('password')?.updateValueAndValidity();
    this.createUserForm.get('confirm_password')?.updateValueAndValidity();

    // Populate form
    this.createUserForm.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      email: user.email,
      is_superuser: user.is_superuser,
      password: '',        
      confirm_password: '' 
    });

    this.showCreateUserPopup = true;
    this.errorMessage = '';
    this.successMessage = '';
  }


  closeCreateUserPopup() {
    this.showCreateUserPopup = false;
  }

  initForm() {
    this.createUserForm = this.fb.group({
      first_name: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z ]+$/), 
        Validators.minLength(3),
        Validators.maxLength(10)
      ]],
      last_name: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z ]+$/), 
        Validators.minLength(3),
        Validators.maxLength(10)
      ]],
      phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
      email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
      // New specific field for Super Admin context
      is_superuser: [false], 
      password: ['', [
        Validators.required, 
        this.passwordComplexityValidator(), 
        Validators.minLength(8),
        Validators.maxLength(15)
      ]],
      confirm_password: ['', [Validators.required]],
    }, { validator: this.passwordMatchValidator });
  }

  onSubmit() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Clone values to manipulate payload
    const formVal = { ...this.createUserForm.value };

    if (this.isEditMode) {
      // 1. EDIT USER LOGIC
      
      // If password field is empty, remove it from payload so backend doesn't receive empty string
      if (!formVal.password) {
        delete formVal.password;
        delete formVal.confirm_password;
      }

      this.http.put(`${this.baseUrl}api/super-admin/update/${this.editingUserId}/`, formVal).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMessage = 'User updated successfully.';
          setTimeout(() => {
            this.closeCreateUserPopup();
            this.fetchUsers(); 
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Update failed: ' + (err.error?.detail || err.error?.error || 'Unknown error');
        }
      });

    } else {
      // 2. CREATE USER LOGIC
      const initials = this.thumbnailService.getUserInitials(`${formVal.first_name} ${formVal.last_name}`);
      const userData = { ...formVal, user_type: 'admin', is_staff: true, initials: initials };

      this.http.post(`${this.baseUrl}api/auth/create-admin/`, userData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMessage = 'User created successfully.';
          setTimeout(() => {
            this.closeCreateUserPopup();
            this.fetchUsers();
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.error || 'Creation failed.';
        }
      });
    }
  }

  // --- ACTION: DELETE ---
  confirmDeleteUser(user: any) {
    this.pendingAction = { type: 'delete', user: user };
    this.alertMessage = `Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`;
    this.alertButtons = ['Cancel', 'Delete'];
    this.showAlert = true;
  }

  // --- ACTION: RESET PASSWORD ---
  confirmResetPassword(user: any) {
    this.pendingAction = { type: 'reset_pwd', user: user };
    this.alertMessage = `Are you sure you want to reset the password for ${user.email}? A temporary password 'Flashyre@123' will be set.`;
    this.alertButtons = ['Cancel', 'Yes'];
    this.showAlert = true;
  }

  // --- ALERT HANDLER ---
  onAlertAction(btn: string) {
    const buttonText = btn.toLowerCase();

    // 1. Handle "Cancel" and "OK" (Just close the popup)
    if (buttonText === 'cancel' || buttonText === 'ok') {
      this.onAlertClose();
      return;
    }

    // 2. Handle Action-Specific Buttons (Delete / Yes)
    if (this.pendingAction) {
      if (this.pendingAction.type === 'delete' && buttonText === 'delete') {
        this.executeDelete(this.pendingAction.user.user_id);
      } else if (this.pendingAction.type === 'reset_pwd' && buttonText === 'yes') {
        this.executeResetPassword(this.pendingAction.user.user_id);
      }
    }
  }

  onAlertClose() {
    this.showAlert = false;
    this.pendingAction = null;
  }

  executeDelete(userId: string) {
    this.http.delete(`${this.baseUrl}api/super-admin/delete/${userId}/`).subscribe({
      next: () => {
        this.onAlertClose();
        this.fetchUsers();
      },
      error: (err) => {
        alert("Failed to delete user: " + (err.error?.error || "Unknown error"));
        this.onAlertClose();
      }
    });
  }

  executeResetPassword(userId: string) {
    // Setting a default temporary password
    const newPassword = "Flashyre@123"; 
    this.http.post(`${this.baseUrl}api/super-admin/reset-password/${userId}/`, { new_password: newPassword }).subscribe({
      next: () => {
        this.onAlertClose();
        alert(`Password reset successfully. New Password: ${newPassword}`);
      },
      error: (err) => {
        alert("Failed to reset password.");
        this.onAlertClose();
      }
    });
  }

  // --- COPY FUNCTIONALITY ---
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Show a small toast notification
    });
  }

// --- COPY FUNCTIONALITY ---
  copyUserData(user: any) {
    const info = `
    Name: ${user.first_name} ${user.last_name}
    User ID: ${user.user_id}
    Email: ${user.email}
    Phone: ${user.phone_number}
    Role: ${user.user_type}
    Is Super Admin: ${user.is_superuser ? 'Yes' : 'No'}
    Status: ${user.is_active ? 'Active' : 'Inactive'}
    Password: ${user.password || 'N/A'}
    `.trim();
    
    this.copyToClipboard(info);

    // Use Custom Alert Component instead of browser alert
    this.alertMessage = "User details copied to clipboard!";
    this.alertButtons = ['OK']; // Simple acknowledgement button
    this.pendingAction = null;  // No backend action tied to this
    this.showAlert = true;
  }

  // ----------------------------------------------------------------------
  // Validators & Helpers (Ported from Signup)
  // ----------------------------------------------------------------------

  // --- UPDATED VALIDATOR FOR EDIT MODE ---
  optionalPasswordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      // If empty, it's valid (in edit mode)
      if (!value) return null;
      
      // If not empty, must meet complexity
      if (value.length < 8) return { minlength: true };
      if (!/[A-Z]/.test(value)) return { uppercase: true };
      if (!/[0-9]/.test(value)) return { number: true };
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return { specialChar: true };
      return null;
    };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createUserForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  sanitizePhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);
    this.createUserForm.get('phone_number')?.setValue(sanitizedValue, { emitEvent: false });
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirm_password')?.value
      ? null
      : { mismatch: true };
  }

  passwordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';
      if (!value) return null;
      const errors: ValidationErrors = {};
      if (value.length < 8) errors['minlength'] = true;
      if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
      if (!/[a-z]/.test(value)) errors['lowercase'] = true;
      if (!/[0-9]/.test(value)) errors['number'] = true;
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors['specialChar'] = true;
      return Object.keys(errors).length ? errors : null;
    };
  }

  // =================================================================
  // VALIDATORS (UPDATED FOR EDIT MODE)
  // =================================================================

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      
      // If empty, let Sync validators handle it
      if (!phone) return of(null);

      // EDIT MODE CHECK: If value hasn't changed, strictly return VALID (null)
      // This prevents the API call and the error message.
      if (this.isEditMode && phone === this.originalPhone) {
        return of(null);
      }

      // Add a timer for debounce to avoid calling API on every keystroke
      return timer(500).pipe(
        switchMap(() => {
          return this.http.get(`${this.baseUrl}api/auth/check-phone/?phone=${phone}`).pipe(
            map((res: any) => (res.exists ? { phoneExists: true } : null)),
            catchError(() => of(null))
          );
        }),
        take(1)
      );
    };
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      
      if (!email) return of(null);

      // EDIT MODE CHECK: If value hasn't changed, strictly return VALID (null)
      if (this.isEditMode && email === this.originalEmail) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => {
          return this.http.get(`${this.baseUrl}api/auth/check-email/?email=${email}`).pipe(
            map((res: any) => (res.exists ? { emailExists: true } : null)),
            catchError(() => of(null))
          );
        }),
        take(1)
      );
    };
  }

  loadDropdowns() {
    // 1. Get Jobs
    this.reqService.getRequirements().subscribe(data => this.jobsList = data);
    
    // 2. Get Recruiters (Reusing the user list endpoint from User Management tab)
    // Assuming fetchUsers logic populates userList or we call API directly
    this.http.get(`${this.baseUrl}api/super-admin/list/`).subscribe((data: any) => {
      this.recruitersList = data; // Filter for recruiters only if needed
    });
  }

  fetchAnalytics() {
    this.superAdminService.getAnalytics(this.filters).subscribe({
      next: (data: any) => {
        this.kpis = data.kpis;
        this.reportTableData = data.table_data;
        this.activityLogs = data.logs || []; // Map logs
      },
      error: (err) => console.error("Failed to load analytics", err)
    });
  }

  applyFilter() {
    this.fetchAnalytics();
  }

  clearFilters() {
    this.filters = { start_date: '', end_date: '', recruiter_id: '', job_id: '', source: '' };
    this.fetchAnalytics();
  }

  // --- NEW: DOWNLOAD LOGS FUNCTION ---
  downloadLogs() {
    if (this.activityLogs.length === 0) {
      alert("No activity logs to export");
      return;
    }

    // Map data to clean Excel format
    const exportData = this.activityLogs.map(log => ({
      'Date': log.date,
      'Time': log.time,
      'User': log.user_name,
      'Module': log.module,
      'Action Type': log.action_type,
      'Activity Description': log.action_description,
      'Details': log.details
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const wscols = [
      {wch: 12}, {wch: 10}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 40}, {wch: 30}
    ];
    worksheet['!cols'] = wscols;

    const workbook: XLSX.WorkBook = { Sheets: { 'Activity Logs': worksheet }, SheetNames: ['Activity Logs'] };
    
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const dateStr = new Date().toISOString().slice(0, 10);
    FileSaver.saveAs(data, `Activity_Logs_${dateStr}.xlsx`);
  }

  // --- EXPORT TO EXCEL ---
  // --- EXPORT TO EXCEL (UPDATED) ---
  downloadReport() {
    if (this.reportTableData.length === 0) {
      alert("No data to export");
      return;
    }

    // 1. Map raw backend data to clean Excel columns in the desired order
    // Order requested: Screening beside Submission, Rejected beside Hired
    const exportData = this.reportTableData.map(row => ({
      'Recruiter': row.recruiter_name,
      'Client': row.client,
      'Job Role': row.job_title,
      'Created At': row.created_at,
      'Location': row.location,
      'Source': row.data_source,
      
      // Metrics Ordering
      'Total Applications': row.submissions, // Renamed from Submissions for clarity
      'Screening': row.screening,            // New Column
      'Interviews': row.interviews,
      
      'Hired': row.hired,
      'Rejected': row.rejected,              // New Column beside Hired
      'Rejection Reasons': row.rejection_reasons, // New Column
      
      'Status': row.status
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    
    // Optional: Set column widths for better readability
    const wscols = [
      {wch: 20}, {wch: 20}, {wch: 25}, {wch: 12}, {wch: 15}, {wch: 15},
      {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 40}, {wch: 10} 
    ];
    worksheet['!cols'] = wscols;

    const workbook: XLSX.WorkBook = { Sheets: { 'Report': worksheet }, SheetNames: ['Report'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Create filename with date
    const dateStr = new Date().toISOString().slice(0, 10);
    FileSaver.saveAs(data, `Performance_Report_${dateStr}.xlsx`);
  }

  
}
