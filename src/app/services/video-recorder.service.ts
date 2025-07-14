
 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
 
@Injectable({ providedIn: 'root' })
export class VideoRecorderService {

  private userId!: string;
  private assessmentId!: string;
  private videoId!: string;
 
  constructor(private http: HttpClient) { }
 
  private apiUrl = 'http://localhost:8000/trial_assessments';
 
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
    this.userId = userId;
    this.assessmentId = assessmentId;
    this.videoId = videoId ?? this.generateUniqueVideoId();
    this.recordedChunks = [];
    this.videoPath = null;

    try {
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
          this.uploadChunk(event.data);
        }
      };

      // Handle stop event to upload last chunk and resolve stopRecording promise
      this.mediaRecorder.onstop = () => {
        // Upload the last chunk (if any)
        if (this.recordedChunks.length > 0) {
          const lastChunk = this.recordedChunks[this.recordedChunks.length - 1];
          this.uploadChunk(lastChunk, true); // Pass flag to indicate last chunk
        } else {
          // No chunks recorded, resolve immediately
          if (this.stopRecordingResolve) {
            this.stopRecordingResolve(this.videoPath);
          }
        }
      };
 
      this.mediaRecorder.start(300000); // 5 minute chunks
     
      // Add video preview
      //const videoElement = document.createElement('video');
      //videoElement.srcObject = this.stream;
      //videoElement.autoplay = true;
      //document.getElementById('video-container')?.appendChild(videoElement);
 
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

    /**
   * Upload chunk to backend.
   * @param chunk Blob chunk to upload
   * @param isLastChunk boolean to indicate if this is the final chunk
   */

  private uploadChunk(chunk: Blob, isLastChunk: boolean = false): void {
    const formData = new FormData();
    formData.append('video_chunk', chunk);
    formData.append('timestamp', new Date().toISOString());

    // Pass IDs separately
    formData.append('user_id', this.userId);
    formData.append('assessment_id', this.assessmentId);
    formData.append('video_id', this.videoId);

    this.http.post(`${this.apiUrl}/save-video/`, formData).subscribe({
      next: (response: any) => {
        if (response.videoPath) {
          this.videoPath = response.videoPath;
        }
        if (isLastChunk && this.stopRecordingResolve) {
          this.stopRecordingResolve(this.videoPath);
        }
      },
      error: (error) => {
        console.error('Chunk upload failed:', error);
        if (isLastChunk && this.stopRecordingResolve) {
          this.stopRecordingResolve(this.videoPath);
        }
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
          this.mediaRecorder.stop();
          this.stream.getTracks().forEach(track => track.stop());
        } else {
          // If not recording, resolve immediately
          resolve(this.videoPath);
        }
      });
    }
}
 