import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TimerFormatPipe } from '../../pipe/timer-format.pipe'
import { ComponentsModule } from '../../components/components.module'
import { FlashyreAssessment1 } from './flashyre-assessment1.component'
import { HttpClientModule } from '@angular/common/http' // 

const routes = [
  {
    path: '',
    component: FlashyreAssessment1,
  },
]

@NgModule({
  declarations: [FlashyreAssessment1, TimerFormatPipe],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes), HttpClientModule],
  exports: [FlashyreAssessment1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FlashyreAssessment1Module {}