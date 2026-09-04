import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ApprovalNotificationService,
  ToastMessage
} from '../../services/approval-notification.service';

@Component({
  standalone: true,
  selector: 'app-toast-notification',
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.css'],
  imports: [CommonModule]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  toasts: (ToastMessage & { timeoutId?: any })[] = [];
  private subs = new Subscription();

  constructor(private notificationService: ApprovalNotificationService) {}

  ngOnInit(): void {
    this.subs.add(
      this.notificationService.toastMessages.subscribe(toast => {
        this.addToast(toast);
      })
    );

    this.subs.add(
      this.notificationService.alertsDismissed.subscribe(() => {
        // Clear toasts when user clicks notification bell or acknowledges
        this.toasts.forEach(t => {
          if (t.timeoutId) clearTimeout(t.timeoutId);
        });
        this.toasts = [];
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.toasts.forEach(t => {
      if (t.timeoutId) clearTimeout(t.timeoutId);
    });
  }

  addToast(toast: ToastMessage): void {
    const shouldAutoDismiss = toast.autoDismiss !== false;
    let timeoutId: any = null;

    if (shouldAutoDismiss) {
      const duration = toast.actionLabel ? 10000 : 6000;
      timeoutId = setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }

    const toastWithTimer = {
      ...toast,
      timeoutId
    };

    // Keep maximum 4 toasts visible simultaneously
    if (this.toasts.length >= 4) {
      const removed = this.toasts.shift();
      if (removed?.timeoutId) clearTimeout(removed.timeoutId);
    }

    this.toasts.push(toastWithTimer);
  }

  removeToast(id: string): void {
    const idx = this.toasts.findIndex(t => t.id === id);
    if (idx !== -1) {
      if (this.toasts[idx].timeoutId) {
        clearTimeout(this.toasts[idx].timeoutId);
      }
      this.toasts.splice(idx, 1);
    }
  }

  onActionClick(toast: ToastMessage): void {
    this.notificationService.markNotificationsAsSeen();
    if (toast.actionCallback) {
      toast.actionCallback();
    }
    this.removeToast(toast.id);
  }
}
