import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'



import { ComponentsModule } from '../../components/components.module'
import { CreateJobPost3rdPage } from './create-job-post-3rd-page.component'

const routes = [
  {
    path: '',
    component: CreateJobPost3rdPage,
  },
]

@NgModule({
  declarations: [CreateJobPost3rdPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CreateJobPost3rdPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost3rdPageModule {}
