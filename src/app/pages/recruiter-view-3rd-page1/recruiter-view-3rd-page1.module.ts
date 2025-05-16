import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { RecruiterView3rdPage1 } from './recruiter-view-3rd-page1.component'

const routes = [
  {
    path: '',
    component: RecruiterView3rdPage1,
  },
]

@NgModule({
  declarations: [RecruiterView3rdPage1],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [RecruiterView3rdPage1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterView3rdPage1Module {}
