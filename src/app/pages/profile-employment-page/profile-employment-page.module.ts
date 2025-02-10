import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { ProfileEmploymentPage } from './profile-employment-page.component'

const routes = [
  {
    path: '',
    component: ProfileEmploymentPage,
  },
]

@NgModule({
  declarations: [ProfileEmploymentPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [ProfileEmploymentPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileEmploymentPageModule {}
