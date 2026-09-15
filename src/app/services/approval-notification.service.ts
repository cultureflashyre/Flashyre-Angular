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

  // Time window constant (5 days) and storage key prefix
  public readonly MAX_NOTIFICATION_DAYS = 5;
  private readonly STORAGE_KEY_LAST_SEEN_PREFIX = 'flashyre_notif_last_seen_';

  // Unread badge count observable (cleared on exit)
  private unreadCount$ = new BehaviorSubject<number>(0);
  public unreadCount: Observable<number> = this.unreadCount$.asObservable();

  // Total recent count in last 5 days (for See More calculation)
  private totalRecentCount$ = new BehaviorSubject<number>(0);
  public totalRecentCount: Observable<number> = this.totalRecentCount$.asObservable();

  // Real-time pending count observable for Super Admin badges
  private pendingCount$ = new BehaviorSubject<number>(0);
  public pendingCount: Observable<number> = this.pendingCount$.asObservable();

  // Real-time approved reports count observable for Recruiter badges
  private approvedReportsCount$ = new BehaviorSubject<number>(0);
  public approvedReportsCount: Observable<number> = this.approvedReportsCount$.asObservable();

  // Active approval request items for dropdown preview (capped at 5 recent)
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

  // Firebase diagnostics & health tracking
  private lastSnapshotTime: Date | null = null;
  private lastFirebaseError: any = null;
  private lastSnapshotDocCount: number = 0;

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
    this.registerGlobalDebugHelper();
  }

  /**
   * Registers `window.checkFirebaseStatus()` so developers and testers can check
   * Firebase connectivity instantly from the browser DevTools Console (F12).
   */
  private registerGlobalDebugHelper(): void {
    if (typeof window !== 'undefined') {
      (window as any).checkFirebaseStatus = () => this.checkFirebaseStatus();
      (window as any).checkFirebase = () => this.checkFirebaseStatus();
    }
  }

  /**
   * Returns a complete diagnostic summary and prints a styled table to the console.
   */
  public checkFirebaseStatus(): any {
    const fbConfig = (environment as any).firebase || {};
    const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                    (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');

    const statusObj = {
      'Firebase Initialized': this.isFirebaseReady ? 'YES' : 'NO',
      'Target Project ID': fbConfig.projectId || 'Missing',
      'Auth Domain': fbConfig.authDomain || 'Missing',
      'Firestore Database': this.db ? 'Active Instance' : 'Missing / Inactive',
      'User Role Mode': isSuper ? 'Super Admin' : (userId ? `Recruiter (ID: ${userId})` : 'Anonymous / Not Logged In'),
      'Super Admin Listener': this.isSuperAdminListening ? 'Listening (onSnapshot active)' : 'Inactive',
      'Recruiter Listener': this.currentListeningRecruiterId ? `Listening (User: ${this.currentListeningRecruiterId})` : 'Inactive',
      'Real-time Snapshots Received': this.lastSnapshotTime ? `Yes, ${this.lastSnapshotDocCount} docs at ${this.lastSnapshotTime.toLocaleTimeString()}` : 'No snapshots received yet',
      'Pending Requests (Total)': this.pendingCount$.getValue(),
      'Approved Reports (Total)': this.approvedReportsCount$.getValue(),
      'Unread Badge Count': this.unreadCount$.getValue(),
      'Total Recent in 5 Days': this.totalRecentCount$.getValue(),
      'Last Seen Timestamp': this.getLastSeenTimestamp().toLocaleTimeString(),
      '15s Polling Heartbeat': this.heartbeatSub ? 'Running' : 'Stopped',
      'Last Error': this.lastFirebaseError ? (this.lastFirebaseError.message || String(this.lastFirebaseError)) : 'None (Healthy)'
    };

    console.group('%c[FLASHYRE FIREBASE FIRESTORE DIAGNOSTIC REPORT]', 'color: #FFA000; font-size: 13px; font-weight: bold;');
    console.table(statusObj);
    if (this.lastFirebaseError) {
      console.error('[Firebase Firestore] Last Error Details:', this.lastFirebaseError);
      console.warn('[Firebase Firestore] If permission-denied or service-disabled, verify Firestore API in GCP and Firestore Security Rules.');
    } else if (this.lastSnapshotTime) {
      console.log('%c[Firebase Firestore] Real-time connection is healthy and receiving push updates.', 'color: #4CAF50; font-weight: bold;');
    }
    console.groupEnd();

    return statusObj;
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
        console.warn('%c[Firebase Firestore] Firebase configuration missing in environment.', 'color: #FF5722; font-weight: bold;');
        return;
      }

      this.app = getApps().length > 0 ? getApp() : initializeApp(fbConfig);
      this.db = getFirestore(this.app);
      this.isFirebaseReady = true;
      console.log(`%c[Firebase Firestore] Client initialized successfully with project: ${fbConfig.projectId}`, 'color: #4CAF50; font-weight: bold;');
    } catch (err: any) {
      this.lastFirebaseError = err;
      console.error('%c[Firebase Firestore] Could not initialize Firebase:', 'color: #F44336; font-weight: bold;', err);
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
   * Evaluates if a notification timestamp is within the last 5 days.
   */
  public isWithinLast5Days(dateString?: string): boolean {
    if (!dateString) return true;
    try {
      const itemTime = new Date(dateString).getTime();
      if (isNaN(itemTime)) return true;
      const fiveDaysAgo = Date.now() - (this.MAX_NOTIFICATION_DAYS * 24 * 60 * 60 * 1000);
      return itemTime >= fiveDaysAgo;
    } catch {
      return true;
    }
  }

  /**
   * Retrieves the timestamp of when the user last closed/viewed the notification dropdown.
   */
  public getLastSeenTimestamp(): Date {
    if (typeof localStorage === 'undefined') return new Date(0);
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId') || 'anon';
    const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                    (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
    const key = `${this.STORAGE_KEY_LAST_SEEN_PREFIX}${isSuper ? 'admin' : userId}`;
    const stored = localStorage.getItem(key);
    return stored ? new Date(stored) : new Date(0);
  }

  /**
   * Checks if an individual notification item is unread (created after lastSeenTimestamp).
   */
  public isItemUnread(item: any): boolean {
    if (!item) return false;
    const itemTimeStr = item.created_at || item.updated_at;
    if (!itemTimeStr) return false;
    const itemTime = new Date(itemTimeStr).getTime();
    if (isNaN(itemTime)) return false;
    const lastSeenTime = this.getLastSeenTimestamp().getTime();
    return itemTime > lastSeenTime;
  }

  /**
   * Marks current active pending/approved requests as acknowledged/seen by user.
   * Updates lastSeenTimestamp in localStorage and resets unreadCount to 0,
   * causing the bell badge count to disappear (Facebook/Instagram pattern).
   */
  public markNotificationsAsSeen(): void {
    if (typeof localStorage !== 'undefined') {
      const userId = localStorage.getItem('user_id') || localStorage.getItem('userId') || 'anon';
      const isSuper = localStorage.getItem('isSuperUser') === 'true' ||
                      (localStorage.getItem('userType') || '').toLowerCase() === 'admin';
      const key = `${this.STORAGE_KEY_LAST_SEEN_PREFIX}${isSuper ? 'admin' : userId}`;
      localStorage.setItem(key, new Date().toISOString());

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
    }

    // Immediately clear unread badge count
    this.unreadCount$.next(0);
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
          this.handlePendingRequestsUpdate(results);
        },
        error: (err) => console.warn('Failed to fetch pending requests list:', err)
      });
    } catch (e) {
      console.warn('Error refreshing pending requests:', e);
    }
  }

  private handlePendingRequestsUpdate(list: any[]): void {
    const rawList = list || [];
    // Filter to items within the last 5 days
    const recent5Days = rawList.filter(item => this.isWithinLast5Days(item.created_at || item.updated_at));
    this.totalRecentCount$.next(recent5Days.length);
    this.pendingRequests$.next(recent5Days.slice(0, 5));

    // Calculate unread badge count against lastSeenTimestamp
    const lastSeen = this.getLastSeenTimestamp().getTime();
    const unread = recent5Days.filter(item => {
      const t = new Date(item.created_at || item.updated_at || 0).getTime();
      return t > lastSeen;
    }).length;
    this.unreadCount$.next(unread);

    if (recent5Days.length === 0) {
      this.latestPendingRequestId = null;
      this.hasUnacknowledgedAlert$.next(false);
      return;
    }

    const latest = recent5Days[0];
    const latestId = String(latest.id || latest.request_id);
    this.latestPendingRequestId = latestId;
    const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY_PENDING) : null;

    if (storedId === latestId) {
      this.hasUnacknowledgedAlert$.next(false);
    } else {
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
          false // autoDismiss: false
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
          this.handleApprovedRequestsUpdate(approved);
        },
        error: (err) => console.warn('Failed to fetch my approval requests:', err)
      });
    } catch (e) {
      console.warn('Error refreshing recruiter approved requests:', e);
    }
  }

  private handleApprovedRequestsUpdate(list: any[]): void {
    const rawList = list || [];
    // Filter to items within the last 5 days
    const recent5Days = rawList.filter(item => this.isWithinLast5Days(item.updated_at || item.created_at));
    this.totalRecentCount$.next(recent5Days.length);
    this.myApprovedRequests$.next(recent5Days.slice(0, 5));

    // Calculate unread badge count against lastSeenTimestamp
    const lastSeen = this.getLastSeenTimestamp().getTime();
    const unread = recent5Days.filter(item => {
      const t = new Date(item.updated_at || item.created_at || 0).getTime();
      return t > lastSeen;
    }).length;
    this.unreadCount$.next(unread);

    if (recent5Days.length === 0) {
      this.latestApprovedRequestId = null;
      this.hasUnacknowledgedAlert$.next(false);
      return;
    }

    const latest = recent5Days[0];
    const latestId = String(latest.id || latest.request_id);
    this.latestApprovedRequestId = latestId;
    const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY_APPROVED) : null;

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
          false // autoDismiss: false
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

      console.log('%c[Firebase Firestore] 🎧 Subscribing to "report_approval_notifications" (target_role == "super_admin", status == "PENDING")...', 'color: #2196F3;');

      this.superAdminUnsubscribe = onSnapshot(
        q,
        snapshot => {
          const count = snapshot.size;
          this.lastSnapshotTime = new Date();
          this.lastSnapshotDocCount = count;
          this.lastFirebaseError = null;

          console.log(`%c[Firebase Firestore] 📥 Super Admin snapshot received: ${count} pending request(s) found in Firestore.`, 'color: #4CAF50; font-weight: bold;');

          // Collect docs and update recent 5-day list and unread count directly from snapshot
          const snapshotDocs: any[] = [];
          snapshot.forEach(doc => {
            snapshotDocs.push({ id: doc.id, ...doc.data() });
          });
          const recent5Days = snapshotDocs.filter(d => this.isWithinLast5Days(d.created_at || d.updated_at));
          this.totalRecentCount$.next(recent5Days.length);
          this.pendingCount$.next(recent5Days.length);
          this.pendingRequests$.next(recent5Days.slice(0, 5));

          const lastSeen = this.getLastSeenTimestamp().getTime();
          const unread = recent5Days.filter(d => new Date(d.created_at || d.updated_at || 0).getTime() > lastSeen).length;
          this.unreadCount$.next(unread);

          if (recent5Days.length === 0) {
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
          this.lastFirebaseError = error;
          console.error('%c[Firebase Firestore] ❌ Super Admin snapshot error:', 'color: #F44336; font-weight: bold;', error);
          console.warn('[Firebase Firestore] 💡 If this is permission-denied or service-disabled, check GCP Console or run "python manage.py check_firebase" on Django backend.');
          this.isSuperAdminListening = false;
        }
      );
    } catch (err: any) {
      this.lastFirebaseError = err;
      console.error('%c[Firebase Firestore] ❌ Failed to start Super Admin listener:', 'color: #F44336; font-weight: bold;', err);
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

      console.log(`%c[Firebase Firestore] 🎧 Subscribing to "report_approval_notifications" (target_user_id == "${userId}", type == "STATUS_CHANGE")...`, 'color: #2196F3;');

      this.recruiterUnsubscribe = onSnapshot(
        q,
        snapshot => {
          this.lastSnapshotTime = new Date();
          this.lastSnapshotDocCount = snapshot.size;
          this.lastFirebaseError = null;

          console.log(`%c[Firebase Firestore] 📥 Recruiter snapshot received: ${snapshot.size} notification doc(s) found in Firestore.`, 'color: #4CAF50; font-weight: bold;');

          const snapshotDocs: any[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            if (d['status'] === 'APPROVED') {
              snapshotDocs.push({ id: doc.id, ...d });
            }
          });
          const recent5Days = snapshotDocs.filter(d => this.isWithinLast5Days(d.updated_at || d.created_at));
          this.totalRecentCount$.next(recent5Days.length);
          this.approvedReportsCount$.next(recent5Days.length);
          this.myApprovedRequests$.next(recent5Days.slice(0, 5));

          const lastSeen = this.getLastSeenTimestamp().getTime();
          const unread = recent5Days.filter(d => new Date(d.updated_at || d.created_at || 0).getTime() > lastSeen).length;
          this.unreadCount$.next(unread);

          if (recent5Days.length === 0) {
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
          this.lastFirebaseError = error;
          console.error('%c[Firebase Firestore] ❌ Recruiter snapshot error:', 'color: #F44336; font-weight: bold;', error);
          console.warn('[Firebase Firestore] 💡 If this is permission-denied or service-disabled, check GCP Console or run "python manage.py check_firebase" on Django backend.');
          this.currentListeningRecruiterId = null;
        }
      );
    } catch (err: any) {
      this.lastFirebaseError = err;
      console.error('%c[Firebase Firestore] ❌ Failed to start Recruiter listener:', 'color: #F44336; font-weight: bold;', err);
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
