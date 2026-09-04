import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CollectionForm {
  id?: number;
  unique_id?: string;
  title: string;
  job_post?: number | null;
  job_post_title?: string;
  company_name?: string;
  logo_url?: string;
  require_resume: boolean;
  is_active: boolean;
  template_type?: 'standard' | 'campus' | 'experienced' | 'walkin';
  expires_at?: string | null;
  max_submissions?: number | null;
  is_expired?: boolean;
  is_submission_limit_reached?: boolean;
  effective_active?: boolean;
  created_by_name?: string;
  submission_count?: number;
  created_at?: string;
}

export interface PublicFormDetails {
  unique_id: string;
  title: string;
  company_name: string;
  logo_url: string;
  require_resume: boolean;
  is_active: boolean;
  template_type?: 'standard' | 'campus' | 'experienced' | 'walkin';
  created_by_phone?: string;
  form_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionFormService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getForms(): Observable<CollectionForm[]> {
    return this.http.get<CollectionForm[]>(`${this.apiUrl}api/collection-forms/`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getForm(uniqueId: string): Observable<CollectionForm> {
    return this.http.get<CollectionForm>(`${this.apiUrl}api/collection-forms/${uniqueId}/`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  createForm(form: CollectionForm): Observable<CollectionForm> {
    return this.http.post<CollectionForm>(`${this.apiUrl}api/collection-forms/`, form);
  }

  updateForm(uniqueId: string, form: Partial<CollectionForm>): Observable<CollectionForm> {
    return this.http.patch<CollectionForm>(`${this.apiUrl}api/collection-forms/${uniqueId}/`, form);
  }

  deleteForm(uniqueId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}api/collection-forms/${uniqueId}/`);
  }

  getPublicFormDetails(formUuid: string): Observable<PublicFormDetails> {
    return this.http.get<PublicFormDetails>(`${this.apiUrl}api/public-forms/${formUuid}/`);
  }

  submitPublicForm(formUuid: string, payload: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}api/public-forms/${formUuid}/submit/`, payload);
  }
}
