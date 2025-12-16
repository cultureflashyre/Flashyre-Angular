import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router, RouterLink } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
import { UserProfileService } from '../../services/user-profile.service';
import { ThumbnailService } from '../../services/thumbnail.service'; // Import thumbnail service
import { Console } from 'console';
import { AuthService } from '../../services/candidate.service'; // Renamed to avoid conflict
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { SocialAuthService, GoogleLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { CommonModule, NgClass } from '@angular/common';

import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { AlertMessageComponent } from '../alert-message/alert-message.component';

@Component({
    selector: 'signup-candidate1',
    templateUrl: './signup-candidate1.component.html',
    styleUrls: ['./signup-candidate1.component.css'],
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        RouterLink, AlertMessageComponent,
        GoogleSigninButtonModule, CommonModule,
    ],
})
export class SignupCandidate1 implements OnInit {

  private baseUrl = environment.apiUrl;

  // Content projection properties
  @Input() rootClassName: string = '';
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text21') text21: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;

  // Reactive form properties
  signupForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';

  // A NEW, SEPARATE FORM for the Google popup
  phonePopupForm: FormGroup;

     // --- NEW STATE VARIABLES FOR GOOGLE SIGNUP ---
  showPhonePopup: boolean = false;
  isSubmittingPhone: boolean = false;
  popupErrorMessage: string = '';
  googleUserData: { email: string, first_name: string, last_name: string } | null = null;

  userType: 'candidate' | 'recruiter' | 'admin' | null = null;
  showRoleSelection = true; // Show overlay by default

