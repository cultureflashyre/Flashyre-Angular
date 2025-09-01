import { Component, OnInit, Input, ContentChild, TemplateRef, OnDestroy } from '@angular/core'; // Import necessary Angular core modules for component lifecycle and templating.
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'; // Import form-related modules for building and validating reactive forms. Note: Removed AsyncValidatorFn since we're handling async manually.
import { HttpClient } from '@angular/common/http'; // Import HttpClient for making HTTP requests.
import { Observable, of, Subject } from 'rxjs'; // Import RxJS modules for handling observables and subjects.
import { map, catchError, takeUntil, debounceTime, switchMap } from 'rxjs/operators'; // Import RxJS operators for transforming, handling, debouncing, and switching observables.
import { Router } from '@angular/router'; // Import Router for navigation within the application.
import { CorporateAuthService } from '../../services/corporate-auth.service'; // Import custom service for corporate authentication.
import { NgxSpinnerService } from 'ngx-spinner'; // Import spinner service for loading indicators.
import { environment } from '../../../environments/environment'; // Import environment configuration for API URLs.
import { UserProfileService } from '../../services/user-profile.service'; // Import service for fetching user profiles.

@Component({ // Define the Angular component decorator.
  selector: 'signup-corporate1', // Selector for using this component in templates.
  templateUrl: './signup-corporate1.component.html', // Path to the component's HTML template.
  styleUrls: ['./signup-corporate1.component.css'] // Path to the component's CSS styles.
})
export class SignupCorporate1 implements OnInit, OnDestroy { // Class definition implementing OnInit and OnDestroy interfaces.

  private baseUrl = environment.apiUrl; // Store the base API URL from the environment configuration.

  @ContentChild('button') button: TemplateRef<any>; // Content child for custom button template.
  @ContentChild('text12') text12: TemplateRef<any>; // Content child for custom text12 template.
  @ContentChild('text13') text13: TemplateRef<any>; // Content child for custom text13 template.
  @ContentChild('text1111') text1111: TemplateRef<any>; // Content child for custom text1111 template.
  @Input() rootClassName: string = ''; // Input property for root class name with default empty string.
  @ContentChild('text') text: TemplateRef<any>; // Content child for custom text template.
  @ContentChild('text1') text1: TemplateRef<any>; // Content child for custom text1 template.
  @ContentChild('text11') text11: TemplateRef<any>; // Content child for custom text11 template.
  @ContentChild('text5') text5: TemplateRef<any>; // Content child for custom text5 template.
  @ContentChild('text21') text21: TemplateRef<any>; // Content child for custom text21 template.
  @ContentChild('heading') heading: TemplateRef<any>; // Content child for custom heading template.
  @ContentChild('text111') text111: TemplateRef<any>; // Content child for custom text111 template.
  @ContentChild('text2') text2: TemplateRef<any>; // Content child for custom text2 template.
  @ContentChild('text6') text6: TemplateRef<any>; // Content child for custom text6 template.
  @ContentChild('text71') text71: TemplateRef<any>; // Content child for custom text71 template.

  signupForm: FormGroup; // Declare the reactive form group for signup.
  errorMessage: string = ''; // Initialize error message string.
  successMessage: string = ''; // Initialize success message string.
  showSuccessPopup: boolean = false; // Flag to control success popup visibility.
  passwordType: string = 'password'; // Initial type for password input field.
  confirmPasswordType: string = 'password'; // Initial type for confirm password input field.
  passwordButtonText: string = 'Show'; // Initial text for password visibility toggle button.
  confirmPasswordButtonText: string = 'Show'; // Initial text for confirm password visibility toggle button.

  private destroy$ = new Subject<void>(); // Subject to manage subscription cleanup on destroy.

  constructor( // Constructor for dependency injection.
    private fb: FormBuilder, // Inject FormBuilder for creating form groups.
    private corporateAuthService: CorporateAuthService, // Inject corporate authentication service.
    private router: Router, // Inject Router for navigation.
    private spinner: NgxSpinnerService, // Inject spinner service for loading.
    private http: HttpClient, // Inject HttpClient for API calls.
    private userProfileService: UserProfileService // Inject user profile service.
  ) {  }

