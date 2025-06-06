import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface JobDetails {
  job_titles: { value: string; confidence: number }[];
  experience: { value: string; confidence: number };
  skills: {
    primary: { skill: string; skill_confidence: number; type_confidence: number }[];
    secondary: { skill: string; skill_confidence: number; type_confidence: number }[];
  };
  mcqs: { [skill: string]: string };
  location?: string;
  workplace_type?: string;
  budget_type?: string;
  min_budget?: number;
  max_budget?: number;
  notice_period?: string;
  job_description?: string;
}

interface JobPost {
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
  skills: string;
  job_description: string;
  job_description_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobDescriptionService {
  private aiProcessUrl = `${environment.apiUrl}/api/ai-process/`;
  private jobPostUrl = `${environment.apiUrl}/api/job-post/`;

  constructor(private http: HttpClient) {}

  processJobDescription(fileUrl: string, token: string): Observable<JobDetails> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<JobDetails>(this.aiProcessUrl, { file_url: fileUrl }, { headers });
  }

  saveJobPost(jobPost: JobPost, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Store job details in localStorage before sending to server
    this.storeJobDetails(jobPost);

    return this.http.post(this.jobPostUrl, jobPost, { headers });
  }

  storeMCQs(mcqs: { [skill: string]: string }): void {
    localStorage.setItem('job_mcqs', JSON.stringify(mcqs));
  }

  getStoredMCQs(): { [skill: string]: string } | null {
    const mcqs = localStorage.getItem('job_mcqs');
    return mcqs ? JSON.parse(mcqs) : null;
  }

  storeJobDetails(jobPost: JobPost): void {
    localStorage.setItem('job_details', JSON.stringify(jobPost));
    console.log('Service: Job details stored in localStorage', jobPost);
    
    // Dispatch a storage event to notify other parts of the application
    const storageEvent = new StorageEvent('storage', {
      key: 'job_details',
      newValue: JSON.stringify(jobPost),
      storageArea: localStorage
    });
    window.dispatchEvent(storageEvent);
  }

  getStoredJobDetails(): JobPost | null {
    const jobDetails = localStorage.getItem('job_details');
    if (jobDetails) {
      try {
        const parsedDetails = JSON.parse(jobDetails);
        console.log('Service: Retrieved job details from localStorage', parsedDetails);
        return parsedDetails;
      } catch (error) {
        console.error('Service: Error parsing job details from localStorage', error);
        return null;
      }
    }
    return null;
  }

  clearStoredJobDetails(): void {
    localStorage.removeItem('job_details');
  }
}