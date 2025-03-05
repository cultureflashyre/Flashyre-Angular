import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfileBasicinformationComponent } from '../../components/profile-basicinformation-component/profile-basicinformation-component.component';

@Component({
  selector: 'profile-basic-information',
  templateUrl: './profile-basic-information.component.html',
  styleUrls: ['./profile-basic-information.component.css'],
})
export class ProfileBasicInformation {
  @ViewChild('profileComponent') profileComponent!: ProfileBasicinformationComponent;

  constructor(private title: Title, private meta: Meta, private router: Router) {
    this.title.setTitle('Profile-Basic-Information - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Basic-Information - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  skip() {
    this.profileComponent.skip();
  }

  saveProfile() {
    this.profileComponent.saveProfile();
  }
}