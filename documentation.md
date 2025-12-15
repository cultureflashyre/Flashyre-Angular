# Comprehensive Project Documentation

## 1. Overview

This document provides a comprehensive and detailed overview of the Flashyre-Angular application, covering its architecture, user workflows, and a page-by-page breakdown of its features.

## 2. Technology Stack

### 2.1. Frontend

*   **Framework:** Angular (~18.1.0)
*   **UI Components:** Angular Material (~18.1.0)
*   **State Management:** RxJS (~7.8.2)
*   **Authentication:**
    *   `@abacritt/angularx-social-login` (~2.3.0) for social logins.
    *   `@auth0/angular-jwt` (~5.2.0) for handling JSON Web Tokens (JWT).
*   **Charting:** `chart.js` (~4.5.0) for data visualization.
*   **Real-time Communication:** `socket.io-client` (~4.8.1) for live updates.
*   **Other Key Libraries:**
    *   `ngx-spinner`: For loading indicators.
    *   `ngx-markdown`: To render markdown content.
    *   `file-saver`, `jspdf`, `xlsx`: For exporting data.

### 2.2. Backend

*   **Framework:** Django (~4.2.20)
*   **API:** Django REST Framework (~3.15.2)
*   **Database:** MySQL (`mysqlclient`)
*   **Authentication:** `djangorestframework-simplejwt` (~5.5.0) for JWTs.
*   **CORS:** `django-cors-headers` (~4.7.0)
*   **Cloud Storage:** `google-cloud-storage` (~3.1.0) and `django-storages` (~1.14.5).
*   **Web Server:** `gunicorn` (~20.1.0)

## 3. Inferred Database Structure

Based on the application's features and frontend services, the database likely includes the following tables:

*   **User:** Stores user information for candidates, recruiters, and administrators, with role-based access control.
*   **JobPosting:** Contains details about job postings, such as title, description, and requirements.
*   **CandidateProfile:** Stores detailed information about candidates, including their employment history, education, and certifications.
*   **JobApplication:** Links candidates to job postings they have applied for.
*   **Assessment:** Stores information about assessments, such as the title, description, and questions.
*   **CandidateScore:** Stores the scores of candidates for different assessments, linked to both the candidate and the assessment.

## 4. User Workflows

### 4.1. Candidate Workflow

The candidate workflow is designed to guide users through the process of finding and applying for jobs, taking assessments, and managing their profiles.

### 4.2. Recruiter Workflow

The recruiter workflow provides tools for managing job postings, tracking applicants, and moving candidates through the hiring pipeline.

### 4.3. Admin Workflow

The admin workflow offers a high-level view of the application, with access to analytics, user management, and all recruiter functionalities.

## 5. Page-by-Page Documentation

### 5.1. Candidate Pages

#### 5.1.1. Login Page (`login-candidate`)

*   **Purpose:** Provides the primary authentication interface for all user types (candidates, recruiters, and admins).
*   **Features:**
    *   Email and password login form with validation.
    *   Google Sign-In option for candidates.
    *   "Forgot Password" link.
    *   Toggles password visibility.
*   **Workflow:**
    *   Upon successful login, the `log-in-page` component's `handleRedirection` function is called.
    *   **Candidates** are redirected to `/candidate-home`.
    *   **Recruiters** are redirected to `/job-post-list`.
    *   **Standard Admins** are redirected to `/recruiter-workflow-candidate`.
    *   **Super Admins** are redirected to `/recruiter-super-admin-analytical-module`.

#### 5.1.2. Signup Page (`signup-candidate`)

*   **Purpose:** Allows new candidates to create an account.
*   **Features:**
    *   Form for first name, last name, email, and password with validation.
    *   Google Sign-Up option.
    *   Links to the login page.
*   **Workflow:**
    *   After successful signup, the user is redirected to the login page to authenticate.

#### 5.1.3. Candidate Home (`candidate-home`)

*   **Purpose:** Serves as the candidate's main dashboard, displaying recommended jobs.
*   **Features:**
    *   Displays a list of "Jobs For You" using the `candidate-job-for-you-card` component.
    *   Provides a search and filter bar (`candidate-jobs-for-you-search-and-filter-bar`) to refine the job list.
    *   Includes a navigation bar (`navbar-for-candidate-view`) with links to other candidate-specific pages.
*   **Workflow:**
    *   This is the first page a candidate sees after logging in.
    *   From here, a candidate can view job details, manage their profile, or start an assessment.

#### 5.1.4. Candidate Job Detail View (`candidate-job-detail-view`)

*   **Purpose:** Displays the full details of a single job posting.
*   **Features:**
    *   Uses the `candidate-job-details` component to show the job title, description, required skills, and other relevant information.
    *   Provides an "Apply Now" button.
    *   Allows the candidate to "dislike" a job, which is then cached to prevent it from being shown again.
