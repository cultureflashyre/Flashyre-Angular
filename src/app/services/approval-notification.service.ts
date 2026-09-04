import { Injectable, OnDestroy, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable, Subscription, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  Firestore,
  Unsubscribe,
  DocumentData
} from 'firebase/firestore';
import { RecruiterWorkflowBulkImportService } from './recruiter-workflow-bulk-import.service';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  actionLabel?: string;
  actionCallback?: () => void;
  autoDismiss?: boolean;
}

export interface ApprovalNotificationEvent {
  request_id: string;
  type: 'NEW_REQUEST' | 'STATUS_CHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requester_name?: string;
  requester_id?: string;
  candidate_count?: number;
  reviewed_by_name?: string;
  report_params?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApprovalNotificationService implements OnDestroy {
  private readonly STORAGE_KEY_PENDING = 'flashyre_last_acknowledged_pending_request_id';
  private readonly STORAGE_KEY_APPROVED = 'flashyre_last_acknowledged_approved_request_id';

  private latestPendingRequestId: string | null = null;
  private latestApprovedRequestId: string | null = null;
  private lastToastedPendingRequestId: string | null = null;
  private lastToastedApprovedRequestId: string | null = null;

  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isFirebaseReady: boolean = false;

  // Real-time pending count observable for Super Admin badges
  private pendingCount$ = new BehaviorSubject<number>(0);
  public pendingCount: Observable<number> = this.pendingCount$.asObservable();

  // Real-time approved reports count observable for Recruiter badges
  private approvedReportsCount$ = new BehaviorSubject<number>(0);
  public approvedReportsCount: Observable<number> = this.approvedReportsCount$.asObservable();

  // Active approval request items for dropdown preview
  private pendingRequests$ = new BehaviorSubject<any[]>([]);
  public pendingRequests: Observable<any[]> = this.pendingRequests$.asObservable();

  private myApprovedRequests$ = new BehaviorSubject<any[]>([]);
  public myApprovedRequests: Observable<any[]> = this.myApprovedRequests$.asObservable();

  // Real-time unacknowledged alert observable for banners and persistent UI
  private hasUnacknowledgedAlert$ = new BehaviorSubject<boolean>(false);
  public hasUnacknowledgedAlert: Observable<boolean> = this.hasUnacknowledgedAlert$.asObservable();

  // Emitted when user clicks notification bell or closes banner to dismiss active alerts
  private alertsDismissed$ = new Subject<void>();
  public alertsDismissed: Observable<void> = this.alertsDismissed$.asObservable();

  // Observable stream of notification events
  private notificationEvents$ = new Subject<ApprovalNotificationEvent>();
  public notificationEvents: Observable<ApprovalNotificationEvent> = this.notificationEvents$.asObservable();

  // Observable stream of Toast alerts
  private toastMessages$ = new Subject<ToastMessage>();
  public toastMessages: Observable<ToastMessage> = this.toastMessages$.asObservable();

  // Active Firestore snapshot unsubscribers and idempotency flags
  private superAdminUnsubscribe: Unsubscribe | null = null;
  private recruiterUnsubscribe: Unsubscribe | null = null;
  private isSuperAdminListening: boolean = false;
  private currentListeningRecruiterId: string | null = null;
  private isInitialSuperAdminLoad: boolean = true;
  private isInitialRecruiterLoad: boolean = true;

  // Background polling heartbeat & Idle awareness
  private heartbeatSub: Subscription | null = null;
  private visibilityListener: (() => void) | null = null;
  private originalDocumentTitle: string = '';
  private titleFlashInterval: any = null;

  constructor(
    private router: Router,
    private injector: Injector
  ) {
    this.initFirebase();
    this.setupTitleFlashListeners();
  }

  private setupTitleFlashListeners(): void {
    if (typeof document !== 'undefined') {
      this.originalDocumentTitle = document.title || 'Flashyre';
    }

    this.hasUnacknowledgedAlert$.subscribe(hasAlert => {
      if (hasAlert) {
        this.startTitleFlash();
      } else {
        this.stopTitleFlash();
      }
    });

    this.alertsDismissed$.subscribe(() => {
      this.stopTitleFlash();
    });
  }

  /**
   * Initializes Firebase and Cloud Firestore instance safely.
   */
  private initFirebase(): void {
    try {
      const fbConfig = (environment as any).firebase;
      if (!fbConfig || !fbConfig.projectId) {
        console.warn('ApprovalNotificationService: Firebase configuration missing in environment.');
        return;
      }

      this.app = getApps().length > 0 ? getApp() : initializeApp(fbConfig);
      this.db = getFirestore(this.app);
      this.isFirebaseReady = true;
      console.log('ApprovalNotificationService: Firebase Firestore client initialized successfully.');
    } catch (err) {
      console.warn('ApprovalNotificationService: Could not initialize Firebase:', err);
      this.isFirebaseReady = false;
    }
  }

  /**
   * Request browser native notification permission.
   */
  public requestNotificationPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Browser notification permission status:', permission);
        }).catch(e => {
          console.warn('Could not request notification permission:', e);
        });
      }
    }
  }

  /**
   * Displays native browser notification if granted.
   */
  private showNativeNotification(title: string, body: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: (environment as any).fh_logo_thumbnail || '/favicon.ico',
        });
      } catch (err) {
        console.warn('Could not display native notification:', err);
      }
    }
  }

  /**
   * Dispatches a global toast notification.
   * If autoDismiss is false, the toast remains visible until acknowledged or dismissed.
   */
  public showToast(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionLabel?: string,
    actionCallback?: () => void,
    autoDismiss: boolean = true
  ): void {
    const toast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      actionLabel,
      actionCallback,
      autoDismiss
    };
    this.toastMessages$.next(toast);
  }

  /**
   * Marks current active pending/approved requests as acknowledged/seen by user.
   * Persists the latest request ID in localStorage and broadcasts dismissal signal
   * to dismiss persistent toast alerts and top-level notification bars.
   */
  public markNotificationsAsSeen(): void {
    const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                    (localStorage.getItem('userType') || '').toLowerCase() === 'admin';

    if (isSuper) {
      const pendingList = this.pendingRequests$.getValue();
      const reqId = this.latestPendingRequestId ||
        (pendingList && pendingList.length > 0 ? (pendingList[0].id || pendingList[0].request_id) : null);
      if (reqId) {
        this.latestPendingRequestId = String(reqId);
        localStorage.setItem(this.STORAGE_KEY_PENDING, String(reqId));
      }
    } else {
      const approvedList = this.myApprovedRequests$.getValue();
      const reqId = this.latestApprovedRequestId ||
        (approvedList && approvedList.length > 0 ? (approvedList[0].id || approvedList[0].request_id) : null);
      if (reqId) {
        this.latestApprovedRequestId = String(reqId);
        localStorage.setItem(this.STORAGE_KEY_APPROVED, String(reqId));
      }
    }

    this.hasUnacknowledgedAlert$.next(false);
    this.alertsDismissed$.next();
  }

  /**
   * Sets the pending count manually (e.g. from initial REST API fetch).
   */
  public setPendingCount(count: number): void {
    this.pendingCount$.next(count);
  }

  /**
   * Refreshes pending requests via REST API and evaluates acknowledgment state.
   */
  public refreshPendingRequests(): void {
    try {
      const bulkService = this.injector.get(RecruiterWorkflowBulkImportService);
      bulkService.getPendingApprovalCount().subscribe({
        next: (res) => this.pendingCount$.next(res.count || 0),
        error: (err) => console.warn('Failed to fetch pending approval count:', err)
      });
      bulkService.getApprovalRequests('PENDING', 1).subscribe({
        next: (res) => {
          const results = res.results || [];
          this.pendingRequests$.next(results);
          this.handlePendingRequestsUpdate(results);
        },
        error: (err) => console.warn('Failed to fetch pending requests list:', err)
      });
    } catch (e) {
      console.warn('Error refreshing pending requests:', e);
    }
  }

  private handlePendingRequestsUpdate(list: any[]): void {
    if (!list || list.length === 0) {
      this.latestPendingRequestId = null;
      this.hasUnacknowledgedAlert$.next(false);
      return;
    }

    const latest = list[0];
    const latestId = String(latest.id || latest.request_id);
    this.latestPendingRequestId = latestId;
    const storedId = localStorage.getItem(this.STORAGE_KEY_PENDING);

    if (storedId === latestId) {
      // User has already acknowledged this request previously
      this.hasUnacknowledgedAlert$.next(false);
    } else {
      // Unacknowledged request exists! Show banner and persistent toast
      this.hasUnacknowledgedAlert$.next(true);

      if (this.lastToastedPendingRequestId !== latestId) {
        this.lastToastedPendingRequestId = latestId;
        this.playGentleChime();
        const requester = latest.requested_by_name || 'A recruiter';
        const countStr = latest.candidate_count ? ` (${latest.candidate_count} candidates)` : '';
        const title = '📋 New Report Approval Request';
        const msg = `${requester} requested an export of candidates${countStr} requiring your approval.`;

        this.showToast(
          title,
          msg,
          'warning',
          'Review Request',
          () => {
            this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
          },
          false // autoDismiss: false -> stays until bell icon clicked
        );
      }
    }
  }

  /**
   * Refreshes approved requests for recruiter via REST API and evaluates acknowledgment state.
   */
  public refreshMyApprovedRequests(): void {
    try {
      const bulkService = this.injector.get(RecruiterWorkflowBulkImportService);
      bulkService.getMyApprovalRequests().subscribe({
        next: (requests) => {
          const approved = (requests || []).filter(r => r.status === 'APPROVED');
          this.approvedReportsCount$.next(approved.length);
          this.myApprovedRequests$.next(approved.slice(0, 5));
          this.handleApprovedRequestsUpdate(approved);
        },
        error: (err) => console.warn('Failed to fetch my approval requests:', err)
      });
    } catch (e) {
      console.warn('Error refreshing recruiter approved requests:', e);
    }
  }

  private handleApprovedRequestsUpdate(list: any[]): void {
    if (!list || list.length === 0) {
      this.latestApprovedRequestId = null;
      this.hasUnacknowledgedAlert$.next(false);
      return;
    }

    const latest = list[0];
    const latestId = String(latest.id || latest.request_id);
    this.latestApprovedRequestId = latestId;
    const storedId = localStorage.getItem(this.STORAGE_KEY_APPROVED);

    if (storedId === latestId) {
      this.hasUnacknowledgedAlert$.next(false);
    } else {
      this.hasUnacknowledgedAlert$.next(true);

      if (this.lastToastedApprovedRequestId !== latestId) {
        this.lastToastedApprovedRequestId = latestId;
        this.playGentleChime();
        const approver = latest.reviewed_by_name || 'Super Admin';
        const title = '✅ Report Request Approved';
        const msg = `Your candidate report request has been approved by ${approver}. Click "Download Report" to save it.`;
        const format = (latest.report_params?.format || 'xlsx').toLowerCase();

        this.showToast(
          title,
          msg,
          'success',
          'Download Report',
          () => this.downloadReportDirectly(latest.id || latest.request_id, format),
          false // autoDismiss: false -> stays until bell icon clicked
        );
      }
    }
  }

  /**
   * Initializes global notification listeners based on current logged-in user state.
   * Starts Firestore real-time listeners AND autonomous 15s polling heartbeat.
   * Safe to call repeatedly (idempotent).
   */
  public initGlobalListeners(): void {
    const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                    (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');

    // Start background heartbeat polling for idle awareness
    this.startPollingHeartbeat();

    if (isSuper) {
      this.refreshPendingRequests();
      this.startListeningForSuperAdmin();
    } else if (userId) {
      this.refreshMyApprovedRequests();
      this.startListeningForRecruiter(String(userId));
    }
  }

  /**
   * Starts an autonomous 15-second background polling heartbeat stream.
   * Ensures idle users viewing a page without interaction receive instant notifications.
   * Also listens for browser visibilitychange to refresh immediately when focusing the tab.
   */
  public startPollingHeartbeat(): void {
    if (this.heartbeatSub) {
      return;
    }

    // Run immediately (0s) and then every 15s in the background
    this.heartbeatSub = timer(0, 15000).subscribe(() => {
      const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                      (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
      const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');

      if (isSuper) {
        this.refreshPendingRequests();
      } else if (userId) {
        this.refreshMyApprovedRequests();
      }
    });

    // Instant refresh when user returns/focuses the tab
    if (typeof document !== 'undefined' && !this.visibilityListener) {
      this.visibilityListener = () => {
        if (document.visibilityState === 'visible') {
          const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                          (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
          const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
          if (isSuper) {
            this.refreshPendingRequests();
          } else if (userId) {
            this.refreshMyApprovedRequests();
          }
        }
      };
      document.addEventListener('visibilitychange', this.visibilityListener);
    }
  }

  /**
   * Flashes browser document title between action notice and original title.
   */
  public startTitleFlash(): void {
    if (typeof document === 'undefined') return;
    if (!this.originalDocumentTitle) {
      this.originalDocumentTitle = document.title || 'Flashyre';
    }

    if (this.titleFlashInterval) {
      return;
    }

    let showNotice = true;
    this.titleFlashInterval = setInterval(() => {
      if (typeof document === 'undefined') return;
      const count = this.pendingCount$.getValue() || this.approvedReportsCount$.getValue() || 1;
      if (showNotice) {
        document.title = `(${count}) 📋 Action Required! - Flashyre`;
      } else {
        document.title = this.originalDocumentTitle || 'Flashyre';
      }
      showNotice = !showNotice;
    }, 1500);
  }

  /**
   * Restores original browser document title.
   */
  public stopTitleFlash(): void {
    if (this.titleFlashInterval) {
      clearInterval(this.titleFlashInterval);
      this.titleFlashInterval = null;
    }
    if (typeof document !== 'undefined' && this.originalDocumentTitle) {
      document.title = this.originalDocumentTitle;
    }
  }

  /**
   * Plays a subtle, gentle double-chime using Web Audio API to alert idle users.
   */
  public playGentleChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.1);
      gain2.gain.setValueAtTime(0.08, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } catch {
      // Ignored if browser restricts autoplay audio
    }
  }

  /**
   * Subscribes to real-time approval requests for Super Admins.
   * Listens to Firestore `report_approval_notifications` where target_role = 'super_admin'.
   */
  public startListeningForSuperAdmin(): void {
    if (this.isSuperAdminListening) {
      return;
    }

    this.stopListeningSuperAdmin();
    this.requestNotificationPermission();

    if (!this.isFirebaseReady || !this.db) {
      console.warn('ApprovalNotificationService: Firestore not available for Super Admin listener.');
      return;
    }

    try {
      this.isInitialSuperAdminLoad = true;
      this.isSuperAdminListening = true;
      const notificationsCol = collection(this.db, 'report_approval_notifications');
      const q = query(
        notificationsCol,
        where('target_role', '==', 'super_admin'),
        where('status', '==', 'PENDING')
      );

      this.superAdminUnsubscribe = onSnapshot(
        q,
        snapshot => {
          const count = snapshot.size;
          this.pendingCount$.next(count);

          if (count === 0) {
            this.hasUnacknowledgedAlert$.next(false);
          }

          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data() as ApprovalNotificationEvent;
              this.notificationEvents$.next(data);

              // Don't fire alerts on initial mass load
              if (!this.isInitialSuperAdminLoad) {
                this.refreshPendingRequests();
                const reqId = String(data.request_id);
                this.latestPendingRequestId = reqId;
                const storedId = localStorage.getItem(this.STORAGE_KEY_PENDING);

                if (storedId !== reqId) {
                  this.hasUnacknowledgedAlert$.next(true);

                  if (this.lastToastedPendingRequestId !== reqId) {
                    this.lastToastedPendingRequestId = reqId;
                    this.playGentleChime();
                    const requester = data.requester_name || 'A recruiter';
                    const countStr = data.candidate_count ? ` (${data.candidate_count} candidates)` : '';
                    const title = '📋 New Report Approval Request';
                    const msg = `${requester} requested an export of candidates${countStr} requiring your approval.`;

                    this.showToast(
                      title,
                      msg,
                      'warning',
                      'Review Request',
                      () => {
                        this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
                      },
                      false // autoDismiss: false -> stays until notification icon clicked
                    );
                    this.showNativeNotification(title, msg);
                  }
                }
              }
            }
          });

          this.isInitialSuperAdminLoad = false;
        },
        error => {
          console.warn('ApprovalNotificationService: Super Admin snapshot error:', error);
          this.isSuperAdminListening = false;
        }
      );
    } catch (err) {
      console.warn('ApprovalNotificationService: Failed to start Super Admin listener:', err);
      this.isSuperAdminListening = false;
    }
  }

  /**
   * Subscribes to real-time status updates for a specific Recruiter.
   * Listens to Firestore `report_approval_notifications` where target_user_id = recruiter's ID.
   */
  public startListeningForRecruiter(userId: string): void {
    if (this.currentListeningRecruiterId === String(userId)) {
      return;
    }

    this.stopListeningRecruiter();
    this.requestNotificationPermission();

    if (!this.isFirebaseReady || !this.db || !userId) {
      return;
    }

    try {
      this.isInitialRecruiterLoad = true;
      this.currentListeningRecruiterId = String(userId);
      const notificationsCol = collection(this.db, 'report_approval_notifications');
      const q = query(
        notificationsCol,
        where('target_user_id', '==', String(userId)),
        where('type', '==', 'STATUS_CHANGE')
      );

      this.recruiterUnsubscribe = onSnapshot(
        q,
        snapshot => {
          // Track ready-to-download approved reports count for recruiter badge
          let approvedCount = 0;
          snapshot.forEach(doc => {
            const d = doc.data();
            if (d['status'] === 'APPROVED') {
              approvedCount++;
            }
          });
          this.approvedReportsCount$.next(approvedCount);

          if (approvedCount === 0) {
            this.hasUnacknowledgedAlert$.next(false);
          }

          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data() as ApprovalNotificationEvent;
              this.notificationEvents$.next(data);

              if (!this.isInitialRecruiterLoad) {
                this.refreshMyApprovedRequests();
                const approver = data.reviewed_by_name || 'Super Admin';
                const reqId = String(data.request_id);

                if (data.status === 'APPROVED') {
                  this.latestApprovedRequestId = reqId;
                  const storedId = localStorage.getItem(this.STORAGE_KEY_APPROVED);

                  if (storedId !== reqId) {
                    this.hasUnacknowledgedAlert$.next(true);

                    if (this.lastToastedApprovedRequestId !== reqId) {
                      this.lastToastedApprovedRequestId = reqId;
                      this.playGentleChime();
                      const title = '✅ Report Request Approved';
                      const msg = `Your candidate report request has been approved by ${approver}. Click "Download Report" to save it.`;
                      const format = (data.report_params?.format || 'xlsx').toLowerCase();

                      this.showToast(
                        title,
                        msg,
                        'success',
                        'Download Report',
                        () => this.downloadReportDirectly(data.request_id, format),
                        false // autoDismiss: false -> stays until notification icon clicked
                      );
                      this.showNativeNotification(title, msg);
                    }
                  }
                } else if (data.status === 'REJECTED') {
                  const title = '❌ Report Request Rejected';
                  const msg = `Your candidate report request was rejected by ${approver}.`;
                  this.showToast(
                    title,
                    msg,
                    'error',
                    'View Details',
                    () => {
                      this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
                    },
                    false // autoDismiss: false
                  );
                  this.showNativeNotification(title, msg);
                }
              }
            }
          });

          this.isInitialRecruiterLoad = false;
        },
        error => {
          console.warn('ApprovalNotificationService: Recruiter snapshot error:', error);
          this.currentListeningRecruiterId = null;
        }
      );
    } catch (err) {
      console.warn('ApprovalNotificationService: Failed to start Recruiter listener:', err);
      this.currentListeningRecruiterId = null;
    }
  }

  /**
   * Directly downloads approved report in the background from any page.
   */
  public downloadReportDirectly(requestId: string, format: string = 'xlsx'): void {
    try {
      const bulkService = this.injector.get(RecruiterWorkflowBulkImportService);
      this.showToast('📥 Downloading Report', 'Fetching your approved report file...', 'info');

      bulkService.downloadApprovedReport(requestId).subscribe({
        next: (blob: Blob) => {
          const ext = format === 'csv' ? 'csv' : 'xlsx';
          const filename = `Candidate_Report_${requestId.substring(0, 8)}.${ext}`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.showToast('✅ Download Complete', `Report "${filename}" downloaded successfully.`, 'success');
        },
        error: (err) => {
          console.error('Direct download failed:', err);
          this.showToast('❌ Download Failed', 'Could not download report file. Click to view requests tab.', 'error', 'View Tab', () => {
            this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
          });
        }
      });
    } catch (e) {
      console.warn('Could not trigger direct download:', e);
      this.router.navigate(['/recruiter-workflow-bulk-import'], { queryParams: { tab: 'approvals' } });
    }
  }

  public stopListeningSuperAdmin(): void {
    if (this.superAdminUnsubscribe) {
      this.superAdminUnsubscribe();
      this.superAdminUnsubscribe = null;
    }
    this.isSuperAdminListening = false;
  }

  public stopListeningRecruiter(): void {
    if (this.recruiterUnsubscribe) {
      this.recruiterUnsubscribe();
      this.recruiterUnsubscribe = null;
    }
    this.currentListeningRecruiterId = null;
  }

  public stopListening(): void {
    this.stopListeningSuperAdmin();
    this.stopListeningRecruiter();
    if (this.heartbeatSub) {
      this.heartbeatSub.unsubscribe();
      this.heartbeatSub = null;
    }
    if (typeof document !== 'undefined' && this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
    this.stopTitleFlash();
  }

  ngOnDestroy(): void {
    this.stopListening();
  }
}
