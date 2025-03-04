import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'login-corporate',
  templateUrl: 'login-corporate.component.html',
  styleUrls: ['login-corporate.component.css'],
})
export class LoginCorporate {
  errorMessage: string = ''; // Property to hold error messages

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router
  ) {
    this.title.setTitle('Login-Corporate - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Login-Corporate - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  onLoginSubmit(event: { email: string; password: string }) {
    const { email, password } = event;
    this.http
      .post('http://localhost:8000/api/login-corporate/', { email, password })
      .subscribe(
        (response: any) => {
          if (response.message === 'Login successful') {
            this.errorMessage = ''; // Clear error on success
            this.router.navigate(['/recruiter-view-3rd-page']); // Redirect
          } else {
            this.errorMessage = 'Login failed';
          }
        },
        (error) => {
          if (error.status === 401) {
            this.errorMessage = 'Invalid email or password';
          } else if (error.status === 400) {
            this.errorMessage = 'Email and password are required';
          } else {
            this.errorMessage = 'An error occurred. Please try again.';
          }
        }
      );
  }
}