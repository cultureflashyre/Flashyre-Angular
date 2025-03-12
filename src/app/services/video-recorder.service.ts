// video-recorder.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VideoRecorderService {
  private mediaRecorder!: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private recordingInterval: any;

  constructor(private http: HttpClient) { }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.saveVideoChunk(event.data);
        }
      };
      
      this.mediaRecorder.start(300000); // 5 minute chunks
      
      // Attach video stream to DOM
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      document.getElementById('video-container')?.appendChild(videoElement);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  private saveVideoChunk(chunk: Blob) {
    const timestamp = new Date().toISOString();
    const reader = new FileReader();
    
    reader.onload = () => {
      localStorage.setItem(`video_chunk_${timestamp}`, reader.result as string);
    };
    
    reader.readAsDataURL(chunk);
  }

  stopRecording() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }
  }
}
