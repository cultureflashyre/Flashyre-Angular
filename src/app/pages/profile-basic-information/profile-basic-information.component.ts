import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView1 } from 'src/app/components/navbar-for-candidate-view1/navbar-for-candidate-view1.component';
import { ProgressBarStep1 } from 'src/app/components/progress-bar-step-1/progress-bar-step-1.component';
import { ProfileBasicinformationComponent } from '../../components/profile-basicinformation-component/profile-basicinformation-component.component';
import { ProfileCreationNavigation1 } from 'src/app/components/profile-creation-navigation1/profile-creation-navigation1.component';


@Component({
  selector: 'profile-basic-information',
  standalone: true,
    imports: [ RouterModule, FormsModule, CommonModule,
      NavbarForCandidateView1, ProgressBarStep1, ProfileBasicinformationComponent,
      ProfileCreationNavigation1,
      ],
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