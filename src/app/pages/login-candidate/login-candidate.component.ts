import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/candidate.service'; // Adjust path as needed
import { Router } from '@angular/router';

@Component({
  selector: 'login-candidate',
  templateUrl: 'login-candidate.component.html',
  styleUrls: ['login-candidate.component.css'],
})
export class LoginCandidate {
  errorMessage: string = '';

  constructor(
    private title: Title,
    private meta: Meta,
    private authService: AuthService,
    private router: Router
  ) {
    this.title.setTitle('Login-Candidate - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Login-Candidate - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  onLoginSubmit(event: { email: string, password: string }) {
    this.authService.login(event.email, event.password).subscribe(
      (response) => {
        if (response.message === 'Login successful') {
          this.errorMessage = '';
          this.router.navigate(['/candidate-home']); // Redirect to candidate home page
        } else {
          this.errorMessage = 'Unexpected response from server';
        }
      },
      (error) => {
        this.errorMessage = error.error?.error || 'Login failed';
      }
    );
  }
}