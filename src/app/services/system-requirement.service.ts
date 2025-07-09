import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SystemRequirementService {

  constructor() {}

  /**
   * Asynchronously checks for user-granted permissions based on dynamic requirements.
   * This is the new, primary method for checking hardware access.
   *
   * @param requirements An object specifying whether video and/or audio access is needed.
   * @returns A Promise that resolves to `true` if all required permissions are granted, and `false` otherwise.
   */
  public async checkPermissions(requirements: { video: boolean, audio: boolean }): Promise<boolean> {
    // If no permissions are required, we can return true immediately.
    if (!requirements.video && !requirements.audio) {
      console.log('SystemRequirementService: No special permissions required.');
      return true;
    }

    const constraints: MediaStreamConstraints = {};
    if (requirements.video) {
      constraints.video = true;
    }
    if (requirements.audio) {
      constraints.audio = true;
    }

    console.log('SystemRequirementService: Requesting permissions for:', constraints);

    try {
      // Request permission. The browser will prompt the user if needed.
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // IMPORTANT: Immediately stop the tracks once permission is confirmed.
      // This turns off the camera/mic indicator in the browser, as we only
      // needed to verify access, not actively stream here.
      stream.getTracks().forEach(track => track.stop());
      
      console.log('SystemRequirementService: Permissions granted for:', constraints);
      return true;

    } catch (error) {
      // Handle potential errors. Most common is NotAllowedError when the user clicks "Block".
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'NotFoundError')) {
        console.warn(`SystemRequirementService: Permission denied or device not found for ${JSON.stringify(constraints)}. Error: ${error.name}`);
      } else {
        console.error('SystemRequirementService: An unexpected error occurred during getUserMedia.', error);
      }
      return false;
    }
  }

  /**
   * DEPRECATED METHOD - Kept for backward compatibility.
   * It now calls the new, more flexible `checkPermissions` method.
   * Asynchronously checks if the user has granted permissions for both camera (video) and microphone (audio).
   *
   * @returns A Promise that resolves to `true` if permissions are granted, and `false` otherwise.
   */
  public async checkVideoAndAudioPermissions(): Promise<boolean> {
    console.warn("SystemRequirementService: `checkVideoAndAudioPermissions` is deprecated. Use `checkPermissions` instead.");
    return this.checkPermissions({ video: true, audio: true });
  }
}