import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { BufferPage } from './buffer-page.component'

const routes = [
  {
    path: '',
    component: BufferPage,
  },
]

@NgModule({
  declarations: [BufferPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [BufferPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BufferPageModule {}
