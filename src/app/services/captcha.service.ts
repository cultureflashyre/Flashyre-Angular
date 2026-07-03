import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetches a new math CAPTCHA challenge from the backend.
   */
  generateCaptcha(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/captcha/generate/`);
  }

  /**
   * Verifies the CAPTCHA answer directly with the backend.
   */
  verifyCaptcha(captchaId: string, captchaAnswer: string): Observable<any> {
    return this.http.post(`${this.apiUrl}api/captcha/verify/`, {
      captcha_id: captchaId,
      captcha_answer: captchaAnswer
    });
  }
}
