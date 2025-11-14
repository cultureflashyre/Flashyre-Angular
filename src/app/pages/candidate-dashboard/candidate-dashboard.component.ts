import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { FlashyreDashboard } from 'src/app/components/flashyre-dashboard/flashyre-dashboard.component'


@Component({
  selector: 'candidate-dashboard',
    standalone: true,
    imports: [ RouterModule, FormsModule, CommonModule,
      FlashyreDashboard
    ],
  templateUrl: 'candidate-dashboard.component.html',
  styleUrls: ['candidate-dashboard.component.css'],
})
export class CandidateDashboard {
  rawbso2: string = ' '
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Candidate-Dashboard - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Dashboard - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
