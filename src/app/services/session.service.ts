// src/app/services/session.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  
  constructor() { }
  
  setUserSession(userId: string) {
    localStorage.setItem('user_id', userId);
    localStorage.setItem('is_authenticated', 'true');
  }
  
  clearUserSession() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('is_authenticated');
  }
  
  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }
  
  isAuthenticated(): boolean {
    return localStorage.getItem('is_authenticated') === 'true';
  }
}