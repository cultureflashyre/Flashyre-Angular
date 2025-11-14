import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { SignupPageNavbar } from 'src/app/components/signup-page-navbar/signup-page-navbar.component'
import { SignupCandidate1 } from 'src/app/components/signup-candidate1/signup-candidate1.component'


@Component({
  selector: 'signup-candidate',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    SignupCandidate1, SignupPageNavbar,
  ],
  templateUrl: 'signup-candidate.component.html',
  styleUrls: ['signup-candidate.component.css'],
})
export class SignupCandidate {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Signup-Candidate - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Signup-Candidate - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
