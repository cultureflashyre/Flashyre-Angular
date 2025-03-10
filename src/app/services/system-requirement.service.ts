// system-requirement.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class SystemRequirementService {

  private router: Router;

  constructor(router: Router, private deviceService: DeviceDetectorService) {
    this.router = router;
  }

  async checkSystemRequirements(): Promise<boolean> {
    // Implement checks for device type and audio/video availability
    const isDeviceSupported = this.isDeviceSupported();
    const isAudioVideoEnabled = await this.isAudioVideoEnabled();
  
    return isDeviceSupported && isAudioVideoEnabled;
  }
  

  isDeviceSupported(): boolean {
    return !this.deviceService.isMobile();
  }

  async isAudioVideoEnabled(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  reInitiateCheck(): void {
    if (this.checkSystemRequirements()) {
      this.router.navigate(['/flashyre-assessment-rules-card']);
    } else {
      // Do nothing if requirements are still not met
    }
  }
}
