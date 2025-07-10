import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { Index } from './index.component'

const routes = [
  {
    path: '',
    component: Index,
  },
]

@NgModule({
  declarations: [Index],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [Index],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IndexModule {}
