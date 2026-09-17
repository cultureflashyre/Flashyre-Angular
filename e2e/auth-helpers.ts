import { test as baseTest, expect as baseExpect, Page } from '@playwright/test';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Flashyre Centralized Playwright Authentication & JWT Generator System
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides:
 * 1. Automatic valid JWT token generation with future expiration (year 2038+).
 * 2. Pre-configured tokens: VALID_MOCK_ADMIN_JWT, VALID_MOCK_RECRUITER_JWT, VALID_MOCK_CANDIDATE_JWT.
 * 3. Unified setupAuthenticatedSession() helper injecting all required localStorage keys.
 * 4. Extended test fixtures (adminPage, recruiterPage, candidatePage) for future test files.
 */

export interface MockJwtPayload {
  exp?: number;
  user_id?: number | string;
  user_type?: 'admin' | 'recruiter' | 'candidate' | 'client';
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

/**
 * Generates a structurally valid, unexpired base64url JWT token.
 * Compatible with jwtDecode() in Angular's authGuard and HTTP interceptors.
 */
export function generateMockJwt(payload: MockJwtPayload = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  // Year 2038+ future expiration timestamp (253402300799)
  const exp = payload.exp ?? 253402300799;
  const fullPayload = {
    exp,
    user_id: payload.user_id ?? 1,
    user_type: payload.user_type ?? 'admin',
    email: payload.email ?? 'admin@flashyre.com',
    ...payload,
  };
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  return `${b64Header}.${b64Payload}.mock_valid_signature_flashyre_e2e`;
}

// Pre-configured valid JWT constants for the platform roles
export const VALID_MOCK_ADMIN_JWT = generateMockJwt({
  user_id: 1,
  user_type: 'admin',
  email: 'admin@flashyre.com',
  first_name: 'Super',
  last_name: 'Admin',
});

export const VALID_MOCK_SUPER_ADMIN_JWT = VALID_MOCK_ADMIN_JWT;

export const VALID_MOCK_STANDARD_ADMIN_JWT = generateMockJwt({
  user_id: 2,
  user_type: 'admin',
  email: 'standard.admin@flashyre.com',
  first_name: 'Standard',
  last_name: 'Admin',
});

export const VALID_MOCK_RECRUITER_JWT = generateMockJwt({
  user_id: 102,
  user_type: 'recruiter',
  email: 'recruiter@flashyre.com',
  first_name: 'Alex',
  last_name: 'Recruiter',
});

export const VALID_MOCK_CANDIDATE_JWT = generateMockJwt({
  user_id: 501,
  user_type: 'candidate',
  email: 'candidate@flashyre.com',
  first_name: 'Candidate',
  last_name: 'User',
});

export const VALID_MOCK_CLIENT_JWT = generateMockJwt({
  user_id: 301,
  user_type: 'client',
  email: 'client@company.com',
  first_name: 'Enterprise',
  last_name: 'Client',
});

// Backwards-compatible aliases matching older test fixtures
export const MOCK_ADMIN_JWT = VALID_MOCK_ADMIN_JWT;
export const MOCK_RECRUITER_JWT = VALID_MOCK_RECRUITER_JWT;
export const VALID_MOCK_JWT = VALID_MOCK_ADMIN_JWT;

export interface AuthSessionOptions {
  jwt?: string;
  userId?: string | number;
  email?: string;
  firstName?: string;
  lastName?: string;
  isSuperUser?: boolean;
  extraStorage?: Record<string, string>;
}

export type SupportedRole = 'admin' | 'superadmin' | 'standard_admin' | 'recruiter' | 'candidate' | 'client';

/**
 * Injects complete, valid authentication state into the browser page's localStorage
 * BEFORE page navigation runs, satisfying authGuard, role guards, and services.
 */
export async function setupAuthenticatedSession(
  page: Page,
  role: SupportedRole = 'admin',
  options: AuthSessionOptions = {}
): Promise<void> {
  let defaultJwt = VALID_MOCK_ADMIN_JWT;
  let defaultUserId = '1';
  let defaultEmail = 'admin@flashyre.com';
  let defaultFirstName = 'Super';
  let defaultLastName = 'Admin';
  let defaultIsSuper = true;
  let canonicalUserType = 'admin';

  switch (role) {
    case 'superadmin':
    case 'admin':
      canonicalUserType = 'admin';
      defaultJwt = VALID_MOCK_ADMIN_JWT;
      defaultUserId = '1';
      defaultEmail = 'admin@flashyre.com';
      defaultFirstName = 'Super';
      defaultLastName = 'Admin';
      defaultIsSuper = true;
      break;
    case 'standard_admin':
      canonicalUserType = 'admin';
      defaultJwt = VALID_MOCK_STANDARD_ADMIN_JWT;
      defaultUserId = '2';
      defaultEmail = 'standard.admin@flashyre.com';
      defaultFirstName = 'Standard';
      defaultLastName = 'Admin';
      defaultIsSuper = false;
      break;
    case 'recruiter':
      canonicalUserType = 'recruiter';
      defaultJwt = VALID_MOCK_RECRUITER_JWT;
      defaultUserId = '102';
      defaultEmail = 'recruiter@flashyre.com';
      defaultFirstName = 'Alex';
      defaultLastName = 'Recruiter';
      defaultIsSuper = false;
      break;
    case 'candidate':
      canonicalUserType = 'candidate';
      defaultJwt = VALID_MOCK_CANDIDATE_JWT;
      defaultUserId = '501';
      defaultEmail = 'candidate@flashyre.com';
      defaultFirstName = 'Candidate';
      defaultLastName = 'User';
      defaultIsSuper = false;
      break;
    case 'client':
      canonicalUserType = 'client';
      defaultJwt = VALID_MOCK_CLIENT_JWT;
      defaultUserId = '301';
      defaultEmail = 'client@company.com';
      defaultFirstName = 'Enterprise';
      defaultLastName = 'Client';
      defaultIsSuper = false;
      break;
  }

  const jwt = options.jwt ?? defaultJwt;
  const userId = String(options.userId ?? defaultUserId);
  const email = options.email ?? defaultEmail;
  const firstName = options.firstName ?? defaultFirstName;
  const lastName = options.lastName ?? defaultLastName;
  const isSuperUser = options.isSuperUser !== undefined ? options.isSuperUser : defaultIsSuper;

  await page.addInitScript((data) => {
    localStorage.setItem('auth_token', data.jwt);
    localStorage.setItem('jwtToken', data.jwt);
    localStorage.setItem('token', data.jwt);
    localStorage.setItem('refreshToken', 'mock-valid-refresh-token-session');
    localStorage.setItem('userType', data.canonicalUserType);
    localStorage.setItem('user_type', data.canonicalUserType);
    localStorage.setItem('user_role', data.canonicalUserType);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('user_id', data.userId);
    localStorage.setItem('isSuperUser', data.isSuperUser ? 'true' : 'false');
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('email', data.email);
    localStorage.setItem('firstName', data.firstName);
    localStorage.setItem('lastName', data.lastName);
    localStorage.setItem('userProfile', JSON.stringify({
      user_id: data.userId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      user_type: data.canonicalUserType,
      is_superuser: data.isSuperUser,
      profile_completion_score: 90,
    }));

    // Seed sessionStorage workflow context to prevent create-job steps and admin candidate scores from redirecting
    sessionStorage.setItem('admin_active_job_id', 'mock-active-job-42');
    sessionStorage.setItem('admin_active_assessment_id', '1');
    sessionStorage.setItem('admin_job_edit_mode', 'false');

    if (data.extra) {
      for (const [key, value] of Object.entries(data.extra)) {
        localStorage.setItem(key, String(value));
      }
    }
  }, {
    jwt,
    canonicalUserType,
    userId,
    email,
    firstName,
    lastName,
    isSuperUser,
    extra: options.extraStorage,
  });
}

/**
 * Intercepts common backend API requests across all pages to ensure smooth client-side
 * rendering during E2E navigation without unhandled exceptions or blank screens.
 */
export async function setupCommonApiMocks(page: Page): Promise<void> {
  // 1. Candidates & Statistics
  await page.route('**/api/candidates/statistics/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_candidates: 120,
        total_delta: 5,
        active_users: 85,
        active_delta: 3,
        ai_parsed: 110,
        ai_parsed_delta: 7,
        rated_4_plus: 45,
        rated_delta: 2,
      }),
    });
  });

  await page.route('**/api/candidates/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 1,
        results: [
          {
            id: 501,
            first_name: 'John',
            last_name: 'Candidate',
            email: 'john.cand@flashyre.com',
            score: 88,
            status: 'active',
          },
        ],
      }),
    });
  });

  // Admin service candidates endpoints (non-api prefix: /candidates/batch-dates/, /candidates/draft/)
  await page.route('**/candidates/**', async (route) => {
    const url = route.request().url();
    if (url.includes('batch-dates')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['2026-03-01', '2026-03-02']),
      });
    } else if (url.includes('draft') || url.includes('sourced')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            candidate_id: 501,
            batch_id: 1,
            full_name: 'John Candidate',
            email: 'john.cand@flashyre.com',
            phone: '1234567890',
            total_experience: '5 years',
            relevant_experience: '3 years',
            location: 'San Francisco',
            skills: ['Angular', 'TypeScript'],
            education: 'B.S. CS',
            certification: 'AWS Certified',
            cv_file_path: '/files/cv.pdf',
            has_account: 'Yes',
            account_creation_email_sent: 'Yes',
            email_sent_date: '2026-03-01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 1, results: [] }),
      });
    }
  });

  // Admin JD service endpoints (/jd/latest/, /jd/upload/)
  await page.route('**/jd/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 1,
        role: 'Full Stack Engineer',
        location: 'Remote',
        total_experience_min: '3',
        total_experience_max: '6',
        relevant_experience_min: '2',
        relevant_experience_max: '5',
        notice_period: '30 days',
        must_have_skills: ['TypeScript', 'Angular'],
        good_to_have_skills: ['Python', 'Django'],
        education_requirements: 'B.S. CS',
        certification_requirements: 'None',
        job_description: 'Full stack development role',
        created_at: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/rating-criteria/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // 2. Job Posts & Requirements
  await page.route('**/api/job-post/**', async (route) => {
    const url = route.request().url();
    if (url.includes('mcq-status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            status: 'completed',
            skills: { 'TypeScript': 'completed', 'Angular': 'completed' },
          },
        }),
      });
    } else if (url.includes('stages')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { stage_name: 'Screening', stage_date: '2026-04-01', mode: 'Online', assigned_to: 'interviewer@flashyre.com' },
        ]),
      });
    } else if (url.includes('sourced-candidates-with-scores')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            candidates: [
              {
                candidate_id: 501,
                name: 'John Candidate',
                email: 'john.cand@flashyre.com',
                score: 88,
                skills: 'TypeScript, Angular',
                status: 'active',
              },
            ],
          },
        }),
      });
    } else if (url.includes('uploaded-questions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    } else if (url.includes('mcqs')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            'TypeScript': {
              mcq_items: [
                {
                  mcq_item_id: 1,
                  question_text: 'What is TypeScript?\nOptions:\nA) Superset of JS\nB) CSS library\nCorrect Answer: A\nDifficulty: easy',
                  difficulty: 'easy',
                },
              ],
            },
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            {
              id: 42,
              job_id: 42,
              title: 'Full Stack Engineer',
              department: 'Engineering',
              status: 'live',
              applications_count: 15,
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    }
  });

  await page.route('**/api/jobs/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 2,
        results: [
          {
            id: 42,
            job_id: 42,
            title: 'Full Stack Engineer',
            role: 'Full Stack Engineer',
            department: 'Engineering',
            company_name: 'Acme Systems',
            location: 'San Francisco, CA',
            status: 'live',
            applications_count: 15,
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
  });

  // AdbRequirementService endpoints (/api/job-requirements/)
  await page.route('**/api/job-requirements/**', async (route) => {
    const url = route.request().url();
    if (url.includes('statistics')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_requirements: 8,
          total_delta: 2,
          active_count: 6,
          closed_count: 2,
        }),
      });
    } else if (url.includes('active_list')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            job_role: 'Full Stack Engineer',
            client_name: 'Acme Systems',
            role: 'Full Stack Engineer',
          },
        ]),
      });
    } else if (url.includes('client_list')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, company_name: 'Acme Systems' },
          { id: 2, company_name: 'Tech Giant Inc' },
        ]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [
            {
              id: 1,
              client_name: 'Tech Giant Inc',
              role: 'Lead Cloud Architect',
              job_role: 'Lead Cloud Architect',
              status: 'Active',
            },
          ],
        }),
      });
    }
  });

  await page.route('**/api/requirements/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_requirements: 8,
        total_delta: 2,
        count: 1,
        results: [
          {
            id: 1,
            client_name: 'Tech Giant Inc',
            role: 'Lead Cloud Architect',
            status: 'Active',
          },
        ],
      }),
    });
  });

  // 3. Clients & Analytical Module
  await page.route('**/api/clients/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 3,
        results: [
          {
            id: 1,
            company_name: 'Acme Systems',
            contact_person: 'Alice Smith',
            email: 'alice@acme.com',
            status: 'active',
          },
        ],
      }),
    });
  });

  // Super Admin API endpoints (/api/super-admin/ with hyphen)
  await page.route('**/api/super-admin/**', async (route) => {
    const url = route.request().url();
    if (url.includes('analytics')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpis: {
            total_candidates: 120,
            total_clients: 15,
            total_requirements: 25,
            total_submissions: 45,
            active_recruiters: 5,
            avg_time_to_fill: 14,
            pipeline: {
              Sourced: 20,
              Screening: 10,
              Submission: 5,
              Interview: 5,
              Offer: 3,
              Hired: 2,
              Rejected: 5,
            },
            sourcing: {
              top_source: 'Direct',
              quality_hires: 5,
              active_sources: 3,
            },
          },
          table_data: [],
          logs: [],
        }),
      });
    } else if (url.includes('list')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            user_id: 1,
            first_name: 'Super',
            last_name: 'Admin',
            email: 'admin@flashyre.com',
            user_type: 'admin',
            is_superuser: true,
          },
          {
            id: 2,
            user_id: 102,
            first_name: 'Alex',
            last_name: 'Recruiter',
            email: 'recruiter@flashyre.com',
            user_type: 'recruiter',
            is_superuser: false,
          },
        ]),
      });
    } else if (url.includes('client-names')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['Acme Systems', 'Tech Giant Inc']),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, results: [] }),
      });
    }
  });

  // Fallback for /api/superadmin/ without hyphen
  await page.route('**/api/superadmin/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kpis: {
          total_candidates: 120,
          total_clients: 15,
          total_requirements: 25,
          total_submissions: 45,
          active_recruiters: 5,
          avg_time_to_fill: 14,
          pipeline: { Sourced: 20, Screening: 10, Submission: 5, Interview: 5, Offer: 3, Hired: 2, Rejected: 5 },
          sourcing: { top_source: 'Direct', quality_hires: 5, active_sources: 3 },
        },
        table_data: [],
        logs: [],
      }),
    });
  });

  // 4. Collection Forms
  await page.route('**/api/collection-forms/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 1,
        results: [
          {
            unique_id: 'test-form-uuid-123',
            title: 'Campus Drive 2026',
            is_active: true,
            submission_count: 12,
            require_resume: true,
          },
        ],
      }),
    });
  });

  // 5. Public Forms
  await page.route('**/api/public-forms/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        unique_id: 'test-form-uuid-123',
        title: 'Campus Drive 2026',
        is_active: true,
        require_resume: true,
        template_type: 'campus',
      }),
    });
  });

  // 6. Assessments & Coding
  await page.route('**/api/assessments/**', async (route) => {
    const url = route.request().url();
    if (url.includes('assessment-list')) {
      // AssessmentDataService expects an Array response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            assessment_title: 'Full Stack Engineering Assessment',
            description: 'Core Engineering Assessment',
            total_questions: 15,
            total_duration: 45,
          },
        ]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          assessment_title: 'Full Stack Engineering Assessment',
          total_questions: 15,
          total_duration: 45,
          sections: [
            { section_title: 'Core TypeScript & Angular', question_count: 10 },
            { section_title: 'Data Structures & Algorithms', question_count: 5 },
          ],
        }),
      });
    }
  });

  // Trial Assessment Service (/trial_assessments/?assessment_id=...)
  await page.route('**/trial_assessments/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'SUCCESS',
        assessment_id: 1,
        assessment_title: 'Corporate Skill-Based Assessment',
        attempts_allowed: 3,
        attempts_remaining: 2,
        proctored: 'true',
        allow_mobile: 'false',
        video_recording: 'false',
        total_assessment_duration: 45,
        sections: [
          {
            name: 'Core Engineering MCQs',
            section_id: 1,
            duration_per_section: 30,
            questions: [
              {
                question_id: 101,
                question: 'What is the primary feature of TypeScript?',
                question_image: null,
                option_type: 'single',
                options: {
                  option1: 'Static typing',
                  q_option1_image: null,
                  option2: 'Dynamic typing only',
                  q_option2_image: null,
                  option3: 'Database engine',
                  q_option3_image: null,
                  option4: 'CSS framework',
                  q_option4_image: null,
                },
              },
            ],
          },
        ],
      }),
    });
  });

  // Assessment Taken Service (/assessment/get_all_assessment_scores/)
  await page.route('**/assessment/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assessment_id: 101,
        overall_score: 85,
        status: 'completed',
        scores: [
          { section: 'Core Skills', score: 90 },
          { section: 'Problem Solving', score: 80 },
        ],
      }),
    });
  });

  // Coding Assessment endpoints (/api/coding/problems/)
  await page.route('**/api/coding/**', async (route) => {
    const url = route.request().url();
    if (url.includes('problems') && (url.includes('/1') || url.includes('/p1'))) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          problem: {
            id: 1,
            title: 'Binary Search',
            description: 'Implement binary search on a sorted array.',
            input_format: 'Array of numbers, target number',
            output_format: 'Index of target or -1',
            constraints: 'N <= 10^5',
            example: 'Input: [1,2,3], 2 -> Output: 1',
            timer: 30,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          problems: [
            { id: 1, title: 'Binary Search', description: 'Implement binary search', timer: 30 },
            { id: 2, title: 'Two Sum', description: 'Find indices of two numbers', timer: 30 },
          ],
          remainingTime: '30:00',
        }),
      });
    }
  });

  await page.route('**/api/coding-assessment/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        problems: [
          { id: 'p1', title: 'Binary Search', description: 'Implement binary search on sorted array' },
          { id: 'p2', title: 'Two Sum', description: 'Find indices of two numbers that add up to target' },
        ],
        remainingTime: '30:00',
      }),
    });
  });

  // 7. Bulk Import API (/api/bulk-import/)
  await page.route('**/api/bulk-import/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 0,
        results: [],
        success: true,
        headers: ['First Name', 'Last Name', 'Email', 'Phone'],
        mapping: {},
        resolution_report: [],
        missing_required: [],
        needs_review: false,
        canonical_fields: [],
      }),
    });
  });

  // 8. Job Matching Score API (/api/job-matching-score/)
  await page.route('**/api/job-matching-score/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 1,
        results: [
          {
            candidate_id: 501,
            first_name: 'John',
            last_name: 'Candidate',
            job_role: 'Full Stack Engineer',
            skills: 'TypeScript, Angular, Node.js',
            total_experience: 5,
            relevant_experience: 4,
            city: 'San Francisco',
            state: 'CA',
            overall_score: 92,
            score_breakdown: {
              skills_similarity: 90,
              experience_similarity: 95,
              experience_years_score: 90,
              location_score: 93,
            },
          },
        ],
      }),
    });
  });

  // 9. ATS Workflow Pipeline (/api/ats/pipeline/)
  await page.route('**/api/ats/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // 10. Profile endpoints (/api/profile/ and /complete-profile/)
  await page.route('**/api/profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        first_name: 'Kathryn',
        last_name: 'Murphy',
        email: 'kathryn.murphy@flashyre.com',
        phone: '1234567890',
        completion: 90,
      }),
    });
  });

  await page.route('**/complete-profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        first_name: 'Kathryn',
        last_name: 'Murphy',
        profile_picture_url: null,
        latest_company_name: 'Tech Corp',
        latest_job_title: 'Software Engineer',
        latest_university: 'Stanford University',
        latest_education_level: 'Bachelors',
        latest_specialization: 'Computer Science',
        profile_completion_score: 90,
      }),
    });
  });

  // 11. Captcha API (/api/captcha/)
  await page.route('**/api/captcha/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        captcha_id: 'test-captcha-uuid-9999',
        question: 'What is 4 + 4?',
      }),
    });
  });

  // 12. Auth API (/api/auth/)
  await page.route('**/api/auth/**', async (route) => {
    const url = route.request().url();
    if (url.includes('check-phone') || url.includes('check-email')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Success',
          access: 'mock-valid-access-token',
          refresh: 'mock-valid-refresh-token',
          role: 'candidate',
          user_id: 501,
        }),
      });
    }
  });

  // 13. Candidate Applied, Disliked, and Saved Jobs
  await page.route('**/api/applied-jobs/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ applied_job_ids: [] }),
    });
  });

  await page.route('**/api/applied-job-details/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/disliked/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ disliked_jobs: [] }),
    });
  });

  await page.route('**/dislike/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/remove-dislike/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/save/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/details/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // 14. Profile Sync & Reference Data
  await page.route('**/get-user-details/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Candidate',
        email: 'john.cand@flashyre.com',
        phone_number: '1234567890',
        profile_completion_score: 90,
        resume_url: null,
      }),
    });
  });

  await page.route('**/save-profile-basic-info/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Profile saved' }),
    });
  });

  await page.route('**/api/employment/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/certifications/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/education/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/reference-data/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ universities: ['Stanford University'], degrees: ['Bachelors'] }),
    });
  });
}

/**
 * Extended Playwright Test Fixture for all test files.
 * Provides pre-authenticated page fixtures for all roles.
 */
export const test = baseTest.extend<{
  page: Page;
  adminPage: Page;
  superAdminPage: Page;
  standardAdminPage: Page;
  recruiterPage: Page;
  candidatePage: Page;
  clientPage: Page;
  publicPage: Page;
  authedPage: Page;
}>({
  page: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'superadmin');
    await use(page);
  },
  superAdminPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'superadmin');
    await use(page);
  },
  standardAdminPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'standard_admin');
    await use(page);
  },
  recruiterPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'recruiter');
    await use(page);
  },
  candidatePage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'candidate');
    await use(page);
  },
  clientPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'client');
    await use(page);
  },
  publicPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await use(page);
  },
  authedPage: async ({ page }, use) => {
    await setupCommonApiMocks(page);
    await setupAuthenticatedSession(page, 'admin');
    await use(page);
  },
});

export const expect = baseExpect;
