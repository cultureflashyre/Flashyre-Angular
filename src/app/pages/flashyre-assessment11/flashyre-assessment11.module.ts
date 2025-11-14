import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { ComponentsModule } from '../../components/components.module'
import { FlashyreAssessment11 } from './flashyre-assessment11.component'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { NgxSpinnerModule } from 'ngx-spinner'
import { SharedPipesModule } from '../../shared/shared-pipes.module' // Import the shared module
import { FormsModule } from '@angular/forms'
import { AceModule } from 'ngx-ace-wrapper';
import { MarkdownModule } from 'ngx-markdown';

const routes = [
  {
    path: '',
    component: FlashyreAssessment11,
  },
]

@NgModule({ declarations: [FlashyreAssessment11],
    exports: [FlashyreAssessment11],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
         
        RouterModule.forChild(routes),
        NgxSpinnerModule,
        SharedPipesModule, // Add the shared module here
        FormsModule,
        AceModule,
        MarkdownModule.forChild()], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class FlashyreAssessment11Module {}