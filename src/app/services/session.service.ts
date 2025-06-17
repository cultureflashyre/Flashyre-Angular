// src/app/services/session.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor() {}

  // Optional: Methods for non-authentication data storage in localStorage
  setData(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  getData(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeData(key: string) {
    localStorage.removeItem(key);
  }

  clearAllData() {
    localStorage.clear();
  }
}