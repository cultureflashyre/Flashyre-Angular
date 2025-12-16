import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment'; // Make sure this path is correct for your project

@Injectable({ providedIn: 'root' })
export class VideoRecorderService {

  private userId!: string;
  private assessmentId!: string;
  private videoId!: string;
 
  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {
    console.log('VideoRecorderService instantiated');
  }
 
  // Using environment variable for apiUrl is a best practice.
  // Ensure your environment.ts file has: apiUrl: 'http://localhost:8000/'
  private apiUrl = environment.apiUrl; 
 
  private mediaRecorder!: MediaRecorder;
  private stream!: MediaStream;
  private recordedChunks: Blob[] = [];
  private videoPath: string | null = null;

  // Promise resolver for stopRecording
  private stopRecordingResolve!: (value: string | null) => void;

  private generateUniqueVideoId(): string {
    return 'vid-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
  }
 
  async checkCameraAndMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // If we reach here, both camera and microphone permissions were granted
      // Stop all tracks to release the camera and microphone
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera or microphone access denied:', error);
      return false;
    }
  }
 
  async startRecording(userId: string, assessmentId: string, videoId?: string): Promise<void> {
    if(this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.warn('MediaRecorder already recording, ignoring startRecording.');
      return;
    }
    console.log('startRecording called');
    
    this.userId = userId;
    this.assessmentId = assessmentId;
    this.videoId = videoId ?? this.generateUniqueVideoId();
    this.recordedChunks = [];
    this.videoPath = null;

    try {
      // Show spinner only for the initial device setup.
      this.spinner.show(); 

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
 
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm'
      });
 
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          // This function will now handle authentication and retries internally.
          this.uploadChunk(event.data);
        }
      };

      // Handle stop event to resolve the stopRecording promise
      this.mediaRecorder.onstop = () => {
        if (this.stopRecordingResolve) {
          this.stopRecordingResolve(this.videoPath);
        }
      };
 
      this.mediaRecorder.start(300000); // Create a chunk every 5 minutes
     
      // Add video preview (optional, can be uncommented if a live preview is needed)
      //const videoElement = document.createElement('video');
      //videoElement.srcObject = this.stream;
      //videoElement.autoplay = true;
      //document.getElementById('video-container')?.appendChild(videoElement);
 
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    } finally {
      this.spinner.hide(); // Hide spinner after the setup phase is complete
    }
  }

  /**
   * Upload chunk to backend with a limited retry mechanism.
   * @param chunk The video data blob.
   * @param retries The number of attempts remaining.
   */
  private uploadChunk(chunk: Blob, retries = 3): void {
    
    // ##########################################################################
    // ### THE FINAL FIX - USING THE CORRECT KEY NAME ###
    //
    // This has been updated to 'jwtToken' as per your confirmation.
    // This will now correctly find the token in local storage.
    //
    const tokenKey = 'jwtToken'; 
    //
    // ##########################################################################
    const token = localStorage.getItem(tokenKey);

    // If the token is not found and we still have retries left...
    if (!token && retries > 0) {
      console.warn(`Token with key '${tokenKey}' not found. Retrying in 2 seconds... (${retries} attempts left)`);
      setTimeout(() => {
        this.uploadChunk(chunk, retries - 1); // Retry with one less attempt.
      }, 2000);
      return; // Stop the current attempt.
    }

    // If the token is still not found after all retries, give up and log an error.
    if (!token) {
      console.error(`Authentication token could not be found with key '${tokenKey}' after multiple attempts. Video upload aborted.`);
      return;
    }

    const formData = new FormData();
    formData.append('video_chunk', chunk);
    formData.append('timestamp', new Date().toISOString());
    // Pass IDs that are safe for the backend to use
    formData.append('assessment_id', this.assessmentId);
    formData.append('video_id', this.videoId);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // This HTTP request is silent (no spinner) and authenticated.
    this.http.post(`${this.apiUrl}trial_assessments/save-video/`, formData, { headers }).subscribe({
      next: (response: any) => {
        if (response.videoPath) {
          console.log("Background video chunk uploaded successfully. URL:", response.videoPath);
          this.videoPath = response.videoPath;
        }
      },
      error: (error) => {
        // This will log any server-side errors for the background upload
        // without interrupting the user's assessment.
        console.error('Background chunk upload failed:', error);
      }
    });
  }
 
  getVideoPath(): string | null {
    return this.videoPath;
  }
 
  /**
   * Stop recording and return a Promise that resolves with the video path URL
   */
  stopRecording(): Promise<string | null> {
    return new Promise((resolve) => {
      if (this.mediaRecorder?.state === 'recording') {
        this.stopRecordingResolve = resolve;
        // Calling .stop() will trigger the onstop event handler we defined earlier.
        this.mediaRecorder.stop();
        this.stream.getTracks().forEach(track => track.stop());
      } else {
        // If recording wasn't active, resolve immediately with whatever path we have.
        resolve(this.videoPath);
      }
    });
  }
}