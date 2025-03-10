import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'; // 

import { ComponentsModule } from '../../components/components.module'
import { ErrorSystemRequirementFailedComponent } from './error-system-requirement-failed.component';

const routes = [
  {
    path: '',
    component: ErrorSystemRequirementFailedComponent,
  },
]

@NgModule({
  declarations: [ErrorSystemRequirementFailedComponent],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes), HttpClientModule],
  exports: [ErrorSystemRequirementFailedComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ErrorSystemRequirementFailedModule {}
















