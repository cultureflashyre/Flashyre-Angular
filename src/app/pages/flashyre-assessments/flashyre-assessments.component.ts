import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

@Component({
  selector: 'flashyre-assessments',
  templateUrl: 'flashyre-assessments.component.html',
  styleUrls: ['flashyre-assessments.component.css'],
})
export class FlashyreAssessments {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Flashyre-Assessments - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessments - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
