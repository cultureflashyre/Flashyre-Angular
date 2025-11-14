import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

 
import { ProfileOverviewPage } from './profile-overview-page.component';

const routes = [
  {
    path: '',
    component: ProfileOverviewPage,
  },
];

@NgModule({
  declarations: [ProfileOverviewPage, ], // Add components to declarations
  imports: [CommonModule,   RouterModule.forChild(routes)],
  exports: [ProfileOverviewPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileOverviewPageModule {}