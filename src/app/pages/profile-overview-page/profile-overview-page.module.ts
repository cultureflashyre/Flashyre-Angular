import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { ProfileOverviewPage } from './profile-overview-page.component';

const routes = [
  {
    path: '',
    component: ProfileOverviewPage,
  },
];

@NgModule({
  declarations: [ProfileOverviewPage, ],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  exports: [ProfileOverviewPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileOverviewPageModule {}