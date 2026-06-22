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
  isMobileMenuOpen: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';
    this.userType = localStorage.getItem('userType') || '';
    this.showClients = this.userType === 'admin';
    this.showCandidates = this.userType === 'admin' || this.userType === 'recruiter';

    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';
    this.userName = `${firstName} ${lastName}`.trim() || 'User';
    this.userInitials = (
      (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')
    ).toUpperCase() || 'U';
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
