import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
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
    this.errorMessage = ''; // Clear error on new submission
    // Navigate only if login is successful
    this.router.navigate(['/recruiter-view-3rd-page']).catch((err) => {
      console.error('Navigation error:', err);
      this.errorMessage = 'Navigation failed. Please try again.';
    });
  }
}