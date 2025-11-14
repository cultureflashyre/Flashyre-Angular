import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForRecruiterView } from 'src/app/components/navbar-for-recruiter-view/navbar-for-recruiter-view.component'
import { RecruiterProfile } from 'src/app/components/recruiter-profile/recruiter-profile.component'
import { WriteAJobPostForRecruiter } from 'src/app/components/write-a-job-post-for-recruiter/write-a-job-post-for-recruiter.component'
import { RecruiterFlowJobPostedCard } from 'src/app/components/recruiter-flow-job-posted-card/recruiter-flow-job-posted-card.component'

@Component({
  selector: 'recruiter-view3rd-page',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForRecruiterView, RecruiterProfile,
    WriteAJobPostForRecruiter, RecruiterFlowJobPostedCard,
  ],
  templateUrl: 'recruiter-view-3rd-page.component.html',
  styleUrls: ['recruiter-view-3rd-page.component.css'],
})
export class RecruiterView3rdPage {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-view-3rd-page - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-view-3rd-page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
