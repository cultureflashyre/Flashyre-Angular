import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'


import { ComponentsModule } from '../../components/components.module'
import { CreateJobPost2ndPage } from './create-job-post-2nd-page.component'

const routes = [
  {
    path: '',
    component: CreateJobPost2ndPage,
  },
]

@NgModule({
  declarations: [CreateJobPost2ndPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CreateJobPost2ndPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost2ndPageModule {}
