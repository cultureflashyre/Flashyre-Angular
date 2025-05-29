// video-recorder.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({ providedIn: 'root' })
export class VideoRecorderService {

  constructor(private http: HttpClient) { }

  private apiUrl = 'http://localhost:8000/trial_assessments';

  private mediaRecorder!: MediaRecorder;
  private stream!: MediaStream;
  private recordedChunks: Blob[] = [];
  private videoPath: string | null = null;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.uploadChunk(event.data);
        }
      };

      this.mediaRecorder.start(300000); // 5 minute chunks
      
      // Add video preview
      const videoElement = document.createElement('video');
      videoElement.srcObject = this.stream;
      videoElement.autoplay = true;
      document.getElementById('video-container')?.appendChild(videoElement);

    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  private uploadChunk(chunk: Blob): void {
    const formData = new FormData();
    formData.append('video_chunk', chunk);
    formData.append('timestamp', new Date().toISOString());
    
    this.http.post(`${this.apiUrl}/save-video/`, formData).subscribe({
      next: (response: any) => {
        if (response.videoPath) {
          this.videoPath = response.videoPath;
        }
      },
      error: (error) => {
        console.error('Chunk upload failed:', error);
      }
    });
  }
  

  getVideoPath(): string | null {
    return this.videoPath;
  }

  stopRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        console.log('[VideoRecorderService] Stopping mediaRecorder...');
        this.mediaRecorder.onstop = () => {
          console.log('[VideoRecorderService] mediaRecorder stopped');
          // Stop all tracks in the stream to turn off camera and mic
          this.stream.getTracks().forEach(track => {
            console.log('[VideoRecorderService] Stopping track:', track.kind);
            track.stop();
          });

          // Remove video preview element if exists
          //const videoContainer = document.getElementById('video-container');
         // if (videoContainer) {
          //  videoContainer.innerHTML = ''; // Clear video preview
         //   console.log('[VideoRecorderService] Video preview removed');
         // }

        resolve();
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('[VideoRecorderService] mediaRecorder error:', event);
          reject(event);
        };

        console.log('Calling mediaRecorder.stop()');
        this.mediaRecorder.stop();
        console.log('mediaRecorder.stop() called');
      } else {
        console.log('[VideoRecorderService] mediaRecorder not recording or already stopped');
        resolve();
      }
    });
  }






}
