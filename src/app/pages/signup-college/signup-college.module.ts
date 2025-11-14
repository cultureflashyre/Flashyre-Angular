import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { SignupCollege } from './signup-college.component'

const routes = [
  {
    path: '',
    component: SignupCollege,
  },
]

@NgModule({
  declarations: [SignupCollege],
  imports: [CommonModule,   RouterModule.forChild(routes)],
  exports: [SignupCollege],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupCollegeModule {}
