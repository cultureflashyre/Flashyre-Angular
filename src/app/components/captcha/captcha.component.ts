import { Component, AfterViewInit, OnDestroy, Output, Input, EventEmitter, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

declare global {
  interface Window { turnstile?: any; }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileScript: Promise<void> | null = null;

/** Loads the Turnstile script once per page; later calls reuse the same promise. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileScript) {
    turnstileScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TURNSTILE_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { turnstileScript = null; reject(new Error('Turnstile failed to load')); };
      document.head.appendChild(s);
    });
  }
  return turnstileScript;
}

/**
 * Cloudflare Turnstile security check. Keeps the old math-captcha contract:
 * emits { captchaId, captchaAnswer } where captchaAnswer is the Turnstile token
 * (verified server-side at siteverify) and loadNewCaptcha() resets the widget.
 */
@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {
  /** Must match the action the backend expects ('login' or 'signup'). */
  @Input() action: string = 'login';
  @Output() captchaData = new EventEmitter<{ captchaId: string, captchaAnswer: string }>();
  @ViewChild('box', { static: true }) box!: ElementRef<HTMLElement>;

  loadError: boolean = false;
  private widgetId: string | null = null;

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    this.renderWidget();
  }

  ngOnDestroy() {
    if (this.widgetId && window.turnstile) window.turnstile.remove(this.widgetId);
  }

  private renderWidget() {
    this.loadError = false;
    loadTurnstile().then(() => {
      if (this.widgetId || !this.box) return;
      this.widgetId = window.turnstile.render(this.box.nativeElement, {
        sitekey: environment.turnstileSiteKey,
        action: this.action,
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => this.emit(token),
        'expired-callback': () => this.emit(''),
        'timeout-callback': () => this.emit(''),
        'error-callback': () => { this.emit(''); },
      });
    }).catch(() => this.zone.run(() => this.loadError = true));
  }

  private emit(token: string) {
    this.zone.run(() => this.captchaData.emit({ captchaId: token ? 'turnstile' : '', captchaAnswer: token }));
  }

  /** Gets a fresh token (tokens are single-use, so call after every failed submit). */
  loadNewCaptcha() {
    this.emit('');
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    } else {
      this.renderWidget();
    }
  }
}
