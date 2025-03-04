// pages/university-college-dashboard/university-college-dashboard.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UniversityCollegeDashboardComponent } from './university-college-dashboard.component';

const routes = [
  {
    path: '',
    component: UniversityCollegeDashboardComponent,
  },
];

@NgModule({
  declarations: [UniversityCollegeDashboardComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [UniversityCollegeDashboardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UniversityCollegeDashboardModule {}