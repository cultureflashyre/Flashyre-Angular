import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { EmailAndMobileNumberComponent } from 'src/app/components/email-and-mobile-number-component/email-and-mobile-number-component.component'
import { DateSelector1 } from 'src/app/components/date-selector1/date-selector1.component'
import { ProfileCreationNavigation1 } from 'src/app/components/profile-creation-navigation1/profile-creation-navigation1.component'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    EmailAndMobileNumberComponent, DateSelector1, ProfileCreationNavigation1,
  ],
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css'],
})
export class Home {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
