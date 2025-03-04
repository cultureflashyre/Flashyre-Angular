import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger.service'; // Adjust path as needed

@Component({
  selector: 'login-college',
  templateUrl: 'login-college.component.html',
  styleUrls: ['login-college.component.css'],
})
export class LoginCollege {
  errorMessage: string = '';

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService
  ) {
    this.title.setTitle('Login-College - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Login-College - Flashyre' },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
    this.logger.debug('LoginCollege component initialized');
  }

  onLoginSubmit(data: { email: string; password: string }): void {
    this.logger.debug('Received login submission with data:', data);

    // Check if email or password is empty
    if (!data.email || !data.password) {
      this.errorMessage = 'Enter email and password';
      this.logger.error('Login attempt with missing credentials');
      return; // Stop further execution
    }

    // Proceed with the HTTP request if credentials are provided
    this.http.post('http://localhost:8000/api/login/', data).subscribe(
      (response) => {
        this.logger.info('Login successful', response);
        this.errorMessage = '';
        this.router.navigate(['/university_college_dashboard']);
      },
      // (error) => {
      //   this.logger.error('Login failed', error);
      //   this.errorMessage = 'Invalid Email or Password';
      // }
    );
  }
}