import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { io, Socket } from 'socket.io-client'; // You'll need to install socket.io-client

@Injectable({
  providedIn: 'root' // Provided in root to make it a singleton
})
export class AssessmentDataService {
  private baseUrl = environment.apiUrl;
  private socket: Socket;

  // BehaviorSubject will hold the current list of assessments and notify all subscribers of changes.
  private _assessments$ = new BehaviorSubject<any[]>([]);
  // Expose the assessments as a public observable. Components will subscribe to this.
  public readonly assessments$: Observable<any[]> = this._assessments$.asObservable();

  // BehaviorSubject to manage the loading state
  private _loading$ = new BehaviorSubject<boolean>(false);
  public readonly loading$: Observable<boolean> = this._loading$.asObservable();

  constructor(private http: HttpClient) {
    // 1. Establish WebSocket connection when the service is initialized.
    this.socket = io(environment.websocketUrl); // Add websocketUrl to your environment files

    // 2. Listen for a specific event from the backend (e.g., 'assessments_updated').
    //    When this event is received, it means we need to refresh our data.
    this.socket.on('assessments_updated', () => {
      console.log('Received assessments_updated event. Refreshing data...');
      this.forceRefreshAssessments();
    });
  }

  // This method will be called by components to get the assessment list.
  loadAssessments() {
    // If we already have data, don't fetch it again.
    if (this._assessments$.getValue().length > 0) {
      return;
    }
    this._fetchAssessments();
  }

  // Forces a new fetch from the API.
  forceRefreshAssessments() {
    this._fetchAssessments();
  }

  private _fetchAssessments() {
    this._loading$.next(true); // Set loading to true
    this.http.get<any[]>(`${this.baseUrl}api/assessments/assessment-list/`).pipe(
      tap(data => {
        // On success, update the BehaviorSubject with the new data.
        console.log("Fetched Assessments...", data);
        this._assessments$.next(data);
        this._loading$.next(false); // Set loading to false
      }),
      catchError(error => {
        console.error('Error fetching assessments:', error);
        this._assessments$.next([]); // On error, clear the data
        this._loading$.next(false); // Set loading to false
        return of([]); // Return an empty array to complete the stream
      })
    ).subscribe();
  }

  // Clean up the connection when the service is destroyed (e.g., on app close/logout).
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}