import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { FlashyreAssessmentRulesCard } from './flashyre-assessment-rules-card.component'

const routes = [
  {
    path: '',
    component: FlashyreAssessmentRulesCard,
  },
]

@NgModule({
  declarations: [FlashyreAssessmentRulesCard],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [FlashyreAssessmentRulesCard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FlashyreAssessmentRulesCardModule {}
