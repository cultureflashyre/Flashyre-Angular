import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
 
import { LoginCandidate } from './login-candidate.component';

const routes = [
  {
    path: '',
    component: LoginCandidate,
  },
];

@NgModule({
  declarations: [LoginCandidate],
  imports: [CommonModule,   RouterModule.forChild(routes)],
  exports: [LoginCandidate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginCandidateModule {}