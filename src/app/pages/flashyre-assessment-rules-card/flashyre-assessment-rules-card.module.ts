import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { FlashyreAssessmentRulesCard } from './flashyre-assessment-rules-card.component'

const routes = [
  {
    path: '',
    component: FlashyreAssessmentRulesCard,
  },
]

@NgModule({
  declarations: [FlashyreAssessmentRulesCard],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [FlashyreAssessmentRulesCard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FlashyreAssessmentRulesCardModule {}