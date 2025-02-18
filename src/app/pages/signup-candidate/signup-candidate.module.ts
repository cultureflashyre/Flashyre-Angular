import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms'

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
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes),HttpClientModule,FormsModule],
  exports: [SignupCandidate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupCandidateModule {}
