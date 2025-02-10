import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { ProfileBasicInformation } from './profile-basic-information.component'

const routes = [
  {
    path: '',
    component: ProfileBasicInformation,
  },
]

@NgModule({
  declarations: [ProfileBasicInformation],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [ProfileBasicInformation],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileBasicInformationModule {}
