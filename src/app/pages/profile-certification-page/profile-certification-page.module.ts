import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { ProfileCertificationPage } from './profile-certification-page.component'

const routes = [
  {
    path: '',
    component: ProfileCertificationPage,
  },
]

@NgModule({
  declarations: [ProfileCertificationPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [ProfileCertificationPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileCertificationPageModule {}
