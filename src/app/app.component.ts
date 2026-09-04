
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastNotificationComponent } from './components/toast-notification/toast-notification.component';
import { GlobalNotificationBarComponent } from './components/global-notification-bar/global-notification-bar.component';
import { ApprovalNotificationService } from './services/approval-notification.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,                   // This makes <router-outlet> available in your template
    NgxSpinnerModule,               // This makes <ngx-spinner> available in your template
    ToastNotificationComponent,      // Real-time approval alerts globally across all pages
    GlobalNotificationBarComponent  // Global top banner for pending approvals and downloads
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Flashyre';
  private routerSub: Subscription | null = null;

  constructor(
    private notificationService: ApprovalNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize global notification listeners on app startup
    this.notificationService.initGlobalListeners();

    // Re-verify on route changes in case user just authenticated
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.notificationService.initGlobalListeners();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
  }
}
