import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { ApprovalNotificationService } from '../../services/approval-notification.service';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let mockNotificationService: any;
  let mockRouter: any;

  let pendingCount$: BehaviorSubject<number>;
  let approvedReportsCount$: BehaviorSubject<number>;
  let unreadCount$: BehaviorSubject<number>;
  let totalRecentCount$: BehaviorSubject<number>;
  let pendingRequests$: BehaviorSubject<any[]>;
  let myApprovedRequests$: BehaviorSubject<any[]>;

  beforeEach(async () => {
    pendingCount$ = new BehaviorSubject<number>(0);
    approvedReportsCount$ = new BehaviorSubject<number>(0);
    unreadCount$ = new BehaviorSubject<number>(0);
    totalRecentCount$ = new BehaviorSubject<number>(0);
    pendingRequests$ = new BehaviorSubject<any[]>([]);
    myApprovedRequests$ = new BehaviorSubject<any[]>([]);

    mockNotificationService = {
      pendingCount: pendingCount$.asObservable(),
      approvedReportsCount: approvedReportsCount$.asObservable(),
      unreadCount: unreadCount$.asObservable(),
      totalRecentCount: totalRecentCount$.asObservable(),
      pendingRequests: pendingRequests$.asObservable(),
      myApprovedRequests: myApprovedRequests$.asObservable(),
      markNotificationsAsSeen: jasmine.createSpy('markNotificationsAsSeen').and.callFake(() => {
        unreadCount$.next(0);
      }),
      isItemUnread: jasmine.createSpy('isItemUnread').and.callFake((item: any) => {
        return item && item.is_unread === true;
      }),
      downloadReportDirectly: jasmine.createSpy('downloadReportDirectly')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        { provide: ApprovalNotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the notification bell component', () => {
    expect(component).toBeTruthy();
  });

  it('should display badge count matching unreadCount', () => {
    expect(component.badgeCount).toBe(0);
    unreadCount$.next(3);
    fixture.detectChanges();
    expect(component.badgeCount).toBe(3);

    const badgeEl = fixture.nativeElement.querySelector('.bell-badge-count');
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent.trim()).toBe('3');
  });

  it('should open dropdown when bell button is clicked', () => {
    expect(component.isOpen).toBeFalse();
    const bellBtn = fixture.nativeElement.querySelector('.bell-btn');
    bellBtn.click();
    fixture.detectChanges();

    expect(component.isOpen).toBeTrue();
    const popover = fixture.nativeElement.querySelector('.bell-popover');
    expect(popover).toBeTruthy();
  });

  it('should call markNotificationsAsSeen and clear badge when closing dropdown', () => {
    unreadCount$.next(3);
    fixture.detectChanges();
    expect(component.badgeCount).toBe(3);

    // Open dropdown
    component.isOpen = true;
    fixture.detectChanges();

    // Close dropdown ("user comes out")
    component.closeDropdown();
    fixture.detectChanges();

    expect(component.isOpen).toBeFalse();
    expect(mockNotificationService.markNotificationsAsSeen).toHaveBeenCalled();
    expect(component.badgeCount).toBe(0);

    const badgeEl = fixture.nativeElement.querySelector('.bell-badge-count');
    expect(badgeEl).toBeFalsy(); // Badge element is hidden when count is 0
  });

  it('should slice items to at most 5 and display See More when totalRecentCount > 5', () => {
    component.isSuperUser = true;
    const mockItems = [
      { id: '1', requester_name: 'Recruiter 1', candidate_count: 5, created_at: new Date().toISOString() },
      { id: '2', requester_name: 'Recruiter 2', candidate_count: 10, created_at: new Date().toISOString() },
      { id: '3', requester_name: 'Recruiter 3', candidate_count: 2, created_at: new Date().toISOString() },
      { id: '4', requester_name: 'Recruiter 4', candidate_count: 8, created_at: new Date().toISOString() },
      { id: '5', requester_name: 'Recruiter 5', candidate_count: 15, created_at: new Date().toISOString() },
      { id: '6', requester_name: 'Recruiter 6', candidate_count: 3, created_at: new Date().toISOString() }
    ];
    pendingRequests$.next(mockItems);
    totalRecentCount$.next(6);
    component.isOpen = true;
    fixture.detectChanges();

    const notifItems = fixture.nativeElement.querySelectorAll('.notif-item');
    expect(notifItems.length).toBe(5); // Capped at 5 items

    const seeMoreRow = fixture.nativeElement.querySelector('.see-more-row');
    expect(seeMoreRow).toBeTruthy();
    expect(seeMoreRow.textContent).toContain('+1 more recent requests');
  });

  it('should navigate to approvals tab when seeMore is clicked', () => {
    component.isOpen = true;
    component.seeMore();
    expect(component.isOpen).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
  });

  it('should close dropdown when clicking outside component', () => {
    component.isOpen = true;
    const clickEvent = new MouseEvent('click', { bubbles: true });
    document.dispatchEvent(clickEvent);

    expect(component.isOpen).toBeFalse();
    expect(mockNotificationService.markNotificationsAsSeen).toHaveBeenCalled();
  });
});
