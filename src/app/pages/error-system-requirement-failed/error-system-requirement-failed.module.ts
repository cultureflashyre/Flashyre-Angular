import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'


import { ComponentsModule } from '../../components/components.module'
import { ErrorSystemRequirementFailed } from './error-system-requirement-failed.component'

const routes = [
  {
    path: '',
    component: ErrorSystemRequirementFailed,
  },
]

@NgModule({
  declarations: [ErrorSystemRequirementFailed],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [ErrorSystemRequirementFailed],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ErrorSystemRequirementFailedModule {}
