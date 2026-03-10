import { Injectable } from '@angular/core';
import { Observable, interval, from, of } from 'rxjs';
import { switchMap, takeWhile, tap, finalize, catchError, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PollingService {

  constructor() { }

  /**
   * Polls an observable function until a condition is met or timeout occurs.
   * @param requestFn The function that returns an Observable (e.g., api call).
   * @param intervalMs Time between polls in milliseconds (default: 3000).
   * @param timeoutMs Max duration in milliseconds (default: 60000).
   */
  poll<T>(requestFn: () => Observable<T>, intervalMs: number = 3000, timeoutMs: number = 60000): Observable<T> {
    const maxAttempts = timeoutMs / intervalMs;
    let attempts = 0;

    return interval(intervalMs).pipe(
      take(maxAttempts),
      switchMap(() => {
        attempts++;
        return requestFn();
      }),
      // Add your completion logic inside takeWhile
      // Example: (res: any) => res.status === 'COMPLETED' || res.status === 'FAILED'
    );
  }
}
