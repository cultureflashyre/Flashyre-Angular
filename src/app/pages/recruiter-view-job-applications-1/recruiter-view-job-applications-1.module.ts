import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';


import { ComponentsModule } from '../../components/components.module'
import { RecruiterViewJobApplications1 } from './recruiter-view-job-applications-1.component'

const routes = [
  {
    path: ':jobId',
    component: RecruiterViewJobApplications1,
  },
]

@NgModule({
  declarations: [RecruiterViewJobApplications1],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes), FormsModule],
  exports: [RecruiterViewJobApplications1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterViewJobApplications1Module {}
