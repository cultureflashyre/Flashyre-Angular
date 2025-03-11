import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'profile-last-page1',
  templateUrl: 'profile-last-page1.component.html',
  styleUrls: ['profile-last-page1.component.css'],
})
export class ProfileLastPage1 implements OnInit { // Implement OnInit
  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router // Inject Router
  ) {
    this.title.setTitle('Profile-Last-Page1 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Last-Page1 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigate(['/candidate-home']);
    }, 5000);
  }
}