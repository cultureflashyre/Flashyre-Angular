import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger.service'; // Adjust path as needed

@Component({
  selector: 'log-in-page',
  templateUrl: 'log-in-page.component.html',
  styleUrls: ['log-in-page.component.css'],
})
export class LogInPage implements OnInit {
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @Input() textinputPlaceholder1: string = 'Enter Password';
  @Input() textinputPlaceholder: string = 'Enter your email';
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('forgotPassword') forgotPassword: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;

  loginForm: FormGroup;
  showPassword: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.logger.debug('LogInPage component initialized');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.logger.debug('Submitting login form with data:', this.loginForm.value);
      this.http.post('http://localhost:8000/api/login/', this.loginForm.value).subscribe(
        (response) => {
          this.logger.info('Login successful', response);
          this.errorMessage = '';
          this.router.navigate(['/university_college_dashboard']); // Redirect on success
        },
        (error) => {
          this.logger.error('Login failed', error);
          if (error.error?.email) {
            this.errorMessage = 'User with this email does not exist.';
          } else if (error.error?.password) {
            this.errorMessage = 'Incorrect password.';
          } else {
            this.errorMessage = 'An error occurred during login.';
          }
        }
      );
    } else {
      const invalidControls = [];
      for (const controlName in this.loginForm.controls) {
        const control = this.loginForm.get(controlName);
        if (control?.invalid) {
          invalidControls.push({ name: controlName, errors: control.errors });
        }
      }
      this.logger.error('Form invalid. Invalid controls:', invalidControls);
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}