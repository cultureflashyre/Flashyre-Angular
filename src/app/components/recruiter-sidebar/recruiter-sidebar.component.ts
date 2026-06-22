import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-recruiter-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recruiter-sidebar.component.html',
  styleUrls: ['./recruiter-sidebar.component.css'],
})
export class RecruiterSidebarComponent implements OnInit {
  @Input() activePage: string = '';

  isSuperUser: boolean = false;
  userType: string = '';
  showClients: boolean = false;
  showCandidates: boolean = false;
  userName: string = '';
  userInitials: string = '';
  profilePicUrl: string = '';
  isMobileMenuOpen: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';
    this.userType = localStorage.getItem('userType') || '';
    this.showClients = this.userType === 'admin';
    this.showCandidates = this.userType === 'admin' || this.userType === 'recruiter';

    let firstName = localStorage.getItem('firstName') || '';
    let lastName = localStorage.getItem('lastName') || '';
    
    // Fallback to userProfile if individual keys are missing
    if (!firstName && !lastName) {
      const userProfileStr = localStorage.getItem('userProfile');
      if (userProfileStr) {
        try {
          const userProfile = JSON.parse(userProfileStr);
          firstName = userProfile.first_name || '';
          lastName = userProfile.last_name || '';
          
          if (!this.profilePicUrl && userProfile.profile_picture_url) {
            this.profilePicUrl = userProfile.profile_picture_url;
          }
        } catch (e) {
          console.error("Error parsing userProfile from localStorage", e);
        }
      }
    }

    this.userName = `${firstName} ${lastName}`.trim() || 'User';
    this.userInitials = (
      (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')
    ).toUpperCase() || 'U';
    
    if (!this.profilePicUrl) {
      this.profilePicUrl = localStorage.getItem('profilePicUrl') || '';
    }
  }

  get formattedUserType(): string {
    if (this.userType.toLowerCase() === 'admin') return 'Administrator';
    if (this.userType.toLowerCase() === 'superadmin') return 'Super Admin';
    return this.userType;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onLogout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
