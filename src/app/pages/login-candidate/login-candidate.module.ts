import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { LoginCandidate } from './login-candidate.component'

const routes = [
  {
    path: '',
    component: LoginCandidate,
  },
]

@NgModule({
  declarations: [LoginCandidate],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [LoginCandidate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginCandidateModule {}
