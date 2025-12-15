# Project Documentation

## 1. Overview

This document provides a comprehensive overview of the Flashyre-Angular application, covering both the frontend and backend components. The project is a modern, full-stack application designed for recruitment, with features for job posting, candidate management, and assessments.

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

1.  **Authentication:** The candidate can sign up or log in.
2.  **Dashboard:** After logging in, the candidate is redirected to a dashboard where they can view job postings and manage their applications.
3.  **Profile Management:** The candidate can create and update their profile with personal information, employment history, and certifications.
4.  **Assessments:** The candidate can take coding assessments and view their results.

### 4.2. Recruiter & Admin Workflow

1.  **Authentication:** Recruiters and admins log in through a separate portal.
2.  **Dashboard/Analytics:** They are presented with a dashboard that includes analytics and data visualizations.
3.  **Job Posting Management:** They can create, view, and manage job postings.
4.  **Applicant Tracking System (ATS):** They can view and manage job applications, and move candidates through the hiring pipeline.

## 5. Detailed Page Functionalities

### 5.1. Login Page (`login-candidate.component.ts`)

*   **Functionality:** Handles user authentication.
*   **Features:**
    *   Stores the JWT in local storage upon successful login.
    *   Fetches the user's profile.
    *   Redirects the user to the appropriate dashboard based on their role.

### 5.2. Candidate Dashboard (`candidate-dashboard.component.ts` & `flashyre-dashboard.component.ts`)

*   **Functionality:** Serves as the main hub for candidates.
*   **Features:**
    *   Provides a button or link to start an assessment.
    *   Checks for system requirements (non-mobile device, audio/video) before starting an assessment.

### 5.3. Recruiter ATS (`recruiter-workflow-ats.component.ts`)

*   **Functionality:** A Kanban-style drag-and-drop interface for managing candidates.
*   **Features:**
    *   **Job Switching:** Allows recruiters to switch between different job postings.
    *   **Permission-Based Actions:** Restricts actions based on user roles and permissions.
    *   **Stage-Specific Modals:** Provides modals for scheduling interviews and recording rejection reasons.
    *   **Candidate Management:** Allows recruiters to add candidates to the pipeline and view their profiles.
    *   **Reporting:** Allows recruiters to export stage-specific reports to Excel.

### 5.4. Admin Candidate Scores Page (`admin-candidate-scores-page.component.ts`)

*   **Functionality:** Allows an admin to view a list of candidates with their assessment scores for a specific job.
*   **Features:**
    *   **Sorting:** Candidates can be sorted by score or name.
    *   **Bulk Download:** The list of selected candidates can be downloaded as an Excel file.
    *   **Resume Download:** Individual candidate resumes can be downloaded.

### 5.5. Create Job Page (`create-job.component.ts`)

*   **Functionality:** A multi-functional form for creating, editing, and saving job postings.
*   **Features:**
    *   **Manual and Automatic Input:** Supports both manual input and automatic population of fields by uploading a job description file.
    *   **Validation:** Includes robust validation for all fields.
    *   **Suggestions:** Provides skill and location suggestions.
    *   **Rich Text Editor:** Includes a rich text editor for the job description.

### 5.6. Candidate Assessment Page (`candidate-assessment.component.ts`)

*   **Functionality:** Displays a list of available assessments to the candidate.
*   **Features:**
    *   **Search:** Candidates can search for a specific assessment.
    *   **Description:** The description of each assessment can be viewed.
    *   **Start Assessment:** Candidates can start an assessment.

### 5.7. Profile Overview Page (`profile-overview-page.component.ts`)

*   **Functionality:** A multi-step form that guides the user through the process of creating and updating their profile.
*   **Features:**
    *   **Multi-Step Form:** The form is broken down into several steps, including basic information, employment history, education, and certifications.
    *   **Navigation:** A navigation bar allows the user to move between steps.
    *   **Validation:** Includes validation and error handling to ensure data integrity.

## 6. Caching Mechanisms

### 6.1. Frontend Caching

*   **In-Memory Caching:** The `job.service.ts` uses in-memory arrays and objects to cache job listings and details, reducing API calls.
*   **Browser Cache API:** The `candidate-job-details.component.ts` and `candidate-job-for-you-card.component.ts` use the browser's Cache API to store a user's disliked jobs, providing a more responsive experience.

### 6.2. Backend Caching

*   No dedicated caching libraries (e.g., Redis, Memcached) are used.
*   It is possible that Django's built-in caching framework is being used, but this cannot be confirmed without access to the backend code.
