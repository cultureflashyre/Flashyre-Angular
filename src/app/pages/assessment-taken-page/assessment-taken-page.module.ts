import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AssessmentTakenPage } from './assessment-taken-page.component';
import { FormsModule } from '@angular/forms';


@NgModule({ declarations: [
        AssessmentTakenPage
    ],
    exports: [AssessmentTakenPage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
        
        FormsModule,
        RouterModule.forChild([{ path: '', component: AssessmentTakenPage }])], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AssessmentTakenPageModule {}


