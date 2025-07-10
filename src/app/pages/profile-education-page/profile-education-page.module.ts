import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { ProfileEducationPage } from './profile-education-page.component'

const routes = [
  {
    path: '',
    component: ProfileEducationPage,
  },
]

@NgModule({
  declarations: [ProfileEducationPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [ProfileEducationPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileEducationPageModule {}
