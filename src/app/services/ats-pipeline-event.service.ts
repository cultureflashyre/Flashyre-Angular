import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
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
  limit
} from 'firebase/firestore';
import { ApprovalNotificationService } from './approval-notification.service';

export interface AtsPipelineEvent {
  event_id: string;
  action_type: 'STAGE_CHANGE' | 'ADDED_TO_PIPELINE' | 'INTERVIEW_SCHEDULED' | 'REJECTED';
  candidate_id: number;
  candidate_name: string;
  job_requirement_id: number;
  job_title: string;
  client_name: string;
  new_stage: string;
  old_stage?: string;
  interview_date?: string;
  rejection_reason?: string;
  acted_by_id: string;
  acted_by_name: string;
  target_user_ids: string[];
  created_at: string;
  consumed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AtsPipelineEventService implements OnDestroy {

  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isFirebaseReady = false;

  private unsubscribe: Unsubscribe | null = null;
  private currentListeningUserId: string | null = null;
  private isInitialLoad = true;
  private processedEventIds = new Set<string>();

  // Stream of pipeline events for consumers (candidate page, ATS page)
  private pipelineEvents$ = new Subject<AtsPipelineEvent>();
  public pipelineEvents: Observable<AtsPipelineEvent> = this.pipelineEvents$.asObservable();

  // Count of unread pipeline events
  private unreadPipelineCount$ = new BehaviorSubject<number>(0);
  public unreadPipelineCount: Observable<number> = this.unreadPipelineCount$.asObservable();

  constructor(private notificationService: ApprovalNotificationService) {
    this.initFirebase();
  }

  private initFirebase(): void {
    try {
      const fbConfig = (environment as any).firebase;
      if (!fbConfig || !fbConfig.projectId) {
        console.warn('[ATS Events] Firebase configuration missing.');
        return;
      }
      this.app = getApps().length > 0 ? getApp() : initializeApp(fbConfig);
      this.db = getFirestore(this.app);
      this.isFirebaseReady = true;
      console.log('[ATS Events] Firebase Firestore initialized successfully.');
    } catch (err) {
      console.error('[ATS Events] Firebase init failed:', err);
    }
  }

  /**
   * Start listening for real-time ATS pipeline events for the specified user.
   */
  public startListening(userId: string): void {
    const cleanUserId = String(userId || '').trim();
    if (!cleanUserId) return;
    if (this.currentListeningUserId === cleanUserId && this.unsubscribe) {
      return;
    }
    this.stopListening();

    if (!this.isFirebaseReady || !this.db) {
      this.initFirebase();
      if (!this.db) {
        console.warn('[ATS Events] Firestore db unavailable, cannot start listener.');
        return;
      }
    }

    try {
      this.isInitialLoad = true;
      this.currentListeningUserId = cleanUserId;

      const eventsCol = collection(this.db, 'ats_pipeline_events');
      // Direct array-contains query (requires no complex composite index to work immediately)
      const q = query(
        eventsCol,
        where('target_user_ids', 'array-contains', cleanUserId),
        limit(50)
      );

      console.log(`[ATS Events] 🎧 Subscribing to ats_pipeline_events for user: ${cleanUserId}`);

      this.unsubscribe = onSnapshot(
        q,
        snapshot => {
          if (this.isInitialLoad) {
            // Seed already existing events so we don't display old toasts
            snapshot.docs.forEach(doc => {
              this.processedEventIds.add(doc.id);
            });
            this.isInitialLoad = false;
            console.log(`[ATS Events] Initial load complete (${snapshot.docs.length} past events tracked).`);
            return;
          }

          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data() as AtsPipelineEvent;
              const eventId = data.event_id || change.doc.id;

              if (!this.processedEventIds.has(eventId)) {
                this.processedEventIds.add(eventId);

                console.log('[ATS Events] 🔥 Real-time ATS pipeline event received:', data);

                // 1. Emit to active component subscribers (auto-refreshes candidate table)
                this.pipelineEvents$.next(data);

                // 2. Display toast notification & play audio chime
                this.showPipelineToast(data);

                // 3. Update unread counter
                this.unreadPipelineCount$.next(this.unreadPipelineCount$.getValue() + 1);
              }
            }
          });
        },
        error => {
          console.error('[ATS Events] Snapshot listener error:', error);
          this.currentListeningUserId = null;
        }
      );
    } catch (err) {
      console.error('[ATS Events] Failed to start listener:', err);
      this.currentListeningUserId = null;
    }
  }

  /**
   * Stop listening for events.
   */
  public stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.currentListeningUserId = null;
    this.isInitialLoad = true;
  }

  public clearUnreadCount(): void {
    this.unreadPipelineCount$.next(0);
  }

  /**
   * Dispatch toast notification based on event type.
   */
  private showPipelineToast(event: AtsPipelineEvent): void {
    let title = '📋 ATS Pipeline Update';
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    const actor = event.acted_by_name || 'Recruiter';
    const cand = event.candidate_name || `Candidate #${event.candidate_id}`;

    switch (event.action_type) {
      case 'STAGE_CHANGE':
        if (event.new_stage === 'Hired') {
          title = '🎉 Candidate Hired!';
          message = `${actor} moved ${cand} to Hired for ${event.client_name || event.job_title}`;
          type = 'success';
        } else if (event.new_stage === 'Offer') {
          title = '💼 Offer Extended';
          message = `${actor} moved ${cand} to Offer stage for ${event.client_name || event.job_title}`;
          type = 'success';
        } else if (event.new_stage === 'Interview') {
          title = '📅 Candidate in Interview';
          message = `${actor} moved ${cand} to Interview stage`;
          type = 'info';
        } else {
          title = `📋 Pipeline Stage: ${event.new_stage}`;
          const old = event.old_stage ? ` from ${event.old_stage}` : '';
          message = `${actor} moved ${cand}${old} → ${event.new_stage}`;
          type = 'info';
        }
        break;

      case 'INTERVIEW_SCHEDULED':
        title = '📅 Interview Scheduled';
        message = `${actor} scheduled an interview for ${cand}`;
        if (event.interview_date) {
          message += ` on ${event.interview_date}`;
        }
        type = 'info';
        break;

      case 'ADDED_TO_PIPELINE':
        title = '➕ Candidate Added to Pipeline';
        message = `${actor} added ${cand} to ${event.client_name || 'Job'} — ${event.job_title || ''}`;
        type = 'info';
        break;

      case 'REJECTED':
        title = '❌ Candidate Dropped / Rejected';
        message = `${actor} rejected ${cand}`;
        if (event.rejection_reason) {
          message += `: ${event.rejection_reason.slice(0, 60)}`;
        }
        type = 'warning';
        break;

      default:
        message = `${actor} updated ${cand} stage to ${event.new_stage}`;
        break;
    }

    try {
      this.notificationService.showToast(title, message, type, undefined, undefined, true);
      this.notificationService.playGentleChime();
    } catch (e) {
      console.warn('[ATS Events] Could not dispatch toast via notificationService:', e);
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
  }
}
