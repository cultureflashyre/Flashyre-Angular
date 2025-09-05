export interface ProgrammingLanguage {
  id: number;
  name: string;
  file_extension: string;
  template_code: string;
  piston_name: string; // Added for Piston API
  piston_version: string; // Added for Piston API
}

export interface TestCase {
  id: number;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  time_limit: number;
  memory_limit: number;
  created_at: string;
  created_by: number;
  test_cases: TestCase[];
  sample_test_cases: TestCase[];
}

export interface Submission {
  id: number;
  user_id: string; // Changed from number to string
  problem_id: number;
  language_id: number;
  code: string;
  status: string;
  execution_time: number | null;
  memory_used: number | null;
  error_message: string;
  submitted_at: string;
  language_name: string;
  problem_title: string;
}

export interface TestResult {
  id: number;
  submission_id: number;
  test_case: TestCase;
  actual_output: string;
  passed: boolean;
  execution_time: number | null;
  memory_used: number | null;
}

export interface Assessment {
  id: number;
  title: string;
  description: string;
  problems: Problem[];
  duration: number;
  created_by: number;
  created_at: string;
  is_active: boolean;
  problems_count: number;
}

export interface AssessmentAttempt {
  id: number;
  user: string; // Changed from number to string
  assessment: Assessment;
  started_at: string;
  ended_at: string | null;
  total_score: number;
  is_completed: boolean;
  duration_spent: number;
  problems_solved: number;
}