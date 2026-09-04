import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApprovalNotificationService } from '../../services/approval-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recruiter-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recruiter-sidebar.component.html',
  styleUrls: ['./recruiter-sidebar.component.css'],
})
export class RecruiterSidebarComponent implements OnInit, OnDestroy {
  @Input() activePage: string = '';

  isSuperUser: boolean = false;
  userType: string = '';
  showClients: boolean = false;
  showCandidates: boolean = false;
  showImport: boolean = false;
  userName: string = '';
  userInitials: string = '';
  profilePicUrl: string = '';
  isMobileMenuOpen: boolean = false;

  pendingApprovalCount: number = 0;
  approvedReportsCount: number = 0;
  private pendingSub: Subscription | null = null;
  private approvedSub: Subscription | null = null;

  constructor(
    private router: Router,
    private notificationService: ApprovalNotificationService
  ) {}

  ngOnInit(): void {
    this.userType = localStorage.getItem('userType') || '';
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true' || this.userType.toLowerCase() === 'admin';
    this.showClients = this.userType === 'admin';
    this.showCandidates = this.userType === 'admin' || this.userType === 'recruiter';
    this.showImport = this.userType === 'admin' || this.userType === 'recruiter' || this.isSuperUser;

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

    // Subscribe to real-time notification badge counts
    this.pendingSub = this.notificationService.pendingCount.subscribe(count => {
      this.pendingApprovalCount = count;
    });

    this.approvedSub = this.notificationService.approvedReportsCount.subscribe(count => {
      this.approvedReportsCount = count;
    });
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
    this.notificationService.stopListening();
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.pendingSub) {
      this.pendingSub.unsubscribe();
      this.pendingSub = null;
    }
    if (this.approvedSub) {
      this.approvedSub.unsubscribe();
      this.approvedSub = null;
    }
  }
}
