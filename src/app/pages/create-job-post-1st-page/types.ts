// src/app/pages/create-job-post-1st-page/types.ts

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

export interface RawMCQItemFromBackend {
  mcq_item_id: number; // Primary Key of MCQItem model
  job_mcq_id: number; // Primary Key of JobMCQ model it belongs to
  question_number: number;
  question_text: string; // The raw text including Q, options, and answer
}

export interface JobMcqGroupFromBackend {
  job_mcq_id: number; // ID of the JobMCQ object
  skill: string;
  mcq_items: RawMCQItemFromBackend[];
}

export interface McqsBySkillResponse {
  [skill: string]: JobMcqGroupFromBackend; // The backend returns a dictionary keyed by skill
}

export interface ParsedMCQText {
  question: string;
  options: string[];
  correctAnswerLabel: string; // e.g., 'a', 'b', 'c', 'd'
  originalIndex?: number; // Optional, can be useful for mapping back if needed
}

export interface ParsedMCQItem extends RawMCQItemFromBackend {
  parsedDetails: ParsedMCQText;
  isSelected?: boolean; // For UI binding in the list
}

export interface DisplayableMcqGroup {
  [skill: string]: {
    jobMcqId: number; // PK of the JobMCQ model instance
    items: ParsedMCQItem[];
  };
}

// THIS PAYLOAD IS FOR THE NEW 'mcq_assessment' APP (not the legacy one)
export interface AssessmentPayload {
  job_unique_id: string; // The JobPost unique_id (UUID string)
  name: string;
  selected_mcq_item_ids: number[]; // Array of MCQItem primary keys
  is_proctored: boolean;
  has_video_recording: boolean;
  allow_phone_access: boolean;
  shuffle_questions_overall: boolean;
  total_questions_to_present?: number | null; // Optional
}

// THIS RESPONSE IS FOR THE NEW 'mcq_assessment' APP (not the legacy one)
export interface AssessmentSaveResponse {
  assessment_uuid: string;
  name: string;
}

// ==============================================================================
// === NEW TYPES FOR LEGACY ASSESSMENT CREATION =================================
// ==============================================================================

/**
 * Payload for the endpoint that creates an assessment in the legacy 'trial_assessments' system.
 */
export interface LegacyAssessmentPayload {
  job_unique_id: string;
  assessment_name: string;
  selected_mcq_item_ids: number[];
  is_proctored: boolean;
  has_video_recording: boolean;
  allow_phone_access: boolean;
}

/**
 * The expected success response after creating a legacy assessment.
 */
export interface LegacyAssessmentSaveResponse {
  legacy_assessment_id: number;
  assessment_title: string;
}

export interface MCQItem {
  mcq_item_id: number;      // Primary Key of the MCQItem model
  job_mcq_id: number;       // FK to the parent JobMCQ model
  question_number: number;
  question_text: string;    // The raw text including the question, options, and answer
}