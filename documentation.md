# Project Documentation

## Frontend

### Overview

The frontend is a single-page application (SPA) built with **Angular**. It provides a user interface for candidates, recruiters, and administrators to manage job postings, applications, and assessments.

### Technologies Used

*   **Framework:** Angular (~18.1.0)
*   **UI Components:** Angular Material (~18.1.0)
*   **State Management:** RxJS (~7.8.2)
*   **Authentication:**
    *   `@abacritt/angularx-social-login` (~2.3.0) for social logins (e.g., Google).
    *   `@auth0/angular-jwt` (~5.2.0) for handling JSON Web Tokens (JWT).
*   **Charting:** `chart.js` (~4.5.0) for data visualization.
*   **Real-time Communication:** `socket.io-client` (~4.8.1) for features like notifications or live updates.
*   **Other Key Libraries:**
    *   `ngx-spinner`: For loading indicators.
    *   `ngx-markdown`: To render markdown content.
    *   `file-saver`, `jspdf`, `xlsx`: For exporting data to different formats.

### Project Structure

The `src/app` directory is organized as follows:

*   `pages/`: Contains the main pages of the application, such as login, candidate dashboard, and job creation.
*   `components/`: Contains reusable UI components shared across different pages.
*   `services/`: Contains services responsible for business logic and API communication.
*   `guards/`: Implements route guards to protect routes based on user authentication and roles.
*   `interceptors/`: Includes HTTP interceptors to modify incoming or outgoing HTTP requests (e.g., adding authentication tokens).
*   `pipe/`: Custom data transformation pipes.
*   `shared/`: Shared modules and other common utilities.

### Pages and Features

The application consists of several pages, categorized by user role:

#### 1. Authentication
*   **Login/Signup:** Separate login and signup pages for candidates and recruiters.
*   **Password Management:** forgot/reset password functionality.

#### 2. Candidate
*   **Dashboard:** A central hub for candidates to view job postings and manage their applications.
*   **Job Details:** Detailed view of a specific job posting.
*   **Profile Management:** Pages for candidates to build and update their profiles, including basic information, employment history, and certifications.
*   **Assessments:**
    *   **Coding Assessment:** An interface for taking coding tests.
    *   **Assessment Rules & Violation Handling:** Pages to display assessment rules and handle violations.

#### 3. Recruiter & Admin
*   **Dashboard/Analytics:** A dashboard for recruiters and super admins with analytics and data visualizations.
*   **Job Posting Management:** A complete workflow for creating, viewing, and managing job postings.
*   **Applicant Tracking System (ATS):**
    *   **Candidate Viewing:** View a list of candidates who have applied for a job.
    *   **Application Review:** Review and manage job applications.
*   **Candidate Scores:** A page for administrators to view candidate assessment scores.

## Backend

### Overview

The backend is a RESTful API built with **Django** and the **Django REST Framework**. It handles business logic, data storage, and authentication.

### Technologies Used

*   **Framework:** Django (~4.2.20)
*   **API:** Django REST Framework (~3.15.2)
*   **Database:** MySQL (inferred from `mysqlclient` dependency)
*   **Authentication:** `djangorestframework-simplejwt` (~5.5.0) for JWT-based authentication.
*   **CORS:** `django-cors-headers` (~4.7.0) to manage Cross-Origin Resource Sharing.
*   **Cloud Storage:** `google-cloud-storage` (~3.1.0) and `django-storages` (~1.14.5) for file storage (e.g., resumes, profile pictures).
*   **Web Server:** `gunicorn` (~20.1.0) for running the application in a production environment.

### API Structure

The API likely follows standard REST conventions. Key features include:

*   **Authentication Endpoints:** For user registration, login, and token management (`/api/token/`, `/api/token/refresh/`).
*   **Job Posting Endpoints:** CRUD (Create, Read, Update, Delete) operations for job postings.
*   **Candidate Profile Endpoints:** To manage candidate profiles, including personal information, employment history, and certifications.
*   **Application Endpoints:** For submitting and managing job applications.
*   **Assessment Endpoints:** To handle assessment-related data, such as questions, submissions, and scores.

### Database Structure (Inferred)

Based on the application's features, the database likely includes the following tables:

*   `User`: Stores user information for candidates, recruiters, and administrators, with role-based access control.
*   `JobPosting`: Contains details about job postings, such as title, description, and requirements.
*   `CandidateProfile`: Stores detailed information about candidates.
*   `JobApplication`: Links candidates to job postings they have applied for.
*   `Assessment`: Stores information about assessments.
*   `CandidateScore`: Stores the scores of candidates for different assessments.

## Summary

This document provides a comprehensive overview of the Flashyre-Angular application, covering both the frontend and backend components. The project is a modern, full-stack application designed for recruitment, with features for job posting, candidate management, and assessments. The frontend is built with Angular, and the backend is a Django REST API with a MySQL database.
