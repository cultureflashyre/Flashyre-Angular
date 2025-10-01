import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ComponentsModule } from '../../components/components.module';
import { CandidateHome } from './candidate-home.component';

const routes = [
  {
    path: '',
    component: CandidateHome,
  },
];

@NgModule({
  declarations: [CandidateHome],
  imports: [
    CommonModule,
    ComponentsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
  ],
  exports: [CandidateHome],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateHomeModule {}