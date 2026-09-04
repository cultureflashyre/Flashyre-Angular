// playwright/recruiter-workflow-bulk-import/test-fixtures.ts
import { Page, expect } from '@playwright/test';

/**
 * Valid mock JWT with role 'admin' and future expiration (year 2038)
 */
export const MOCK_ADMIN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzQwMjMwMDc5OSwidXNlcl9pZCI6MSwidXNlcl90eXBlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGZsYXNoeXJlLmNvbSJ9.signature';

/**
 * Valid mock JWT with role 'recruiter' (Alex Recruiter, ID: 102)
 */
export const MOCK_RECRUITER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzQwMjMwMDc5OSwidXNlcl9pZCI6MTAyLCJ1c2VyX3R5cGUiOiJyZWNydWl0ZXIiLCJlbWFpbCI6ImFsZXhAZmxhc2h5cmUuY29tIn0.signature';

export const MOCK_TRACKER_BATCHES = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    file_name: 'c9bf7e45-1234-5678-abcd-ef0123456789_Q3_Tech_Recruitment_Tracker.xlsx',
    file_size: 1048576,
    status: 'COMPLETED',
    total_rows: 150,
    success_rows: 142,
    failed_rows: 8,
    last_processed_row: 150,
    current_sheet_name: 'Frontend Developers',
    processed_sheets: ['Frontend Developers', 'Backend Engineers'],
    uploaded_by_id: '1',
    uploaded_by_name: 'Super Admin',
    uploaded_by_initials: 'SA',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
    file_name: '88a1b2c3-4444-5555-6666-777788889999_Sales_Hiring_Tracker_2026.csv',
    file_size: 524288,
    status: 'COMPLETED_WITH_ERRORS',
    total_rows: 80,
    success_rows: 70,
    failed_rows: 10,
    last_processed_row: 80,
    current_sheet_name: 'Sheet1',
    processed_sheets: ['Sheet1'],
    uploaded_by_id: '102',
    uploaded_by_name: 'Alex Recruiter',
    uploaded_by_initials: 'AR',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const MOCK_RESUME_BATCHES = [
  {
    id: '77777777-8888-9999-aaaa-bbbbccccdddd',
    zip_file_name: '12345678-abcd-ef01-2345-6789abcdef01_Engineering_Resumes_Aug2026.zip',
    file_size: 15728640,
    status: 'COMPLETED',
    total_files: 45,
    extracted_files: 45,
    matched_files: 42,
    unmatched_files: 3,
    uploaded_by_id: '1',
    uploaded_by_name: 'Super Admin',
    uploaded_by_initials: 'SA',
    created_at: new Date(Date.now() - 5400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '33333333-2222-1111-0000-aaaabbbbcccc',
    zip_file_name: '87654321-4321-8765-dcba-1234567890ab_Alex_Design_Resumes.zip',
    file_size: 4194304,
    status: 'COMPLETED',
    total_files: 12,
    extracted_files: 12,
    matched_files: 12,
    unmatched_files: 0,
    uploaded_by_id: '102',
    uploaded_by_name: 'Alex Recruiter',
    uploaded_by_initials: 'AR',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const MOCK_ERROR_LOGS = [
  {
    id: 1,
    sheet_name: 'Frontend Developers',
    row_number: 42,
    error_message: 'Skipped duplicate candidate email: rahul.sharma@example.com',
    raw_data: {
      candidate_name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9876543210',
      skills: 'Angular, TypeScript, CSS',
      current_ctc: '18 LPA'
    }
  },
  {
    id: 2,
    sheet_name: 'Frontend Developers',
    row_number: 75,
    error_message: 'Skipped duplicate candidate phone: 9123456780',
    raw_data: {
      candidate_name: 'Priya Singh',
      email: 'priya.singh@example.com',
      phone: '9123456780',
      skills: 'React, Redux, Node.js'
    }
  }
];

export const MOCK_UNMATCHED_RESUMES = [
  {
    id: 101,
    resume_batch: '77777777-8888-9999-aaaa-bbbbccccdddd',
    original_filename: '98765432-1234-5678-abcd-ef0123456789_Vikram_Aditya_Senior_Java_Resume.pdf',
    gcs_url: 'https://storage.googleapis.com/test-bucket/Vikram_Aditya.pdf',
    ai_parsed_data: {
      first_name: 'Vikram',
      last_name: 'Aditya',
      email: 'vikram.aditya@techcloud.io',
      phone_number: '9876543210',
      skills: 'Java, Spring Boot, Microservices, AWS, Docker',
      total_experience_years: 8
    },
    match_attempts: {
      priority_result: 'AMBIGUOUS_MATCH',
      confidence: 0.0,
      details: { candidates_found: 2, name: 'Vikram Aditya' }
    },
    resolved: false,
    resolved_candidate: null
  },
  {
    id: 102,
    resume_batch: '77777777-8888-9999-aaaa-bbbbccccdddd',
    original_filename: '11223344-5566-7788-99aa-bbccddeeff00_Ananya_Deshmukh_Data_Engineer.pdf',
    gcs_url: 'https://storage.googleapis.com/test-bucket/Ananya_Deshmukh.pdf',
    ai_parsed_data: {
      first_name: 'Ananya',
      last_name: 'Deshmukh',
      email: 'ananya.d@dataworks.ai',
      phone_number: '9988776655',
      skills: 'Python, PySpark, Snowflake, dbt, SQL',
      total_experience_years: 5
    },
    match_attempts: {
      priority_result: 'NO_MATCH',
      confidence: 0.0,
      details: { searched_name: 'Ananya Deshmukh' }
    },
    resolved: false,
    resolved_candidate: null
  }
];

export const MOCK_CANDIDATES = [
  {
    id: 501,
    first_name: 'Vikram',
    last_name: 'Aditya',
    email: 'vikram.aditya@techcloud.io',
    phone_number: '+919876543210'
  },
  {
    id: 502,
    first_name: 'Vikram',
    last_name: 'Kumar',
    email: 'vikram.k@enterprise.com',
    phone_number: '+919876500000'
  },
  {
    id: 503,
    first_name: 'Ananya',
    last_name: 'Deshmukh',
    email: 'ananya.d@dataworks.ai',
    phone_number: '+919988776655'
  }
];

export const MOCK_REPORT_FIELDS_SCHEMA = {
  categories: ['Candidate Details', 'Contact Details', 'Compensation & Notice', 'Professional Experience', 'Education'],
  fields: [
    { key: 'candidate_name', label: 'Candidate Name', category: 'Candidate Details', default_selected: true },
    { key: 'email', label: 'Email Address', category: 'Contact Details', default_selected: true },
    { key: 'phone_number', label: 'Phone Number', category: 'Contact Details', default_selected: true },
    { key: 'current_ctc', label: 'Current CTC (LPA)', category: 'Compensation & Notice', default_selected: true },
    { key: 'expected_ctc', label: 'Expected CTC (LPA)', category: 'Compensation & Notice', default_selected: true },
    { key: 'notice_period', label: 'Notice Period', category: 'Compensation & Notice', default_selected: true },
    { key: 'skills', label: 'Key Skills', category: 'Professional Experience', default_selected: true },
    { key: 'total_experience', label: 'Total Experience (Yrs)', category: 'Professional Experience', default_selected: true },
    { key: 'latest_company', label: 'Latest Company', category: 'Professional Experience', default_selected: false },
    { key: 'latest_job_title', label: 'Current Job Title', category: 'Professional Experience', default_selected: false },
    { key: 'qualification', label: 'Highest Degree', category: 'Education', default_selected: false },
    { key: 'latest_university', label: 'University / Institute', category: 'Education', default_selected: false },
    { key: 'year_of_graduation', label: 'Graduation Year', category: 'Education', default_selected: false }
  ],
  default_selection: ['candidate_name', 'email', 'phone_number', 'current_ctc', 'expected_ctc', 'notice_period', 'skills', 'total_experience']
};

/**
 * Injects authentication JWT and mocks all core backend APIs.
 */
export async function setupMockAuthAndApis(page: Page, options?: {
  trackerBatches?: any[];
  resumeBatches?: any[];
  unmatchedResumes?: any[];
  candidates?: any[];
  errorLogs?: any[];
  user?: {
    jwt?: string;
    user_type?: string;
    user_id?: string;
    is_superuser?: boolean;
  };
}) {
  const jwt = options?.user?.jwt || MOCK_ADMIN_JWT;
  const userType = options?.user?.user_type || 'admin';
  const userId = options?.user?.user_id || '1';
  const isSuperUser = options?.user?.is_superuser ?? true;

  // 1. Inject Auth token into localStorage
  await page.addInitScript((data) => {
    localStorage.setItem('auth_token', data.jwt);
    localStorage.setItem('jwtToken', data.jwt);
    localStorage.setItem('token', data.jwt);
    localStorage.setItem('userType', data.userType);
    localStorage.setItem('user_type', data.userType);
    localStorage.setItem('user_role', data.userType);
    localStorage.setItem('user_id', data.userId);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('isSuperUser', data.isSuperUser ? 'true' : 'false');
  }, { jwt, userType, userId, isSuperUser });

  const trackerBatches = options?.trackerBatches || MOCK_TRACKER_BATCHES;
  const resumeBatches = options?.resumeBatches || MOCK_RESUME_BATCHES;
  const unmatchedResumes = options?.unmatchedResumes || MOCK_UNMATCHED_RESUMES;
  const candidates = options?.candidates || MOCK_CANDIDATES;
  const errorLogs = options?.errorLogs || MOCK_ERROR_LOGS;

  // 2. Intercept Tracker Batches List API
  await page.route('**/api/bulk-import/batches/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: trackerBatches.length,
        next: null,
        previous: null,
        results: trackerBatches
      })
    });
  });

  // 3. Intercept Resume Batches List API
  await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: resumeBatches.length,
        next: null,
        previous: null,
        results: resumeBatches
      })
    });
  });

  // 4. Intercept Unmatched Resumes List API
  await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
    if (route.request().method() === 'POST' && route.request().url().includes('/resolve/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Resume successfully attached to candidate.',
          candidate_id: 501
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: unmatchedResumes.length,
          next: null,
          previous: null,
          results: unmatchedResumes
        })
      });
    }
  });

  // 5. Intercept Candidates List API
  await page.route('**/api/recruiter/candidates/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: candidates.length,
        results: candidates
      })
    });
  });

  // 6. Intercept Batch Errors API
  await page.route('**/api/bulk-import/batch/*/errors/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: errorLogs.length,
        results: errorLogs
      })
    });
  });

  // 7. Intercept Report Fields Schema API
  await page.route('**/api/bulk-import/reports/fields/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REPORT_FIELDS_SCHEMA)
    });
  });

  // 8. Intercept Report Export Generation API
  await page.route('**/api/bulk-import/reports/generate/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: Buffer.from('MOCK_EXCEL_BINARY_DATA')
    });
  });

  // 9. Intercept Sweeper Reconcile API
  await page.route('**/api/bulk-import/reconcile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Reconciliation completed.',
        stats: { checked: 5, reconciled: 1 }
      })
    });
  });
}
