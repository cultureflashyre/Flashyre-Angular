import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApprovalNotificationService } from '../../services/approval-notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  isOpen: boolean = false;
  isSuperUser: boolean = false;
  userType: string = '';
  pendingCount: number = 0;
  approvedCount: number = 0;
  pendingRequests: any[] = [];
  myApprovedRequests: any[] = [];

  private subs = new Subscription();

  constructor(
    private notificationService: ApprovalNotificationService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true' ||
                       (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
    this.userType = localStorage.getItem('userType') || '';

    this.subs.add(
      this.notificationService.pendingCount.subscribe(c => this.pendingCount = c)
    );

    this.subs.add(
      this.notificationService.approvedReportsCount.subscribe(c => this.approvedCount = c)
    );

    this.subs.add(
      this.notificationService.pendingRequests.subscribe(reqs => this.pendingRequests = reqs || [])
    );

    this.subs.add(
      this.notificationService.myApprovedRequests.subscribe(reqs => this.myApprovedRequests = reqs || [])
    );
  }

  get badgeCount(): number {
    return this.isSuperUser ? this.pendingCount : this.approvedCount;
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    this.notificationService.markNotificationsAsSeen();
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  reviewRequest(requestId?: string): void {
    this.closeDropdown();
    this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
  }

  downloadReport(requestId: string, format: string = 'xlsx', event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.closeDropdown();
    this.notificationService.downloadReportDirectly(requestId, format);
  }

  goToApprovalsTab(): void {
    this.closeDropdown();
    this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
