// src/app/services/auth-broadcast.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type AuthBroadcastMessage =
  | { type: 'TOKEN_REFRESHED'; accessToken: string; refreshToken?: string; timestamp: number }
  | { type: 'LOGOUT'; timestamp: number }
  | { type: 'LOGIN_SUCCESS'; accessToken: string; refreshToken?: string; timestamp: number };

@Injectable({
  providedIn: 'root'
})
export class AuthBroadcastService implements OnDestroy {
  private channel: BroadcastChannel | null = null;
  private messageSubject = new Subject<AuthBroadcastMessage>();

  public readonly messages$: Observable<AuthBroadcastMessage> = this.messageSubject.asObservable();

  constructor() {
    this.initChannel();
  }

  private initChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('flashyre_auth');
        this.channel.onmessage = (event: MessageEvent) => {
          if (event && event.data && event.data.type) {
            this.messageSubject.next(event.data as AuthBroadcastMessage);
          }
        };
      } catch (err) {
        console.warn('[AuthBroadcastService] BroadcastChannel not supported or failed to initialize:', err);
      }
    }
  }

  public broadcastTokenRefreshed(accessToken: string, refreshToken?: string): void {
    const payload: AuthBroadcastMessage = {
      type: 'TOKEN_REFRESHED',
      accessToken,
      refreshToken,
      timestamp: Date.now()
    };
    this.postMessage(payload);
  }

  public broadcastLogout(): void {
    const payload: AuthBroadcastMessage = {
      type: 'LOGOUT',
      timestamp: Date.now()
    };
    this.postMessage(payload);
  }

  public broadcastLogin(accessToken: string, refreshToken?: string): void {
    const payload: AuthBroadcastMessage = {
      type: 'LOGIN_SUCCESS',
      accessToken,
      refreshToken,
      timestamp: Date.now()
    };
    this.postMessage(payload);
  }

  private postMessage(message: AuthBroadcastMessage): void {
    try {
      if (this.channel) {
        this.channel.postMessage(message);
      }
    } catch (err) {
      console.warn('[AuthBroadcastService] Failed to post message across BroadcastChannel:', err);
    }
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.messageSubject.complete();
  }
}
