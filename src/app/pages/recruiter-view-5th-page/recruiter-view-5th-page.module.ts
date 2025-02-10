import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { RecruiterView5thPage } from './recruiter-view-5th-page.component'

const routes = [
  {
    path: '',
    component: RecruiterView5thPage,
  },
]

@NgModule({
  declarations: [RecruiterView5thPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [RecruiterView5thPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterView5thPageModule {}
