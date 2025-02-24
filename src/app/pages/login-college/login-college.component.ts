import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'login-college',
  templateUrl: 'login-college.component.html',
  styleUrls: ['login-college.component.css'],
})
export class LoginCollege {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Login-College - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Login-College - Flashyre' },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }
}