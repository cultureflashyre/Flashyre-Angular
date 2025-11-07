import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SocialAuthService, GoogleLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
import { UserProfileService } from '../../services/user-profile.service';
import { ThumbnailService } from '../../services/thumbnail.service'; // Import thumbnail service
import { Console } from 'console';
import { AuthService } from '../../services/candidate.service'; // Renamed to avoid conflict
import { CorporateAuthService } from '../../services/corporate-auth.service';

  @Component({
  selector: 'signup-candidate1',
  templateUrl: './signup-candidate1.component.html',
  styleUrls: ['./signup-candidate1.component.css'],
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

   // --- NEW STATE VARIABLES FOR GOOGLE SIGNUP ---
  showPhonePopup: boolean = false;
  isSubmittingPhone: boolean = false;
  popupErrorMessage: string = '';
  googleUserData: { email: string, first_name: string, last_name: string } | null = null;

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
      user_type_radio: ['candidate', Validators.required], // For the radio buttons
      popup_phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]       },
      { validator: this.passwordMatchValidator }
    );
        // --- ADDED: Google Sign-Up Subscription Logic ---
    // This is the new, correct way to handle Google Sign-Up.
    // It listens for a successful authentication from the <asl-google-signin-button>
    // in your HTML and then executes the multi-step signup logic.
    this.socialAuthService.authState.subscribe((socialUser: SocialUser) => {
      this.errorMessage = ''; // Clear previous errors
      const idToken = socialUser.idToken;
      const selectedUserType = this.signupForm.get('user_type_radio').value;

      const authObservable = selectedUserType === 'corporate'
        ? this.corporateAuthService.googleAuthCheck(idToken)
        : this.candidateAuthService.googleAuthCheck(idToken);

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
        },
        error: (err) => {
          this.spinner.hide();
          this.errorMessage = err.error?.error || 'An error occurred. Please try again.';
        }
      });
    });
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
    if (this.signupForm.get('popup_phone_number').invalid) {
      return;
    }

    this.isSubmittingPhone = true;
    this.popupErrorMessage = '';
    const selectedUserType = this.signupForm.get('user_type_radio').value;

    const finalUserData = {
      ...this.googleUserData,
      phone_number: this.signupForm.get('popup_phone_number').value
    };

    const signupObservable = selectedUserType === 'corporate'
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
    this.signupForm.get('popup_phone_number').reset();
  }

  sanitizePhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);
    this.signupForm.get('phone_number').setValue(sanitizedValue, { emitEvent: false });
  }

  onSubmit() {
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

      const firstName = this.signupForm.get('first_name').value;
      const lastName = this.signupForm.get('last_name').value;
      const initials = this.thumbnailService.getUserInitials(`${firstName} ${lastName}`);
      const userType = this.signupForm.get('user_type_radio').value === 'corporate' ? 'recruiter' : 'candidate';

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