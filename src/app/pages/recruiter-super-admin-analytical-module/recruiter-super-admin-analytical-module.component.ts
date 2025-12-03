import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Update the import path below if the component exists elsewhere, or create the file if missing.
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { ThumbnailService } from '../../services/thumbnail.service'; 
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';

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

  // Data
  userList: any[] = [];
  isLoadingUsers: boolean = false;

  // Form & Modal State
  createUserForm: FormGroup;
  showCreateUserPopup: boolean = false;
  isEditMode: boolean = false;
  editingUserId: string | null = null;
  isSubmitting: boolean = false;

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

  constructor(
    private title: Title, 
    private meta: Meta,
    private fb: FormBuilder,
    private http: HttpClient,
    private thumbnailService: ThumbnailService
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
    
    // In Edit Mode: Password is Optional (Only validate if user types something)
    this.createUserForm.get('password')?.clearValidators();
    this.createUserForm.get('confirm_password')?.clearValidators();
    
    // Add a custom validator to check complexity ONLY if value exists
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
      password: '',        // Reset to empty
      confirm_password: '' // Reset to empty
    });

    this.showCreateUserPopup = true;
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
    
    // Clone values
    const formVal = { ...this.createUserForm.value };

    // Clean up empty password in Edit mode so we don't send empty strings
    if (this.isEditMode && !formVal.password) {
      delete formVal.password;
      delete formVal.confirm_password;
    }


    if (this.isEditMode) {
      // UPDATE USER
      this.http.put(`${this.baseUrl}api/super-admin/update/${this.editingUserId}/`, formVal).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMessage = 'User updated successfully.';
          setTimeout(() => {
            this.closeCreateUserPopup();
            this.fetchUsers(); // Refresh list
          }, 1000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Update failed. ' + (err.error?.detail || JSON.stringify(err.error));
        }
      });
    } else {
      // CREATE USER (Using previous endpoint or new one if you migrated creation logic)
      // Assuming you might want to use the same logic, but for clarity using the create-admin endpoint
      const initials = this.thumbnailService.getUserInitials(`${formVal.first_name} ${formVal.last_name}`);
      const userData = { ...formVal, user_type: 'admin', is_staff: true, initials: initials };

      this.http.post(`${this.baseUrl}api/auth/create-admin/`, userData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMessage = 'User created successfully.';
          setTimeout(() => {
            this.closeCreateUserPopup();
            this.fetchUsers();
          }, 1000);
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

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      return this.http.get(`${this.baseUrl}api/auth/check-phone/?phone=${phone}`).pipe(
        map((res: any) => (res.exists ? { phoneExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);
      return this.http.get(`${this.baseUrl}api/auth/check-email/?email=${email}`).pipe(
        map((res: any) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
  
}
