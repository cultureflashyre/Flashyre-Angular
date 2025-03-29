import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/candidate.service';

@Injectable({
  providedIn: 'root',
})
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getJWTToken(); // Retrieve token from AuthService

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });
    }

    return next.handle(request); // Pass the modified request
  }
}