  showRoleMismatchAlert = false;
  roleMismatchMessage = '';
  roleMismatchButtons: string[] = [];
  private mismatchLoginData: any = null; // To store login data from the backend

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private spinner: NgxSpinnerService,
    private userProfileService: UserProfileService,
    private thumbnailService: ThumbnailService, // Inject ThumbnailService here
    private candidateAuthService: AuthService, // Aliased to avoid conflict
    private corporateAuthService: CorporateAuthService,
    private socialAuthService: SocialAuthService
  ) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        first_name: ['', [Validators.required, 
          Validators.pattern(/^[a-zA-Z ]+$/), 
          Validators.minLength(3),
          Validators.maxLength(10),
        ]],
        last_name: ['', [Validators.required, 
          Validators.pattern(/^[a-zA-Z ]+$/), 
          Validators.minLength(3),
          Validators.maxLength(10),
      ]],
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
        email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
        password: ['', [Validators.required, 
          this.passwordComplexityValidator(), 
          Validators.minLength(8),
          Validators.maxLength(15)
        ]],
        confirm_password: ['', [Validators.required]],
      // --- NEW FORM CONTROLS ---
        //user_type_radio: ['candidate', Validators.required], // For the radio buttons       
    },
      { validator: this.passwordMatchValidator }
    );

    // Initialize the new, independent form for the popup
    this.phonePopupForm = this.fb.group({
      popup_phone_number: ['',
        [Validators.required, Validators.pattern(/^\d{10}$/)],
        [this.phoneExistsValidator()] // Also validate if the phone exists here
      ]
    });

    // --- DIAGNOSTIC LOG ---
    // Log the form's status and value changes in real-time.
    // This is the MOST IMPORTANT log for diagnosing a disabled button.
    this.signupForm.valueChanges.subscribe(() => {
        console.log('--- Form State Changed ---');
        console.log(`Form Valid: ${this.signupForm.valid}`);
        console.log(`Form Status: ${this.signupForm.status}`); // Will show VALID, INVALID, or PENDING

        // Log errors for each control individually to pinpoint the issue
        Object.keys(this.signupForm.controls).forEach(key => {
            const control = this.signupForm.get(key);
            if (control && control.invalid) {
                console.log(`Control '${key}' is INVALID. Errors:`, control.errors);
            }
        });

        // Check for form-level validator errors (like password mismatch)
        if (this.signupForm.errors) {
            console.log('Form-level errors:', this.signupForm.errors);
        }
        console.log('--------------------------');
    });


            // --- ADDED: Google Sign-Up Subscription Logic ---
    // This is the new, correct way to handle Google Sign-Up.
    // It listens for a successful authentication from the <asl-google-signin-button>
    // in your HTML and then executes the multi-step signup logic.
    this.socialAuthService.authState.subscribe((socialUser: SocialUser) => {
      this.errorMessage = ''; // Clear previous errors
      if (!this.userType) {
        this.errorMessage = 'Please select a user type before signing up with Google.';
        this.changeUserType(); // Re-open the role selector
        return;
      }

      const idToken = socialUser.idToken;
      const selectedUserType = this.userType;

      const authObservable = selectedUserType === 'recruiter'
        ? this.corporateAuthService.googleAuthCheck(idToken, selectedUserType)
        : this.candidateAuthService.googleAuthCheck(idToken, selectedUserType);

      this.spinner.show();
      authObservable.subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status === 'LOGIN_SUCCESS') {
            // User already exists, handle as a successful login.
            this.handleSuccessfulAuth(response);
          } else if (response.status === 'INCOMPLETE_SIGNUP') {
            // New user, show the popup to collect their phone number.
            this.googleUserData = {
              email: response.email,
              first_name: response.first_name,
              last_name: response.last_name
            };
            this.showPhonePopup = true;
          }
          // --- NEW LOGIC to handle Role Mismatch ---
          else if (response.status === 'ROLE_MISMATCH') {
            // Store the login data in case the user wants to continue
            this.mismatchLoginData = response;

            // Prepare and show the alert
            const role = response.existing_role.charAt(0).toUpperCase() + response.existing_role.slice(1);
            this.roleMismatchMessage = `You have already signed up as ${role} using this email: ${response.email}`;
            this.roleMismatchButtons = [`Continue as ${role}`, 'Back to Signup'];
            this.showRoleMismatchAlert = true;
          }          
        },
        error: (err) => {
          this.spinner.hide();
          this.errorMessage = err.error?.error || 'An error occurred. Please try again.';
        }
      });
    });

  }

    // --- NEW METHOD to handle alert button clicks ---
  handleMismatchAlertAction(button: string): void {
    this.showRoleMismatchAlert = false; // Hide the alert

    if (button.startsWith('Continue as')) {
      // If user wants to continue, log them in using the stored data
      this.handleSuccessfulAuth(this.mismatchLoginData);
    }
    // If "Back to Signup" is clicked, we just hide the alert and do nothing else.
    this.mismatchLoginData = null; // Clear the stored data
  }

  // --- NEW METHOD to handle closing the alert via 'x' icon ---
  closeMismatchAlert(): void {
    this.showRoleMismatchAlert = false;
    this.mismatchLoginData = null;
  }

  selectUserType(type: 'candidate' | 'recruiter' | 'admin'): void {
    this.userType = type;
    this.showRoleSelection = false;

    console.log(`User role selected: ${this.userType}. The signup form should now be visible.`);
  }

  changeUserType(): void {
    this.showRoleSelection = true;
  }

  cancelRoleSelection(): void {
    this.router.navigate(['/login']);
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password').value === form.get('confirm_password').value
      ? null
      : { mismatch: true };
  }

  passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';

    if (!value) {
      return null; // Let required validator handle empty case
    }

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors.minlength = { requiredLength: 8, actualLength: value.length };
    }
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }
    if (!/[a-z]/.test(value)) {
      errors.lowercase = true;
    }
    if (!/[0-9]/.test(value)) {
      errors.number = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.specialChar = true;
    }
    // At least one alphabet is covered by uppercase or lowercase, but if you want to explicitly check:
    if (!/[a-zA-Z]/.test(value)) {
      errors.alphabet = true;
    }

    return Object.keys(errors).length ? errors : null;
  };
}

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  onPhoneSubmit(): void {
    // Check the validity of the NEW form
    if (this.phonePopupForm.invalid) {
      return;
    }

    this.isSubmittingPhone = true;
    this.popupErrorMessage = '';
    const selectedUserType = this.userType;

    const finalUserData = {
      ...this.googleUserData,
      phone_number: this.phonePopupForm.get('popup_phone_number').value,
      initials: this.thumbnailService.getUserInitials(`${this.googleUserData.first_name} ${this.googleUserData.last_name}`)
    };

    const signupObservable = selectedUserType === 'recruiter'
      ? this.corporateAuthService.completeGoogleSignup(finalUserData)
      : this.candidateAuthService.completeGoogleSignup(finalUserData);

    signupObservable.subscribe({
      next: (response) => {
        this.isSubmittingPhone = false;
        this.showPhonePopup = false;
        this.handleSuccessfulAuth(response);
      },
      error: (err) => {
        this.isSubmittingPhone = false;
        this.popupErrorMessage = err.error?.error || 'Signup failed. Please check the phone number and try again.';
      }
    });
  }
  // --- REFACTORED SUCCESS HANDLER ---
  private handleSuccessfulAuth(response: any): void {
    console.log('Authentication successful', response);
    this.errorMessage = '';
    this.successMessage = response.message || 'Successfully Signed up';

    localStorage.setItem('jwtToken', response.access);
    localStorage.setItem('refreshToken', response.refresh);
    localStorage.setItem('user_id', response.user_id);
    localStorage.setItem('userType', response.role);

    this.userProfileService.fetchUserProfile().subscribe({
      next: () => {
        this.router.navigate(['/profile-overview-page'], { state: { source: response.role } });
      },
      error: (profileError) => {
        console.error('Error fetching profile', profileError);
        this.router.navigate(['/profile-overview-page'], { state: { source: response.role } });
      }
    });
  }

  cancelGoogleSignup(): void {
    this.showPhonePopup = false;
    this.googleUserData = null;
    this.phonePopupForm.reset();
  }

  sanitizePhoneNumber(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);

    // Get the correct form control by name and update its value
    // *** UPDATED LOGIC TO HANDLE TWO FORMS ***
    let control: AbstractControl | null;
    if (controlName === 'popup_phone_number') {
        control = this.phonePopupForm.get(controlName);
    } else {
        control = this.signupForm.get(controlName);
    }

    if (control) {
      control.setValue(sanitizedValue, { emitEvent: false });
    }
  }

  onSubmit() {

        // --- DIAGNOSTIC LOG ---
    console.log("onSubmit() triggered. Checking form validity...");
    console.log("Is signupForm valid?", this.signupForm.valid);
    console.log("Full form value:", this.signupForm.value);
    console.log("Full form errors:", this.signupForm.errors);

    const isManualFormValid = 
        this.signupForm.get('first_name').valid &&
        this.signupForm.get('last_name').valid &&
        this.signupForm.get('phone_number').valid &&
        this.signupForm.get('email').valid &&
        this.signupForm.get('password').valid &&
        this.signupForm.get('confirm_password').valid &&
        !this.signupForm.hasError('mismatch');

    if (isManualFormValid) {
      this.spinner.show(); // Show spinner only when request starts

      console.log("Form is valid. Proceeding with API call.");

      const firstName = this.signupForm.get('first_name').value;
      const lastName = this.signupForm.get('last_name').value;
      const initials = this.thumbnailService.getUserInitials(`${firstName} ${lastName}`);
      const userType = this.userType;

      const formData = {
        first_name: this.signupForm.get('first_name').value,
        last_name: this.signupForm.get('last_name').value,
        phone_number: this.signupForm.get('phone_number').value,
        email: this.signupForm.get('email').value,
        password: this.signupForm.get('password').value,
        user_type: userType, // The only change inside this object
        initials: initials  // Include initials here
      };

      console.log("cANDIDATE sIGNUP FORM: ", formData);
      

      this.http.post(`${this.baseUrl}api/auth/signup/`, formData).subscribe(
        (response: any) => {
          console.log('Signup successful', response);
          this.errorMessage = '';
          this.successMessage = response.message || 'Successfully Signed up';
          
          // Store JWT token in local storage or session storage
          localStorage.setItem('jwtToken', response.access); // Store the access token
          localStorage.setItem('refreshToken', response.refresh);
          localStorage.setItem('user_id', response.user_id); // Store the user_id
          localStorage.setItem('userType', response.role);

          // Fetch user profile after successful login
          this.userProfileService.fetchUserProfile().subscribe(
            () => {
              this.errorMessage = '';
              this.router.navigate(['/profile-overview-page'], { state: { source: 'candidate' } });
            },
            (profileError) => {
              console.error('Error fetching profile', profileError);
              // Navigate anyway, but with a warning
              this.router.navigate(['/profile-overview-page'], { state: { source: 'candidate' } });
            }
          );
          // Hide overlay before navigation
          this.spinner.hide();
        },
        (error) => {
          console.log('Error response:', error);
          this.successMessage = '';

          // Hide overlay on error
          this.spinner.hide();

          if (error.status === 400 && error.error.email) {
            this.errorMessage = 'Email already exists!';
          } else if (error.status === 400 && error.error.phone_number) {
            this.errorMessage = 'Phone number already exists!';
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
          console.log('Error message set to:', this.errorMessage);
        }
      );
          }else {
        // --- ADDED: Mark fields as touched if form is invalid ---
        // This ensures validation messages appear if the user clicks "Sign Up" on an empty form.
        Object.values(this.signupForm.controls).forEach(control => {
            control.markAsTouched();
        });
        console.log("Manual signup form is invalid.");
    }
  }

 phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      // FROM: return this.http.get(`${this.baseUrl}check-phone/?phone=${phone}`).pipe(
      // TO:
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
      // FROM: return this.http.get(`${this.baseUrl}check-email/?email=${email}`).pipe(
      // TO:
      return this.http.get(`${this.baseUrl}api/auth/check-email/?email=${email}`).pipe(
        map((res: any) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
}