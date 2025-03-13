import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

@Component({
  selector: 'candidate-assessment',
  templateUrl: 'candidate-assessment.component.html',
  styleUrls: ['candidate-assessment.component.css'],
})
export class CandidateAssessment {
  raw6b6z: string = ' '
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Candidate-Assessment - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Assessment - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
