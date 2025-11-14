import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 import { RouterModule } from '@angular/router';
 import { CommonModule } from '@angular/common';
 
  
 import { ProfileLastPage1 } from './profile-last-page1.component';
 
 const routes = [
   {
     path: '',
     component: ProfileLastPage1,
   },
 ];
 
 @NgModule({
   declarations: [ProfileLastPage1],
   imports: [CommonModule,   RouterModule.forChild(routes)],
   exports: [ProfileLastPage1],
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
 })
 export class ProfileLastPage1Module {}