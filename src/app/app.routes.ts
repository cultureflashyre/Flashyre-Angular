import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { authGuard } from './guards/auth.guard';
import { AppComponent } from './app.component'
import { BufferPage } from './buffer-page/buffer-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BufferInterceptor } from './interceptors/buffer.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BufferService } from './services/buffer.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';
//import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/index/index.component').then((m) => m.Index),
  },
  {
    path: 'profile-education-page-duplicate',
    loadChildren: () =>
      import(
        './pages/profile-education-page-duplicate/profile-education-page-duplicate.component'
      ).then((m) => m.ProfileEducationPageDuplicate),
  },
  {
    path: 'login-college',
    loadChildren: () =>
      import('./pages/login-college/login-college.component').then(
        (m) => m.LoginCollege
      ),
  },
  {
    path: 'profile-basic-information',
    loadChildren: () =>
      import('./pages/profile-basic-information/profile-basic-information.component').then(
        (m) => m.ProfileBasicInformation),
     // Protect this route
  },
  {
    path: 'recruiter-view-3rd-page',
    loadChildren: () =>
      import(
        './pages/recruiter-view-3rd-page/recruiter-view-3rd-page.component'
      ).then((m) => m.RecruiterView3rdPage),
      
  },
  {
    path: 'job-post-list',
    loadChildren: () =>
      import(
        './pages/job-post-list/job-post-list.component'
      ).then((m) => m.RecruiterView3rdPage1),
      canActivate: [authGuard],
      data: { roles: ['recruiter','admin'] },
      
  },
  {
    path: 'recruiter-view-job-applications-1',
    loadChildren: () =>
      import(
        './pages/recruiter-view-job-applications-1/recruiter-view-job-applications-1.component'
      ).then((m) => m.RecruiterViewJobApplications1),
            canActivate: [authGuard],
      data: { roles: ['recruiter','admin'] },
  },
  {
    path: 'signup-candidate',
    loadChildren: () =>
      import('./pages/signup-candidate/signup-candidate.component').then(
        (m) => m.SignupCandidate
      ),
  },
  {
    path: 'signup-admin',
    loadChildren: () =>
      import('./pages/signup-admin/signup-admin.component').then(
        (m) => m.SignupAdmin
      ),
  },
  {
    path: 'signup-corporate',
    loadChildren: () =>
      import('./pages/signup-corporate/signup-corporate.component').then(
        (m) => m.SignupCorporate
      ),
  },
  {
    path: 'login-forgot-password',
    loadChildren: () =>
      import('./pages/login-forgot-password/login-forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'login-reset-password',
    loadChildren: () =>
      import('./pages/login-reset-password/login-reset-password.component').then(
        (m) => m.LoginResetPasswordComponent
      ),
  },
  {
    path: 'profile-employment-page',
    loadChildren: () =>
      import(
        './pages/profile-employment-page/profile-employment-page.component'
      ).then((m) => m.ProfileEmploymentPage),
  },
  {
    path: 'candidate-job-detail-view',
    loadChildren: () =>
      import(
        './pages/candidate-job-detail-view/candidate-job-detail-view.component'
      ).then((m) => m.CandidateJobDetailView
    ), 
    canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'login-candidate',
    loadChildren: () =>
      import('./pages/login-candidate/login-candidate.component').then(
        (m) => m.LoginCandidate
      ),
  },
  {
    path: 'login-admin',
    loadChildren: () =>
      import('./pages/login-admin/login-admin.component').then(
        (m) => m.LoginAdmin
      ),
  },
  {
    path: 'login-corporate',
    loadChildren: () =>
      import('./pages/login-corporate/login-corporate.component').then(
        (m) => m.LoginCorporate
      ),
  },
  {
    path: 'corporate/recruiter-view-5th-page',
    loadChildren: () =>
      import(
        './pages/recruiter-view-5th-page/recruiter-view-5th-page.component'
      ).then((m) => m.RecruiterView5thPage),
      canActivate: [authGuard],
      data: { roles: ['recruiter'] },
  },
  {
    path: 'candidate-home',
    loadChildren: () =>
      import('./pages/candidate-home/candidate-home.component').then(
        (m) => m.CandidateHome
      ), 
      canActivate: [authGuard],
      data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'profile-certification-page',
    loadChildren: () =>
      import(
        './pages/profile-certification-page/profile-certification-page.component'
      ).then((m) => m.ProfileCertificationPage),
  },

  {
    path: 'signup-college',
    loadChildren: () =>
      import('./pages/signup-college/signup-college.component').then(
        (m) => m.SignupCollege
      ),
  },
  {
    path: 'flashyre-assessment-rules-card',
    loadChildren: () =>
      import(
        './pages/flashyre-assessment-rules-card/flashyre-assessment-rules-card.component'
      ).then((m) => m.FlashyreAssessmentRulesCard
    ),     canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },

  {
    path: 'candidate-dashboard',
    loadChildren: () =>
      import('./pages/candidate-dashboard/candidate-dashboard.component').then(
        (m) => m.CandidateDashboard
      ),     canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'error-system-requirement-failed',
    loadChildren: () =>
      import('./pages/error-system-requirement-failed/error-system-requirement-failed.component').then(
        (m) => m.ErrorSystemRequirementFailed
      ),
  },
  {
    path: 'flashyre-assessment11', // New route
    loadChildren: () =>
      import('./pages/flashyre-assessment11/flashyre-assessment11.component').then(
        (m) => m.FlashyreAssessment11
      ),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'profile-last-page1', // New route
    loadChildren: () =>
    import('./pages/profile-last-page1/profile-last-page1.component').then(
      (m) => m.ProfileLastPage1
    ),
  },   
  {
    path: 'candidate-assessment', // New route
    loadChildren: () =>
      import('./pages/candidate-assessment/candidate-assessment.component').then(
        (m) => m.CandidateAssessment
      ),
      canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'assessment-taken-page', // New route
    loadChildren: () =>
      import('./pages/assessment-taken-page/assessment-taken-page.component').then(
        (m) => m.AssessmentTakenPage
      ),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
  {
    path: 'buffer-page', // New route
    loadChildren: () =>
      import('./buffer-page/buffer-page.component').then(
        (m) => m.BufferPage
      ),
  },
  {
    path: 'profile-overview-page',
    loadChildren: () =>
      import( './pages/profile-overview-page/profile-overview-page.component'
      ).then((m) => m.ProfileOverviewPage),
  },
    {
    path: 'assessment-taken-page-2/:assessmentId',
    loadChildren: () =>
      import( './pages/assessment-taken-page-2/assessment-taken-page-2.component'
      ).then((m) => m.AssessmentTakenPage2),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
      {
    path: 'assessment-taken-page-3',
    loadChildren: () =>
      import( './pages/assessment-taken-page-3/assessment-taken-page-3.component'
      ).then((m) => m.AssessmentTakenPage3),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
        {
    path: 'assessment-violation-message',
    loadChildren: () =>
      import( './pages/assessment-violation-message/assessment-violation-message.component'
      ).then((m) => m.AssessmentViolationMessage),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
  {
    path: 'admin-page1',
    loadChildren: () =>
      import('./pages/admin-page1/admin-page1.component').then(
        (m) => m.AdminPage1),
           canActivate: [authGuard],
    data: { roles: ['admin'] },
  },
  
  {
  path: 'create-job',
  loadChildren: () => import('./pages/create-job/create-job.component').then(
        (m) => m.AdminCreateJobStep1Component),
                  canActivate: [authGuard],
    data: { roles: ['admin', 'recruiter'] },
},
{
  path: 'create-job-step2',
  loadChildren: () => import('./pages/create-job-step2/create-job-step2.component').then(m => m.AdminCreateJobStep2),
  canActivate: [authGuard]
},
{
  path: 'create-job-step3',
  loadChildren: () => import('./pages/create-job-step3/create-job-step3.component').then(m => m.AdminCreateJobStep3),
  canActivate: [authGuard]
},
{
  path: 'create-job-step4',
  loadChildren: () => import('./pages/create-job-step4/create-job-step4.component').then(m => m.AdminCreateJobStep4Component),
  canActivate: [authGuard]
},
{
  path: 'admin-candidate-scores',
  loadChildren: () => import('./pages/admin-candidate-scores-page/admin-candidate-scores-page.component').then(m => m.AdminCandidateScoresPageComponent),
  canActivate: [authGuard] // Or any other guards you need
},
  {
  path: 'coding-assessment',
  loadChildren: () =>
    import('./pages/coding-assessment/coding-assessment.component').then(
      (m) => m.CodingAssessment
    ),
},
  {
    path: '**',
    loadChildren: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFound
      ),
  },
]