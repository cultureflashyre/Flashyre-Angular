import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

@Component({
  selector: 'create-job-post2nd-page',
  templateUrl: 'create-job-post-2nd-page.component.html',
  styleUrls: ['create-job-post-2nd-page.component.css'],
})
export class CreateJobPost2ndPage {
  rawplt0: string = ' '
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Create-Job-Post-2nd-page - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Create-Job-Post-2nd-page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
