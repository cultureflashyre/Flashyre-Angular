import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView1 } from 'src/app/components/navbar-for-candidate-view1/navbar-for-candidate-view1.component'
import { ProgressBarStep3 } from 'src/app/components/progress-bar-step-3/progress-bar-step-3.component'
import { AppComponent } from 'src/app/components/component/component.component'
import { ProfileCreationNavigation2 } from 'src/app/components/profile-creation-navigation2/profile-creation-navigation2.component'

@Component({
  selector: 'profile-education-page',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForCandidateView1, ProgressBarStep3,
    AppComponent, ProfileCreationNavigation2,
  ],
  templateUrl: 'profile-education-page.component.html',
  styleUrls: ['profile-education-page.component.css'],
})
export class ProfileEducationPage {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Profile-Education-Page - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Education-Page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
