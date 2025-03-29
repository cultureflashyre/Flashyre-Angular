import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/candidate.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService

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
    private router: Router,
    private spinner: NgxSpinnerService,

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
    this.spinner.show(); // Show spinner before making the request

    this.authService.login(event.email, event.password).subscribe(
      (response) => {
        if (response.access) { // Check for token in response
          console.log("Response Access Token: ", response.access);
          localStorage.setItem('jwtToken', response.access); // Store the access token

          this.errorMessage = '';
          this.router.navigate(['/candidate-home']);
        } else {
          this.errorMessage = response.access;
        }
        this.spinner.hide(); // Hide spinner after successful response
      },
      (error) => {
        this.errorMessage = error.error?.error || 'Login failed';
        this.spinner.hide(); // Hide spinner after error
      }
    );
  }
}