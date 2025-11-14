import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView } from 'src/app/components/navbar-for-candidate-view/navbar-for-candidate-view.component'
import { DangerousHtmlComponent } from 'src/app/components/dangerous-html/dangerous-html.component'
@Component({
  selector: 'assessment-taken-page2',
  standalone: true,
  imports: [ CommonModule, RouterModule, FormsModule,
    NavbarForCandidateView, DangerousHtmlComponent,
  ],
  templateUrl: './assessment-taken-page-2.component.html',
  styleUrls: ['./assessment-taken-page-2.component.css'],
})
export class AssessmentTakenPage2 {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Assessment-Taken-Page-2 - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Assessment-Taken-Page-2 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}