*   **Workflow:**
    *   Candidates navigate to this page from the `candidate-home` page by clicking on a job card.
    *   After applying, the candidate may be directed to an assessment or a confirmation page.

#### 5.1.5. Profile Overview Page (`profile-overview-page`)

*   **Purpose:** A multi-step form that guides the candidate through creating or updating their professional profile.
*   **Features:**
    *   **Step 1: Basic Information:** Captures the candidate's name, email, phone number, profile picture, and resume.
    *   **Step 2: Employment History:** Allows the candidate to add, edit, and delete their work experiences.
    *   **Step 3: Education:** Allows the candidate to add, edit, and delete their educational qualifications.
    *   **Step 5: Certifications:** Allows the candidate to add, edit, and delete any professional certifications.
    *   Uses a progress bar (`progress-bar-step-*`) to show the candidate's completion status.
*   **Workflow:**
    *   Candidates can access this page from the navigation bar.
    *   The form is broken into multiple steps, and the user can navigate between them.
    *   The page is also used by recruiters, with slightly different navigation logic.

#### 5.1.6. Candidate Assessment Page (`candidate-assessment`)

*   **Purpose:** Displays a list of available assessments for the candidate.
*   **Features:**
    *   Lists all assessments with their titles and descriptions.
    *   Provides a search bar to filter assessments.
    *   Includes a "Start Assessment" button for each assessment.
    *   Displays the candidate's profile summary.
*   **Workflow:**
    *   After a candidate applies for a job, they may be directed to this page to complete an assessment.
    *   Clicking "Start Assessment" navigates the user to the `flashyre-assessment-rules-card` page.

#### 5.1.7. Assessment Rules Card (`flashyre-assessment-rules-card`)

*   **Purpose:** Displays the rules, instructions, and system requirements for an assessment before the candidate begins.
*   **Features:**
    *   Uses the `flashyre-assessment-rules` component to detail the assessment's rules.
    *   Includes a button to start the assessment.
*   **Workflow:**
    *   This page acts as a final checkpoint before the assessment starts.
    *   After reviewing the rules, the candidate can proceed to the `coding-assessment` page.

#### 5.1.8. Coding Assessment Page (`coding-assessment`)

*   **Purpose:** Provides the environment for the candidate to complete a coding assessment.
*   **Features:**
    *   **Problem Description:** Displays the coding problem and its requirements using the `problem-description` component.
    *   **Code Editor:** Includes a code editor (`code-editor` component) with support for multiple languages.
    *   **Test Cases:** Shows the test cases that the submitted code will be evaluated against.
    *   **Submission:** Allows the candidate to run and submit their code.
*   **Workflow:**
    *   This is the main assessment interface.
    *   After submitting their solution, the candidate is redirected to a results or confirmation page, such as `assessment-taken-page`.

#### 5.1.9. Assessment Taken Page (`assessment-taken-page`)

*   **Purpose:** Confirms to the candidate that their assessment has been successfully submitted.
*   **Features:**
    *   Displays a confirmation message.
    *   Provides a button to return to the candidate dashboard.
*   **Workflow:**
    *   This is the final page in the assessment workflow for the candidate.
    *   From here, the candidate returns to their dashboard to continue browsing jobs.

### 5.2. Recruiter & Admin Pages

#### 5.2.1. Job Post List (`job-post-list`)

*   **Purpose:** Displays a list of all job postings for recruiters and admins.
*   **Features:**
    *   Uses the `recruiter-company-job-card` component to display each job with its title, status, and number of applicants.
    *   Provides a search bar to filter job postings.
    *   Includes a "Create New Job" button that navigates to the `create-job` page.
*   **Workflow:**
    *   This is the main landing page for recruiters.
    *   From here, a recruiter can view the status of their job postings, create a new one, or click on a job to view its applicants.

#### 5.2.2. Create Job Page (`create-job`)

*   **Purpose:** A multi-functional form for creating, editing, and saving job postings.
*   **Features:**
    *   **Manual and Automatic Input:** Supports both manual input and automatic population of fields by uploading a job description file.
    *   **Validation:** Includes robust validation for all fields.
    *   **Suggestions:** Provides skill and location suggestions.
    *   **Rich Text Editor:** Includes a rich text editor for the job description.
    *   **Multi-Step Process:** The job creation process is broken down into four steps, with this page being the first.
*   **Workflow:**
    *   Recruiters and admins can access this page from the `job-post-list` page.
    *   After filling out the initial details, the user proceeds to the next steps (`create-job-step2`, `create-job-step3`, `create-job-step4`) to complete the job posting.

#### 5.2.3. Recruiter ATS (`recruiter-workflow-ats`)

