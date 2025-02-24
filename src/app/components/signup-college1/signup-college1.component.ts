import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../../services/logger.service'; // Adjust path as needed

@Component({
  selector: 'signup-college1',
  templateUrl: 'signup-college1.component.html',
  styleUrls: ['signup-college1.component.css'],
})
export class SignupCollege1 implements OnInit {
  // Existing ContentChild and Input properties remain unchanged
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('text121') text121: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text21') text21: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text22') text22: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;

  signupForm: FormGroup;
  universities: string[] = ['University A', 'University B', 'University C'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private logger: LoggerService // Inject logger service
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone_number: ['', Validators.required],
      university_college: ['', Validators.required],
      university_college_id: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
    }, { validator: this.passwordMatchValidator });

    this.logger.debug('SignupCollege1 component initialized');
  }

  passwordMatchValidator(control: AbstractControl): null | { mismatch: boolean } {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.logger.debug('Submitting signup form with data:', this.signupForm.value);
      this.http.post('http://localhost:8000/api/signup/', this.signupForm.value).subscribe(
        (response) => {
          this.logger.info('Signup successful', response);
        },
        (error) => {
          this.logger.error('Signup failed', error);
          if (error.error?.confirm_password) {
            alert('Passwords do not match.');
          } else if (error.error?.email) {
            alert('Email already exists.');
          }
        }
      );
    } else {
      const invalidControls = [];
      for (const controlName in this.signupForm.controls) {
        const control = this.signupForm.get(controlName);
        if (control?.invalid) {
          invalidControls.push({ name: controlName, errors: control.errors });
        }
      }
      this.logger.error('Form invalid. Invalid controls:', invalidControls);
    }
  }}