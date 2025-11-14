import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { LandingPageNavbar } from 'src/app/components/landing-page-navbar/landing-page-navbar.component'
import { LandingPageJobSearchHero } from 'src/app/components/landing-page-job-search-hero/landing-page-job-search-hero.component'
import { LandingPageReadableArticlesCardSmall } from 'src/app/components/landing-page-readable-articles-card-small/landing-page-readable-articles-card-small.component'
import { LandinPageTestimonialCard } from 'src/app/components/landin-page-testimonial-card/landin-page-testimonial-card.component'
import { LandingPageFooter } from 'src/app/components/landing-page-footer/landing-page-footer.component'

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    LandingPageNavbar, LandingPageJobSearchHero, LandingPageReadableArticlesCardSmall,
    LandinPageTestimonialCard, LandingPageFooter,
  ],
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.css'],
})
export class Index {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Index - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Index - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
}
