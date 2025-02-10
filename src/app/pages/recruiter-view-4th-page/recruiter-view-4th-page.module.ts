import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { RecruiterView4thPage } from './recruiter-view-4th-page.component'

const routes = [
  {
    path: '',
    component: RecruiterView4thPage,
  },
]

@NgModule({
  declarations: [RecruiterView4thPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [RecruiterView4thPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterView4thPageModule {}
