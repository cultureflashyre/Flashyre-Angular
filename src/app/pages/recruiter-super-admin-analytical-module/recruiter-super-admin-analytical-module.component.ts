import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap, distinctUntilChanged, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import Chart from 'chart.js/auto';

import { RecruiterSidebarComponent } from '../../components/recruiter-sidebar/recruiter-sidebar.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThumbnailService } from '../../services/thumbnail.service';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';

import { SuperAdminService } from '../../services/super-admin.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-recruiter-super-admin-analytical-module',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RecruiterSidebarComponent,
    NotificationBellComponent,
    AlertMessageComponent,
  ],
  templateUrl: './recruiter-super-admin-analytical-module.component.html',
  styleUrls: ['./recruiter-super-admin-analytical-module.component.css'],
})
export class RecruiterSuperAdminAnalyticalModuleComponent implements OnInit, AfterViewInit, OnDestroy {
  // Tab State
  activeTab: string = 'reports';
  activityLogs: any[] = [];

  // Data
  userList: any[] = [];
  isLoadingUsers: boolean = false;

  // Form & Modal State
  createUserForm: FormGroup;
  showCreateUserPopup: boolean = false;
  isEditMode: boolean = false;
  editingUserId: string | null = null;
  isSubmitting: boolean = false;

  // --- NEW: CREATION FLOW STATE ---
  creationStep: number = 1; // 1 = Role Selection, 2 = Form
  selectedRole: string = ''; // 'admin', 'recruiter', 'client'
  clientList: any[] = []; // Stores dropdown data

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
  pendingAction: any = null;

  private baseUrl = environment.apiUrl;

  // --- ANALYTICS DATA ---
  kpis = {
    total_candidates: 0,
    total_clients: 0,
    total_requirements: 0,
    total_submissions: 0,
    active_recruiters: 0,
    avg_time_to_fill: 0,
    pipeline: {
      Sourced: 0, Screening: 0, Submission: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0
    },
    sourcing: { top_source: 'N/A', quality_hires: 0, active_sources: 0 }
  };

  reportTableData: any[] = [];

  // --- CHART INSTANCES ---
  private recruiterChart: Chart | null = null;
  private pipelineChart: Chart | null = null;

  // --- PAGINATION FOR DETAILED PERFORMANCE BREAKDOWN ---
  reportCurrentPage: number = 1;
  reportPageSize: number = 10;
  readonly reportPageSizeOptions: number[] = [5, 10, 25, 50];

  get totalReportPages(): number {
    return Math.ceil((this.reportTableData?.length || 0) / this.reportPageSize) || 1;
  }

  get paginatedReportData(): any[] {
    if (!this.reportTableData || this.reportTableData.length === 0) return [];
    const startIndex = (this.reportCurrentPage - 1) * this.reportPageSize;
    return this.reportTableData.slice(startIndex, startIndex + this.reportPageSize);
  }

  get reportShowingFrom(): number {
    if (!this.reportTableData || this.reportTableData.length === 0) return 0;
    return (this.reportCurrentPage - 1) * this.reportPageSize + 1;
  }

  get reportShowingTo(): number {
    if (!this.reportTableData || this.reportTableData.length === 0) return 0;
    return Math.min(this.reportCurrentPage * this.reportPageSize, this.reportTableData.length);
  }

  get reportPageRange(): (number | string)[] {
    return this.generatePageRange(this.reportCurrentPage, this.totalReportPages);
  }

  setReportPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalReportPages) return;
    this.reportCurrentPage = page;
  }

  onReportPageSizeChange() {
    this.reportCurrentPage = 1;
  }

  // --- PAGINATION FOR RECENT ACTIVITY LOGS ---
  logsCurrentPage: number = 1;
  logsPageSize: number = 10;
  readonly logsPageSizeOptions: number[] = [5, 10, 25, 50];

  get totalLogsPages(): number {
    return Math.ceil((this.activityLogs?.length || 0) / this.logsPageSize) || 1;
  }

  get paginatedLogsData(): any[] {
    if (!this.activityLogs || this.activityLogs.length === 0) return [];
    const startIndex = (this.logsCurrentPage - 1) * this.logsPageSize;
    return this.activityLogs.slice(startIndex, startIndex + this.logsPageSize);
  }

  get logsShowingFrom(): number {
    if (!this.activityLogs || this.activityLogs.length === 0) return 0;
    return (this.logsCurrentPage - 1) * this.logsPageSize + 1;
  }

  get logsShowingTo(): number {
    if (!this.activityLogs || this.activityLogs.length === 0) return 0;
    return Math.min(this.logsCurrentPage * this.logsPageSize, this.activityLogs.length);
  }

  get logsPageRange(): (number | string)[] {
    return this.generatePageRange(this.logsCurrentPage, this.totalLogsPages);
  }

  setLogsPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalLogsPages) return;
    this.logsCurrentPage = page;
  }

  onLogsPageSizeChange() {
    this.logsCurrentPage = 1;
  }

  private generatePageRange(current: number, total: number): (number | string)[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    if (current - delta > 2) {
      range.unshift(-1); // rendered as ellipsis '…'
    }
    range.unshift(1);
    if (current + delta < total - 1) {
      range.push(-2); // rendered as ellipsis '…'
    }
    range.push(total);
    return range;
  }

  // --- FILTERS ---
  filters = {
    start_date: '',
    end_date: '',
    recruiter_id: '',
    job_id: '',
    source: ''
  };

  // --- DATE PRESET & FILTER STATE ---
  activeDatePreset: string = '6m';

  // --- PLATFORM SETTINGS STATE ---
  placementCooldownMonths: number = 6;
  initialCooldownMonths: number = 6;
  cooldownUpdatedAt: string = '';
  isSavingSettings: boolean = false;
  isLoadingSettings: boolean = false;
  settingsFeedback: { type: 'success' | 'error'; message: string } | null = null;

  // --- USER MANAGEMENT FILTERING ---
  userSearchQuery: string = '';
  selectedRoleFilter: string = 'all';

  get filteredUsers(): any[] {
    return (this.userList || []).filter(u => {
      const matchesRole = this.selectedRoleFilter === 'all' || u.user_type === this.selectedRoleFilter;
      const query = (this.userSearchQuery || '').toLowerCase().trim();
      if (!query) return matchesRole;
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone_number || '').toLowerCase();
      const client = (u.client_name || '').toLowerCase();
      const matchesSearch = fullName.includes(query) || email.includes(query) || phone.includes(query) || client.includes(query);
      return matchesRole && matchesSearch;
    });
  }

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
    private cdr: ChangeDetectorRef
  ) {
    this.title.setTitle('Super Admin Dashboard - Flashyre');
  }

  ngOnInit() {
    this.initForm();
    this.loadDropdowns();
    this.setDatePreset('6m'); // Set 6-month default period and fetch analytics
    this.fetchClientList(); // Load client names for dropdown
    this.loadPlatformSettings(); // Load placement cooldown
  }

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
    if (tabName === 'users') {
      if (!this.userList || this.userList.length === 0) {
        this.fetchUsers();
      }
    } else if (tabName === 'settings') {
      this.loadPlatformSettings();
    } else if (tabName === 'reports') {
      this.renderCharts();
    }
  }

  setDatePreset(preset: string) {
    this.activeDatePreset = preset;
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.filters.end_date = formatDate(today);

    if (preset === '7d') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      this.filters.start_date = formatDate(past);
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      this.filters.start_date = formatDate(past);
    } else if (preset === '3m') {
      const past = new Date();
      past.setMonth(today.getMonth() - 3);
      this.filters.start_date = formatDate(past);
    } else if (preset === '6m') {
      const past = new Date();
      past.setMonth(today.getMonth() - 6);
      this.filters.start_date = formatDate(past);
    } else if (preset === '1y') {
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      this.filters.start_date = formatDate(past);
    } else if (preset === 'all') {
      this.filters.start_date = '';
      this.filters.end_date = '';
    } else if (preset === 'custom') {
      return;
    }
    this.applyFilter();
  }

  onCustomDateChange() {
    this.activeDatePreset = 'custom';
    this.applyFilter();
  }

  // --- PLATFORM SETTINGS (Placement Cooldown) ---
  loadPlatformSettings() {
    this.isLoadingSettings = true;
    this.superAdminService.getPlatformSettings().subscribe({
      next: (data: any) => {
        this.placementCooldownMonths = data?.placement_cooldown_months ?? 6;
        this.initialCooldownMonths = this.placementCooldownMonths;
        this.cooldownUpdatedAt = data?.updated_at ? new Date(data.updated_at).toLocaleString() : '';
        this.isLoadingSettings = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load platform settings', err);
        this.isLoadingSettings = false;
        this.cdr.detectChanges();
      }
    });
  }

  adjustCooldown(delta: number) {
    const newVal = (Number(this.placementCooldownMonths) || 0) + delta;
    if (newVal >= 1 && newVal <= 60) {
      this.placementCooldownMonths = newVal;
    }
  }

  setCooldownPreset(months: number) {
    this.placementCooldownMonths = months;
  }

  savePlatformSettings() {
    const val = Number(this.placementCooldownMonths);
    if (isNaN(val) || val < 1 || val > 60) {
      this.settingsFeedback = { type: 'error', message: 'Placement cooldown must be between 1 and 60 months.' };
      return;
    }
    this.isSavingSettings = true;
    this.settingsFeedback = null;
    this.superAdminService.updatePlatformSettings(val).subscribe({
      next: (res: any) => {
        this.isSavingSettings = false;
        this.initialCooldownMonths = this.placementCooldownMonths;
        this.cooldownUpdatedAt = res?.updated_at ? new Date(res.updated_at).toLocaleString() : new Date().toLocaleString();
        this.settingsFeedback = {
          type: 'success',
          message: `Placement cooldown successfully saved! Placed candidates cannot be re-approached for ${this.placementCooldownMonths} months.`
        };
        this.cdr.detectChanges();
        setTimeout(() => {
          this.settingsFeedback = null;
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err: any) => {
        this.isSavingSettings = false;
        this.settingsFeedback = {
          type: 'error',
          message: err?.error?.error || 'Failed to save platform settings. Please try again.'
        };
        this.cdr.detectChanges();
      }
    });
  }

  // --- API: Fetch Users ---
  fetchUsers() {
    this.isLoadingUsers = true;
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

  // --- NEW: FETCH CLIENTS FOR DROPDOWN ---
  fetchClientList() {
    this.http.get(`${this.baseUrl}api/super-admin/client-names/`).subscribe({
      next: (data: any) => {
        this.clientList = data;
      },
      error: (err) => console.error('Failed to load clients', err)
    });
  }

  // --- POPUP LOGIC ---
  openCreateUserPopup() {
    this.isEditMode = false;
    this.editingUserId = null;
    this.createUserForm.reset();

    // Reset to Step 1
    this.creationStep = 1;
    this.selectedRole = ''; // Clear selection

    this.showCreateUserPopup = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // --- NEW: HANDLE ROLE SELECTION ---
  selectRole(role: string) {
    this.selectedRole = role;
    this.creationStep = 2; // Move to Form

    // Set user_type in form
    this.createUserForm.patchValue({ user_type: role });

    // Conditional Validation for Client Name
    if (role === 'client') {
      this.createUserForm.get('client_name')?.setValidators([Validators.required]);
    } else {
      this.createUserForm.get('client_name')?.clearValidators();
      this.createUserForm.get('client_name')?.setValue(null);
    }
    this.createUserForm.get('client_name')?.updateValueAndValidity();

    // Set Password Validators for creation
    this.createUserForm.get('password')?.setValidators([Validators.required, this.passwordComplexityValidator(), Validators.minLength(8)]);
    this.createUserForm.get('confirm_password')?.setValidators([Validators.required]);
  }

  openEditUserPopup(user: any) {
    this.isEditMode = true;
    this.editingUserId = user.user_id;
    this.creationStep = 2; // Jump directly to form
    this.selectedRole = user.user_type; // Capture existing role to show conditional fields

    this.originalEmail = user.email;
    this.originalPhone = user.phone_number;

    this.createUserForm.get('password')?.clearValidators();
    this.createUserForm.get('confirm_password')?.clearValidators();
    this.createUserForm.get('password')?.setValidators([this.optionalPasswordComplexityValidator()]);

    // Clear client validators initially
    this.createUserForm.get('client_name')?.clearValidators();

    // If editing a client, make client_name required
    // --- LOGIC UPDATE: Handle Client Type specifically ---
    if (user.user_type === 'client') {
      this.createUserForm.get('client_name')?.setValidators([Validators.required]);
      // Ensure the control is enabled
      this.createUserForm.get('client_name')?.enable();
    } else {
      // If not a client, usually we don't need this field, so we can disable or nullify it
      this.createUserForm.get('client_name')?.setValue(null);
    }

    this.createUserForm.get('password')?.updateValueAndValidity();
    this.createUserForm.get('confirm_password')?.updateValueAndValidity();
    this.createUserForm.get('client_name')?.updateValueAndValidity();

    this.createUserForm.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      email: user.email,
      is_superuser: user.is_superuser,
      user_type: user.user_type,
      client_name: user.client_name,
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

      // New Fields
      user_type: ['admin', Validators.required], // Default, but overridden by selectRole
      client_name: [''],

      is_superuser: [false],
      password: ['', [Validators.required, this.passwordComplexityValidator(), Validators.minLength(8), Validators.maxLength(15)]],
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

    const formVal = { ...this.createUserForm.value };

    if (this.isEditMode) {
      // EDIT MODE
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
      // CREATE MODE
      const initials = this.thumbnailService.getUserInitials(`${formVal.first_name} ${formVal.last_name}`);

      // *** FIX: Explicitly enforce user_type from selection ***
      const userData = {
        ...formVal,
        user_type: this.selectedRole, // Ensure this overrides any form default
        initials: initials
      };

      this.http.post(`${this.baseUrl}api/super-admin/create-system-user/`, userData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMessage = `${this.selectedRole} created successfully.`;
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

  goBackToStep1() {
    if (!this.isEditMode) {
      this.creationStep = 1;
      this.createUserForm.reset();
      this.selectedRole = '';
    }
  }

  // ... (Keep existing confirmDeleteUser, copyToClipboard, etc. methods exactly as they were) ...
  confirmDeleteUser(user: any) {
    this.pendingAction = { type: 'delete', user: user };
    this.alertMessage = `Are you sure you want to delete ${user.first_name} ${user.last_name}?`;
    this.alertButtons = ['Cancel', 'Delete'];
    this.showAlert = true;
  }

  onAlertAction(btn: string) {
    const buttonText = btn.toLowerCase();
    if (buttonText === 'cancel' || buttonText === 'ok') {
      this.onAlertClose();
      return;
    }
    if (this.pendingAction && this.pendingAction.type === 'delete' && buttonText === 'delete') {
      this.executeDelete(this.pendingAction.user.user_id);
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
        alert("Failed to delete user.");
        this.onAlertClose();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  copyUserData(user: any) {
    const info = `
    Name: ${user.first_name} ${user.last_name}
    User ID: ${user.user_id}
    Email: ${user.email}
    Phone: ${user.phone_number}
    Role: ${user.user_type}
    `.trim();
    this.copyToClipboard(info);
    this.alertMessage = "User details copied!";
    this.alertButtons = ['OK'];
    this.showAlert = true;
  }

  // --- VALIDATORS & HELPERS ---
  optionalPasswordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
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
    return form.get('password')?.value === form.get('confirm_password')?.value ? null : { mismatch: true };
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

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      if (this.isEditMode && phone === this.originalPhone) return of(null);
      return timer(500).pipe(
        switchMap(() => this.http.get(`${this.baseUrl}api/auth/check-phone/?phone=${phone}`).pipe(
          map((res: any) => (res.exists ? { phoneExists: true } : null)),
          catchError(() => of(null))
        )),
        take(1)
      );
    };
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);
      if (this.isEditMode && email === this.originalEmail) return of(null);
      return timer(500).pipe(
        switchMap(() => this.http.get(`${this.baseUrl}api/auth/check-email/?email=${email}`).pipe(
          map((res: any) => (res.exists ? { emailExists: true } : null)),
          catchError(() => of(null))
        )),
        take(1)
      );
    };
  }

  loadDropdowns() {
    this.reqService.getRequirements().subscribe((data: any) => {
      this.jobsList = data.results || data;
    });
    this.http.get(`${this.baseUrl}api/super-admin/list/`).subscribe((data: any) => {
      this.recruitersList = (data || []).filter((u: any) => u.user_type === 'recruiter');
    });
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  ngOnDestroy() {
    if (this.recruiterChart) {
      this.recruiterChart.destroy();
      this.recruiterChart = null;
    }
    if (this.pipelineChart) {
      this.pipelineChart.destroy();
      this.pipelineChart = null;
    }
  }

  fetchAnalytics() {
    this.superAdminService.getAnalytics(this.filters).subscribe({
      next: (data: any) => {
        this.kpis = data.kpis;
        this.reportTableData = data.table_data;
        this.activityLogs = data.logs || [];
        this.reportCurrentPage = 1;
        this.logsCurrentPage = 1;
        this.cdr.detectChanges(); // Force UI update
        this.renderCharts();
      },
      error: (err) => console.error("Failed to load analytics", err)
    });
  }

  renderCharts() {
    if (this.activeTab !== 'reports') return;
    setTimeout(() => {
      this.renderRecruiterPerformanceChart();
      this.renderPipelineDistributionChart();
    }, 50);
  }

  private renderRecruiterPerformanceChart() {
    const canvas = document.getElementById('recruiterPerformanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.recruiterChart) {
      this.recruiterChart.destroy();
      this.recruiterChart = null;
    }

    // Aggregate metrics per recruiter from reportTableData
    const recruiterMap = new Map<string, { submissions: number; interviews: number; hired: number }>();

    (this.reportTableData || []).forEach((row: any) => {
      const name = row.recruiter_name ? row.recruiter_name.trim() : 'Unassigned';
      const existing = recruiterMap.get(name) || { submissions: 0, interviews: 0, hired: 0 };
      existing.submissions += Number(row.submissions) || 0;
      existing.interviews += Number(row.interviews) || 0;
      existing.hired += Number(row.hired) || 0;
      recruiterMap.set(name, existing);
    });

    // If reportTableData has no recruiter records, populate with active recruiter names if available
    if (recruiterMap.size === 0 && this.recruitersList && this.recruitersList.length > 0) {
      this.recruitersList.slice(0, 5).forEach((rec: any) => {
        recruiterMap.set(`${rec.first_name || ''} ${rec.last_name || ''}`.trim() || 'Recruiter', {
          submissions: 0,
          interviews: 0,
          hired: 0
        });
      });
    }

    // Sort by total volume and take top 6
    const sorted = Array.from(recruiterMap.entries())
      .sort((a, b) => (b[1].submissions + b[1].interviews + b[1].hired) - (a[1].submissions + a[1].interviews + a[1].hired))
      .slice(0, 6);

    const labels = sorted.map(([name]) => name);
    const submissions = sorted.map(([_, s]) => s.submissions);
    const interviews = sorted.map(([_, s]) => s.interviews);
    const hired = sorted.map(([_, s]) => s.hired);

    const hasData = labels.length > 0;

    this.recruiterChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: hasData ? labels : ['No Activity Recorded'],
        datasets: [
          {
            label: 'Submissions',
            data: hasData ? submissions : [0],
            backgroundColor: '#2563eb',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Interviews',
            data: hasData ? interviews : [0],
            backgroundColor: '#d97706',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Hired',
            data: hasData ? hired : [0],
            backgroundColor: '#059669',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#475569',
              font: { family: "'Outfit', system-ui, sans-serif", size: 12, weight: 500 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'Outfit', system-ui, sans-serif", size: 13, weight: 600 },
            bodyFont: { family: "'Outfit', system-ui, sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'Outfit', system-ui, sans-serif", size: 11 },
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              precision: 0,
              font: { family: "'Outfit', system-ui, sans-serif", size: 11 },
              color: '#64748b'
            }
          }
        }
      }
    });
  }

  private renderPipelineDistributionChart() {
    const canvas = document.getElementById('pipelineDistributionChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.pipelineChart) {
      this.pipelineChart.destroy();
      this.pipelineChart = null;
    }

    const pipe = this.kpis.pipeline || { Sourced: 0, Screening: 0, Submission: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0 };
    const labels = ['Sourced', 'Screening', 'Submission', 'Interview', 'Offer', 'Hired', 'Rejected'];
    const dataValues = [
      Number(pipe.Sourced) || 0,
      Number(pipe.Screening) || 0,
      Number(pipe.Submission) || 0,
      Number(pipe.Interview) || 0,
      Number(pipe.Offer) || 0,
      Number(pipe.Hired) || 0,
      Number(pipe.Rejected) || 0
    ];

    const totalCount = dataValues.reduce((a, b) => a + b, 0);
    const colors = [
      '#3b82f6', // Sourced
      '#8b5cf6', // Screening
      '#06b6d4', // Submission
      '#f59e0b', // Interview
      '#10b981', // Offer
      '#059669', // Hired
      '#ef4444'  // Rejected
    ];

    this.pipelineChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: totalCount > 0 ? dataValues : [1],
          backgroundColor: totalCount > 0 ? colors : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#475569',
              font: { family: "'Outfit', system-ui, sans-serif", size: 11 },
              padding: 10,
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const val = dataValues[i] || 0;
                    const pct = totalCount > 0 ? Math.round((val / totalCount) * 100) : 0;
                    return {
                      text: `${label}: ${val} (${pct}%)`,
                      fillStyle: colors[i],
                      strokeStyle: '#ffffff',
                      lineWidth: 1,
                      hidden: false,
                      index: i,
                      pointStyle: 'circle'
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'Outfit', system-ui, sans-serif", size: 13, weight: 600 },
            bodyFont: { family: "'Outfit', system-ui, sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                if (totalCount === 0) return ' No active candidates';
                const val = context.raw as number;
                const pct = ((val / totalCount) * 100).toFixed(1);
                return ` ${context.label}: ${val} candidates (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  applyFilter() { this.fetchAnalytics(); }

  downloadLogs() {
    if (this.activityLogs.length === 0) { alert("No activity logs to export"); return; }
    const exportData = this.activityLogs.map(log => ({
      'Date': log.date, 'Time': log.time, 'User': log.user_name,
      'Module': log.module, 'Action Type': log.action_type,
      'Activity Description': log.action_description, 'Details': log.details
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Activity Logs': worksheet }, SheetNames: ['Activity Logs'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, `Activity_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  downloadReport() {
    if (this.reportTableData.length === 0) { alert("No data to export"); return; }
    const exportData = this.reportTableData.map(row => ({
      'Recruiter': row.recruiter_name, 'Client': row.client, 'Job Role': row.job_title,
      'Created At': row.created_at, 'Location': row.location, 'Source': row.data_source,
      'Total Applications': row.submissions, 'Screening': row.screening, 'Interviews': row.interviews,
      'Hired': row.hired, 'Rejected': row.rejected, 'Rejection Reasons': row.rejection_reasons, 'Status': row.status
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Report': worksheet }, SheetNames: ['Report'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, `Performance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