  ngOnInit() { // Lifecycle hook for initialization.
    this.signupForm = this.fb.group( // Create the form group.
      {
        first_name: ['', [Validators.required,  // First name control with validators.
          Validators.pattern(/^[a-zA-Z ]+$/),  // Pattern validator for letters and spaces.
          Validators.minLength(3), // Minimum length validator.
          Validators.maxLength(10), // Maximum length validator.
        ]],
        last_name: ['', [Validators.required,  // Last name control with validators.
          Validators.pattern(/^[a-zA-Z ]+$/),  // Pattern validator for letters and spaces.
          Validators.minLength(3), // Minimum length validator.
          Validators.maxLength(10), // Maximum length validator.
      ]],
        company_name: ['', Validators.required], // Company name control with required validator.
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // Phone number control with synchronous validators only.
        email: ['', [Validators.required, Validators.email]], // Email control with synchronous validators only.
        password: ['', [Validators.required,  // Password control with validators.
          this.passwordComplexityValidator(),  // Custom password complexity validator.
          Validators.minLength(8), // Minimum length validator.
          Validators.maxLength(15) // Maximum length validator.
        ]],
        confirm_password: ['', Validators.required], // Confirm password control with required validator.
      },
      { validator: this.passwordMatchValidator } // Form-level validator for password matching.
    );

    this.setupAsyncValidators(); // Set up manual async validation with debouncing after form initialization.
  }

  private setupAsyncValidators() { // Private method to set up debounced async validation subscriptions.
    this.setupEmailValidator(); // Set up email validator.
    this.setupPhoneValidator(); // Set up phone validator.
  }

  private setupEmailValidator() { // Private method to handle debounced email existence check.
    this.signupForm.get('email').valueChanges.pipe( // Subscribe to value changes of email control.
      debounceTime(500), // Debounce input by 500ms to reduce API calls during typing.
      switchMap(email => { // Use switchMap to cancel previous requests if new value comes in.
        const emailControl = this.signupForm.get('email'); // Get email control reference.
        if (!email || emailControl.hasError('required') || emailControl.hasError('email')) { // Skip if empty or synchronous validation fails.
          return of(null); // Return null observable.
        }
        return this.http.get(`${this.baseUrl}check-email/?email=${email}`).pipe( // Make HTTP GET request for existence check.
          map((res: any) => res.exists ? { emailExists: true } : null), // Map response to validation error if exists.
          catchError(() => of(null)) // Catch errors and return null.
        );
      }),
      takeUntil(this.destroy$) // Cancel subscription on component destroy.
    ).subscribe(error => { // Subscribe to set errors on control.
      this.signupForm.get('email').setErrors(error); // Set or clear errors based on response.
    });
  }

  private setupPhoneValidator() { // Private method to handle debounced phone existence check.
    this.signupForm.get('phone_number').valueChanges.pipe( // Subscribe to value changes of phone_number control.
      debounceTime(500), // Debounce input by 500ms to reduce API calls during typing.
      switchMap(phone => { // Use switchMap to cancel previous requests if new value comes in.
        const phoneControl = this.signupForm.get('phone_number'); // Get phone_number control reference.
        if (!phone || phoneControl.hasError('required') || phoneControl.hasError('pattern')) { // Skip if empty or synchronous validation fails.
          return of(null); // Return null observable.
        }
        return this.http.get(`${this.baseUrl}check-phone/?phone=${phone}`).pipe( // Make HTTP GET request for existence check.
          map((res: any) => res.exists ? { phoneExists: true } : null), // Map response to validation error if exists.
          catchError(() => of(null)) // Catch errors and return null.
        );
      }),
      takeUntil(this.destroy$) // Cancel subscription on component destroy.
    ).subscribe(error => { // Subscribe to set errors on control.
      this.signupForm.get('phone_number').setErrors(error); // Set or clear errors based on response.
    });
  }

