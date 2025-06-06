import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = `${environment.apiUrl}/api/file-upload/`; // Django file upload endpoint

  constructor(private http: HttpClient) {}

  uploadFile(file: File, token: string): Observable<{ file_url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<{ file_url: string }>(this.apiUrl, formData, { headers });
  }
}