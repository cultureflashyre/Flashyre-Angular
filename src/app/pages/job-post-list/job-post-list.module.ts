// job-post-list.module.ts

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // <-- IMPORT THIS
import { FormsModule } from '@angular/forms'; 

import { ComponentsModule } from '../../components/components.module';
import { RecruiterView3rdPage1 } from './job-post-list.component';

const routes = [
  {
    path: '',
    component: RecruiterView3rdPage1,
  },
];

@NgModule({
  declarations: [RecruiterView3rdPage1],
  imports: [
    CommonModule,
    FormsModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    HttpClientModule, // <-- ADD THIS TO IMPORTS
  ],
  exports: [RecruiterView3rdPage1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class JobPostListModule {}