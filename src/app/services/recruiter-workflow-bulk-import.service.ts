import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruiterWorkflowBulkImportService {
  
  // Construct the endpoint URL using the environment variable
  private apiUrl = environment.apiUrl + 'api/bulk-import/upload/';

  constructor(private http: HttpClient) { }

  /**
   * Uploads an Excel file to the bulk import endpoint.
   * @param file The Excel file selected by the user.
   * @returns Observable containing the server response.
   */
  uploadCandidateFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(this.apiUrl, formData);
  }
}
