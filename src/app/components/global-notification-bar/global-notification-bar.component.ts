import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApprovalNotificationService } from '../../services/approval-notification.service';

@Component({
  selector: 'app-global-notification-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-notification-bar.component.html',
  styleUrls: ['./global-notification-bar.component.css']
})
export class GlobalNotificationBarComponent implements OnInit, OnDestroy {
  pendingCount: number = 0;
  approvedCount: number = 0;
  isSuperUser: boolean = false;
  userType: string = '';
  isDismissed: boolean = false;
  hasUnacknowledgedAlert: boolean = false;
  latestApprovedRequestId: string | null = null;
  latestApprovedFormat: string = 'xlsx';

  private subs = new Subscription();

  constructor(
    private notificationService: ApprovalNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true' ||
                       (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
    this.userType = localStorage.getItem('userType') || '';

    this.subs.add(
      this.notificationService.pendingCount.subscribe(count => {
        this.pendingCount = count;
      })
    );

    this.subs.add(
      this.notificationService.approvedReportsCount.subscribe(count => {
        this.approvedCount = count;
      })
    );

    this.subs.add(
      this.notificationService.hasUnacknowledgedAlert.subscribe(hasAlert => {
        this.hasUnacknowledgedAlert = hasAlert;
        if (hasAlert) {
          this.isDismissed = false;
        }
      })
    );

    this.subs.add(
      this.notificationService.alertsDismissed.subscribe(() => {
        this.isDismissed = true;
        this.hasUnacknowledgedAlert = false;
      })
    );

    this.subs.add(
      this.notificationService.myApprovedRequests.subscribe(reqs => {
        if (reqs && reqs.length > 0) {
          const first = reqs[0];
          this.latestApprovedRequestId = first.id || first.request_id;
          this.latestApprovedFormat = first.report_params?.format || 'xlsx';
        }
      })
    );
  }

  get showSuperAdminBar(): boolean {
    return this.isSuperUser && this.pendingCount > 0 && this.hasUnacknowledgedAlert && !this.isDismissed;
  }

  get showRecruiterBar(): boolean {
    return !this.isSuperUser && this.approvedCount > 0 && this.hasUnacknowledgedAlert && !this.isDismissed;
  }

  reviewRequests(): void {
    this.notificationService.markNotificationsAsSeen();
    this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
  }

  downloadApproved(): void {
    this.notificationService.markNotificationsAsSeen();
    if (this.latestApprovedRequestId) {
      this.notificationService.downloadReportDirectly(this.latestApprovedRequestId, this.latestApprovedFormat);
    } else {
      this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
    }
  }

  dismiss(): void {
    this.isDismissed = true;
    this.notificationService.markNotificationsAsSeen();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