*   **Purpose:** A Kanban-style drag-and-drop interface for managing candidates through the hiring pipeline.
*   **Features:**
    *   **Pipeline Stages:** Displays candidates in different stages of the hiring process (Sourced, Screening, Submission, Interview, Offer, Hired, Rejected).
    *   **Drag-and-Drop:** Allows recruiters to move candidates between stages by dragging and dropping their cards.
    *   **Job Switching:** A dropdown menu allows recruiters to switch between different job postings.
    *   **Candidate Details:** Clicking on a candidate card opens a modal with their detailed profile.
    *   **Reporting:** Recruiters can export a report of candidates in a specific stage to Excel.
*   **Workflow:**
    *   Recruiters access this page by clicking on a job posting from the `job-post-list` page.
    *   This page is the central hub for managing the entire recruitment process for a specific job.

#### 5.2.4. Recruiter Workflow Candidate (`recruiter-workflow-candidate`)

*   **Purpose:** Serves as the main dashboard for standard admins, providing an overview of all candidates in the system.
*   **Features:**
    *   Displays a searchable and filterable list of all candidates.
    *   Provides options to view a candidate's profile and their application history.
    *   Includes a navigation bar (`recruiter-workflow-navbar`) for accessing other admin functionalities.
*   **Workflow:**
    *   This is the first page a standard admin sees after logging in.
    *   From here, an admin can manage candidates, clients, and job requirements.

#### 5.2.5. Super Admin Analytical Module (`recruiter-super-admin-analytical-module`)

*   **Purpose:** Provides a high-level analytical dashboard for super admins.
*   **Features:**
    *   **Data Visualization:** Includes charts and graphs to display key metrics, such as the number of job postings, candidate applications, and hiring trends.
    *   **Reporting:** Allows super admins to generate and download comprehensive reports.
    *   **User Management:** May include features for managing user accounts and permissions.
*   **Workflow:**
    *   This is the first page a super admin sees after logging in.
    *   It provides a strategic overview of the entire recruitment process and the platform's performance.

## 6. Key Reusable Components

### 6.1. `log-in-page`

*   **Purpose:** Provides a reusable authentication form that is used by the main `login-candidate` page.
*   **Features:**
    *   Handles both candidate and corporate (recruiter/admin) login logic.
    *   Integrates with the `SocialAuthService` for Google Sign-In.
    *   Emits a `loginSubmit` event upon successful authentication.

### 6.2. Navigation Bars

*   **`navbar-for-candidate-view`:** The main navigation bar for candidates, providing links to their dashboard, profile, and assessments.
*   **`navbar-for-recruiter-view`:** The navigation bar for recruiters, with links to the job post list and other recruiter-specific pages.
*   **`navbar-for-admin-view`:** The navigation bar for admins, providing access to all admin and recruiter functionalities.
*   **`recruiter-workflow-navbar`:** A specialized navigation bar for the admin workflow pages, allowing admins to switch between managing candidates, requirements, and clients.

### 6.3. Profile Components

*   **`profile-basicinformation-component`:** A form for collecting and displaying a candidate's basic personal information.
*   **`profile-employment-component`:** Allows candidates to add, edit, and delete their work experience.
*   **`profile-education-component`:** A form for managing a candidate's educational qualifications.
*   **`profile-certifications-component`:** Allows candidates to list their professional certifications.
*   **`candidate-profile-short`:** A compact component that displays a summary of a candidate's profile, used in various parts of the application.

### 6.4. Job Posting Components

*   **`candidate-job-for-you-card`:** A card component used on the candidate dashboard to display a summary of a recommended job.
*   **`candidate-job-details`:** A detailed view of a job posting, including the full description and an "Apply Now" button.
*   **`recruiter-company-job-card`:** A card component used on the recruiter's job post list to display a summary of a job they have posted.

### 6.5. Assessment Components

*   **`flashyre-assessment-rules`:** Displays the rules and instructions for an assessment.
*   **`problem-description`:** Shows the details of a coding problem.
*   **`code-editor`:** Provides a multi-language code editor for candidates to write their solutions.
*   **`assessment-detailed-results`:** Displays the results of an assessment, including which test cases passed and failed.

## 7. Caching Mechanisms

### 7.1. Frontend Caching

*   **In-Memory Caching:** The `job.service.ts` uses in-memory arrays and objects to cache job listings and details, reducing API calls.
*   **Browser Cache API:** The `candidate-job-details.component.ts` and `candidate-job-for-you-card.component.ts` use the browser's Cache API to store a user's disliked jobs, providing a more responsive experience.

### 7.2. Backend Caching

*   No dedicated caching libraries (e.g., Redis, Memcached) are used.
*   It is possible that Django's built-in caching framework is being used, but this cannot be confirmed without access to the backend code.
