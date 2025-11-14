import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForRecruiterView } from 'src/app/components/navbar-for-recruiter-view/navbar-for-recruiter-view.component'
import { RecruiterProfile } from 'src/app/components/recruiter-profile/recruiter-profile.component'
import { WriteAJobPostForRecruiter } from 'src/app/components/write-a-job-post-for-recruiter/write-a-job-post-for-recruiter.component'
import { RecruiterFlowJobPostedCard } from 'src/app/components/recruiter-flow-job-posted-card/recruiter-flow-job-posted-card.component'
import { NavbarForCandidateView107672 } from 'src/app/components/navbar-for-candidate-view-107672/navbar-for-candidate-view-107672.component'
import { RecruiterFlowSmallCard } from 'src/app/components/recruiter-flow-small-card/recruiter-flow-small-card.component'  
import { RecruiterFlowLargeCard } from 'src/app/components/recruiter-flow-large-card/recruiter-flow-large-card.component'
import { RecruiterNavbar } from 'src/app/components/recruiter-navbar/recruiter-navbar.component'
import { RecruiterFlowProfileCard } from 'src/app/components/recruiter-flow-profile-card/recruiter-flow-profile-card.component'
import { RecruiterCompanyJobCard } from 'src/app/components/recruiter-company-job-card/recruiter-company-job-card.component'
import { NavbarForCandidateView860721 } from 'src/app/components/navbar-for-candidate-view-86072-1/navbar-for-candidate-view-86072-1.component'
import { RecruiterViewCandidateProfile } from 'src/app/components/recruiter-view-candidate-profile/recruiter-view-candidate-profile.component'


@Component({
  selector: 'recruiter-view5th-page',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForRecruiterView, RecruiterProfile,
    WriteAJobPostForRecruiter, RecruiterFlowJobPostedCard,
    NavbarForCandidateView107672, RecruiterFlowSmallCard,
    RecruiterFlowLargeCard, RecruiterNavbar,
    RecruiterFlowProfileCard, RecruiterCompanyJobCard,
    NavbarForCandidateView860721, RecruiterViewCandidateProfile,
  ],
  templateUrl: 'recruiter-view-5th-page.component.html',
  styleUrls: ['recruiter-view-5th-page.component.css'],
})
export class RecruiterView5thPage {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-view-5th-page - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-view-5th-page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
