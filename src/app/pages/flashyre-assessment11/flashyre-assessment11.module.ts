import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { ComponentsModule } from '../../components/components.module'
import { FlashyreAssessment11 } from './flashyre-assessment11.component'
import { HttpClientModule } from '@angular/common/http'
import { NgxSpinnerModule } from 'ngx-spinner'
import { SharedPipesModule } from '../../shared/shared-pipes.module' // Import the shared module
import { FormsModule } from '@angular/forms'
import { AssessmentDeactivateGuard } from '../../guards/assessment-deactivate.gaurd';

const routes = [
  {
    path: '',
    component: FlashyreAssessment11,
    canDeactivate: [AssessmentDeactivateGuard],
  },
]

@NgModule({
  declarations: [FlashyreAssessment11], // Remove TimerFormatPipe from here
  imports: [
    CommonModule, 
    ComponentsModule, 
    RouterModule.forChild(routes), 
    HttpClientModule,
    NgxSpinnerModule,
    SharedPipesModule, // Add the shared module here
    FormsModule
  ],
  exports: [FlashyreAssessment11],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [AssessmentDeactivateGuard],
})
export class FlashyreAssessment11Module {}