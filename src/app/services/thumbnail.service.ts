import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailService {

  // Returns two initials: first letter of first and last word (e.g., "Jack Jones" => "JJ", "Flashyre" => "F")
  getUserInitials(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Returns single initial: first letter of the whole string (e.g., "Wipro" => "W")
  getCompanyInitial(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().charAt(0).toUpperCase();
  }
}