  sanitizePhoneNumber(event: Event): void { // Function to sanitize phone number input.
    const input = event.target as HTMLInputElement; // Cast event target to input element.
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10); // Remove non-digits and limit to 10 characters.
    this.signupForm.get('phone_number').setValue(sanitizedValue, { emitEvent: false }); // Set sanitized value without emitting event to avoid infinite loop.
  }

  passwordComplexityValidator(): ValidatorFn { // Define custom validator for password complexity.
    return (control: AbstractControl): ValidationErrors | null => { // Return function that takes control and returns errors or null.
      const value = control.value || ''; // Get value or empty string.

      if (!value) { // Check if value is empty.
        return null; // Let required validator handle empty case.
      }

      const errors: ValidationErrors = {}; // Initialize errors object.

      if (value.length < 8) { // Check minimum length.
        errors.minlength = { requiredLength: 8, actualLength: value.length }; // Set minlength error.
      }
      if (!/[A-Z]/.test(value)) { // Check for uppercase letter.
        errors.uppercase = true; // Set uppercase error.
      }
      if (!/[a-z]/.test(value)) { // Check for lowercase letter.
        errors.lowercase = true; // Set lowercase error.
      }
      if (!/[0-9]/.test(value)) { // Check for number.
        errors.number = true; // Set number error.
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) { // Check for special character.
        errors.specialChar = true; // Set specialChar error.
      }
      // At least one alphabet is covered by uppercase or lowercase, but explicitly check:
      if (!/[a-zA-Z]/.test(value)) { // Check for at least one alphabet.
        errors.alphabet = true; // Set alphabet error.
      }

      return Object.keys(errors).length ? errors : null; // Return errors if any, else null.
    };
  }

  passwordMatchValidator(form: FormGroup) { // Form-level validator for password matching.
    return form.get('password')!.value === form.get('confirm_password')!.value // Compare password and confirm password.
      ? null // Return null if match.
      : { mismatch: true }; // Return mismatch error if not.
  }

  onSubmit() { // Function to handle form submission.
    if (this.signupForm.valid) { // Check if form is valid (includes manual async errors).
      this.spinner.show(); // Show loading spinner.
      this.errorMessage = ''; // Clear previous error message.

      const formData = { ...this.signupForm.value }; // Spread form values into object.

      delete formData.confirm_password; // Remove confirm_password as not needed by backend.
      
      formData.role = 'recruiter'; // Set role to recruiter.

      this.http.post(`${this.baseUrl}api/auth/signup/`, formData).subscribe({ // Make HTTP POST request.
        next: (response: any) => { // Handle successful response.
          this.spinner.hide(); // Hide spinner.
          this.showSuccessPopup = true; // Show success popup.
          
          localStorage.setItem('jwtToken', response.access); // Store access token.
          localStorage.setItem('refreshToken', response.refresh); // Store refresh token.
          localStorage.setItem('userID', response.user_id); // Store user ID.
          localStorage.setItem('userType', response.role); // Store user type.
          
          this.userProfileService.fetchUserProfile().subscribe({ // Fetch user profile.
            next: () => { // Handle success.
              this.router.navigate(['/create-job-post-1st-page'], { state: { source: 'recruiter' } }); // Navigate.
            },
            error: (profileError) => { // Handle error.
              console.error('Error fetching profile', profileError); // Log error.
              this.router.navigate(['/create-job-post-1st-page'], { state: { source: 'recruiter' } }); // Navigate anyway.
            }
          });
        },
        error: (error) => { // Handle submission error.
          this.spinner.hide(); // Hide spinner.
          console.error('Signup failed:', error.error); // Log error.

          if (error.status === 400 && error.error) { // Check for bad request.
            let errorMessages = []; // Array for messages.
            const errorData = error.error; // Get data.

            for (const key in errorData) { // Loop keys.
              if (Array.isArray(errorData[key])) { // If array.
                errorMessages.push(`${key.replace('_', ' ')}: ${errorData[key][0]}`); // Format and push.
              }
            }
            
            if (errorMessages.length > 0) { // If messages.
              this.errorMessage = errorMessages.join(' | '); // Join and set.
            } else { // Default.
              this.errorMessage = 'An unknown validation error occurred. Please check your input.'; // Set message.
            }

          } else { // Other errors.
            this.errorMessage = 'An unexpected error occurred. Please try again later.'; // Set message.
          }
        }
      });
    } else { // Invalid form.
      this.errorMessage = 'Please fill in all required fields correctly.'; // Set message.
      this.signupForm.markAllAsTouched(); // Show errors.
    }
  }

  togglePasswordVisibility() { // Toggle password visibility.
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password'; // Toggle type.
    this.passwordButtonText = this.passwordType === 'password' ? 'Show' : 'Hide'; // Update text.
  }

  toggleConfirmPasswordVisibility() { // Toggle confirm password visibility.
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password'; // Toggle type.
    this.confirmPasswordButtonText = this.confirmPasswordType === 'password' ? 'Show' : 'Hide'; // Update text.
  }

  navigateToLogin() { // Navigate to login.
    this.router.navigate(['/login-corporate']); // Route to corporate login.
  }

  closePopup() { // Close popup.
    this.showSuccessPopup = false; // Hide.
    this.router.navigate(['/login-corporate']); // Navigate.
  }

  ngOnDestroy() { // Cleanup on destroy.
    this.destroy$.next(); // Emit to cancel.
    this.destroy$.complete(); // Complete subject.
  }
}