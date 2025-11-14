import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { SignupCandidate } from './signup-candidate.component'

const routes = [
  {
    path: '',
    component: SignupCandidate,
  },
]

@NgModule({
  declarations: [SignupCandidate],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [SignupCandidate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupCandidateModule {}
