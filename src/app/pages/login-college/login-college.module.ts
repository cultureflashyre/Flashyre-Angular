import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { LoginCollege } from './login-college.component'

const routes = [
  {
    path: '',
    component: LoginCollege,
  },
]

@NgModule({
  declarations: [LoginCollege],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [LoginCollege],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginCollegeModule {}
