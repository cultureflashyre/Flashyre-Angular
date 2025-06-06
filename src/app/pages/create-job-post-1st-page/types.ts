export interface Skill {
  skill: string;
  skill_confidence: number;
  type_confidence: number;
}

export interface JobDetails {
  unique_id: string;
  job_description_url: string;
  role: string;
  location: string;
  job_type: string;
  workplace_type: string;
  total_experience_min: number;
  total_experience_max: number;
  relevant_experience_min: number;
  relevant_experience_max: number;
  budget_type: string;
  min_budget: number;
  max_budget: number;
  notice_period: string;
  skills: {
    primary: Skill[];
    secondary: Skill[];
  };
  job_description: string;
  status: 'draft' | 'final';
  created_at?: string; // ISO date string, optional as it's read-only
  updated_at?: string; // ISO date string, optional as it's read-only
}

export interface AIJobResponse {
  file_url: string; // URL of the uploaded file in GCS
  unique_id: string; // Unique identifier for the file and job post
  job_details: {
    job_titles: { value: string; confidence: number }[];
    experience: { value: string; confidence: number };
    skills: { primary: Skill[]; secondary: Skill[] };
    location: string;
    workplace_type: string;
    budget_type: string;
    min_budget: number;
    max_budget: number;
    notice_period: string;
    job_description: string;
  };
  mcqs: { [skill: string]: string }; // MCQs as text per skill
}

export interface PaginatedJobPostResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: JobDetails[];
}