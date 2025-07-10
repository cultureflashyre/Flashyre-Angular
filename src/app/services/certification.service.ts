// certification.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class CertificationService {
    private baseUrl = environment.apiUrl+'api/certifications/';

  constructor(private http: HttpClient) {}

  saveCertification(cert: any): Observable<any> {
    return this.http.post(this.baseUrl, cert);
  }
}
