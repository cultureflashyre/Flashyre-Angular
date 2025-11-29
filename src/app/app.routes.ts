// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
    path: '',
    loadComponent: () => import('./pages/index/index.component').then(m => m.Index),
  },
  {
    path: 'profile-basic-information',
    loadComponent: () =>
      import('./pages/profile-basic-information/profile-basic-information.component').then(
        (m) => m.ProfileBasicInformation),
     // Protect this route
  },
  {
    path: 'job-post-list',
    loadComponent: () =>
      import(
        './pages/job-post-list/job-post-list.component'
      ).then((m) => m.RecruiterView3rdPage1),
      canActivate: [authGuard],
      data: { roles: ['recruiter','admin'] },
      
  },
  {
    path: 'recruiter-view-job-applications-1/:jobId',
    loadComponent: () =>
      import(
        './pages/recruiter-view-job-applications-1/recruiter-view-job-applications-1.component'
      ).then((m) => m.RecruiterViewJobApplications1),
            canActivate: [authGuard],
      data: { roles: ['recruiter','admin'] },
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup-candidate/signup-candidate.component').then(
        (m) => m.SignupCandidate
      ),
  },


  {
    path: 'login-forgot-password',
    loadComponent: () =>
      import('./pages/login-forgot-password/login-forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'login-reset-password',
    loadComponent: () =>
      import('./pages/login-reset-password/login-reset-password.component').then(
        (m) => m.LoginResetPasswordComponent
      ),
  },
  {
    path: 'profile-employment-page',
    loadComponent: () =>
      import(
        './pages/profile-employment-page/profile-employment-page.component'
      ).then((m) => m.ProfileEmploymentPage),
  },
  {
    path: 'candidate-job-detail-view',
    loadComponent: () =>
      import(
        './pages/candidate-job-detail-view/candidate-job-detail-view.component'
      ).then((m) => m.CandidateJobDetailView
    ), 
    canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login-candidate/login-candidate.component').then(
        (m) => m.LoginCandidate
      ),
  },

  {
    path: 'candidate-home',
    loadComponent: () =>
      import('./pages/candidate-home/candidate-home.component').then(
        (m) => m.CandidateHome
      ), 
      canActivate: [authGuard],
      data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'profile-certification-page',
    loadComponent: () =>
      import(
        './pages/profile-certification-page/profile-certification-page.component'
      ).then((m) => m.ProfileCertificationPage),
  },

  {
    path: 'flashyre-assessment-rules-card',
    loadComponent: () =>
      import(
        './pages/flashyre-assessment-rules-card/flashyre-assessment-rules-card.component'
      ).then((m) => m.FlashyreAssessmentRulesCard
    ),     canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'candidate-dashboard',
    loadComponent: () =>
      import('./pages/candidate-dashboard/candidate-dashboard.component').then(
        (m) => m.CandidateDashboard
      ),     canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'error-system-requirement-failed',
    loadComponent: () =>
      import('./pages/error-system-requirement-failed/error-system-requirement-failed.component').then(
        (m) => m.ErrorSystemRequirementFailed
      ),
  },
  {
    path: 'flashyre-assessment11', // New route
    loadComponent: () =>
      import('./pages/flashyre-assessment11/flashyre-assessment11.component').then(
        (m) => m.FlashyreAssessment11
      ),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'profile-last-page1', // New route
    loadComponent: () =>
    import('./pages/profile-last-page1/profile-last-page1.component').then(
      (m) => m.ProfileLastPage1
    ),
  },   
  {
    path: 'candidate-assessment', // New route
    loadComponent: () =>
      import('./pages/candidate-assessment/candidate-assessment.component').then(
        (m) => m.CandidateAssessment
      ),
      canActivate: [authGuard],
    data: { roles: ['candidate'] },  // Protect this route
  },
  {
    path: 'assessment-taken-page', // New route
    loadComponent: () =>
      import('./pages/assessment-taken-page/assessment-taken-page.component').then(
        (m) => m.AssessmentTakenPage
      ),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
  {
    path: 'buffer-page', // New route
    loadComponent: () =>
      import('./buffer-page/buffer-page.component').then(
        (m) => m.BufferPage
      ),
  },
  {
    path: 'profile-overview-page',
    loadComponent: () =>
      import( './pages/profile-overview-page/profile-overview-page.component'
      ).then((m) => m.ProfileOverviewPage),
  },
    {
    path: 'assessment-taken-page-2/:assessmentId',
    loadComponent: () =>
      import( './pages/assessment-taken-page-2/assessment-taken-page-2.component'
      ).then((m) => m.AssessmentTakenPage2),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
      {
    path: 'assessment-taken-page-3',
    loadComponent: () =>
      import( './pages/assessment-taken-page-3/assessment-taken-page-3.component'
      ).then((m) => m.AssessmentTakenPage3),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
        {
    path: 'assessment-violation-message',
    loadComponent: () =>
      import( './pages/assessment-violation-message/assessment-violation-message.component'
      ).then((m) => m.AssessmentViolationMessage),
          canActivate: [authGuard],
    data: { roles: ['candidate'] },
  },
  {
    path: 'admin-page1',
    loadComponent: () =>
      import('./pages/admin-page1/admin-page1.component').then(
        (m) => m.AdminPage1),
           canActivate: [authGuard],
    data: { roles: ['admin'] },
  },
    {
  path: 'job-posting-workflow',
  loadComponent: () => import('./pages/job-posting-workflow/job-posting-workflow.component').then(
        (m) => m.JobPostingWorkflowComponent),
                  canActivate: [authGuard],
    data: { roles: ['admin', 'recruiter'] },
},
  {
  path: 'create-job',
  loadComponent: () => import('./pages/create-job/create-job.component').then(
        (m) => m.AdminCreateJobStep1Component),
                  canActivate: [authGuard],
    data: { roles: ['admin', 'recruiter'] },
},
  {
    // This route handles the "edit" case, e.g., /create-job/12345
    path: 'create-job/:id',
    loadComponent: () => import('./pages/create-job/create-job.component').then(
      (m) => m.AdminCreateJobStep1Component
    ),
    canActivate: [authGuard],
    data: { roles: ['admin', 'recruiter'] },
  },
{
  path: 'create-job-step2',
  loadComponent: () => import('./pages/create-job-step2/create-job-step2.component').then(m => m.AdminCreateJobStep2),
  canActivate: [authGuard]
},
{
  path: 'create-job-step3',
  loadComponent: () => import('./pages/create-job-step3/create-job-step3.component').then(m => m.AdminCreateJobStep3),
  canActivate: [authGuard]
},
{
  path: 'create-job-step4',
  loadComponent: () => import('./pages/create-job-step4/create-job-step4.component').then(m => m.AdminCreateJobStep4Component),
  canActivate: [authGuard]
},
{
  path: 'admin-candidate-scores',
  loadComponent: () => import('./pages/admin-candidate-scores-page/admin-candidate-scores-page.component').then(m => m.AdminCandidateScoresPageComponent),
  canActivate: [authGuard] // Or any other guards you need
},
  {
  path: 'coding-assessment',
  loadComponent: () =>
    import('./pages/coding-assessment/coding-assessment.component').then(
      (m) => m.CodingAssessment
    ),
},
{
    path: 'recruiter-super-admin-analytical-module',
    loadComponent: () =>
      import('./pages/recruiter-super-admin-analytical-module/recruiter-super-admin-analytical-module.component').then(
        (m) => m.recruiter-super-admin-analytical-module
      ),
  },
  {
  path: 'recruiter-workflow',
  loadComponent: () =>
    import('./pages/recruiter-workflow/recruiter-workflow.component').then(
      (m) => m.recruiter-workflow
    ),
},
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFound
      ),
  },
];