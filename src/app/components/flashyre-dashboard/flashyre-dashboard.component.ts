import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router'; // Import Router for navigation
import { ProctoringService } from '../../services/proctoring.service'; // Import SystemRequirementService
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'flashyre-dashboard',
  templateUrl: 'flashyre-dashboard.component.html',
  styleUrls: ['flashyre-dashboard.component.css'],
})
export class FlashyreDashboard {
  @ContentChild('text5112')
  text5112: TemplateRef<any>;
  @ContentChild('text4')
  text4: TemplateRef<any>;
  @ContentChild('heading21')
  heading21: TemplateRef<any>;
  @ContentChild('heading3')
  heading3: TemplateRef<any>;
  @Input()
  imageSrc1: string =
    'https://s3-alpha-sig.figma.com/img/8254/7737/b3eefffb9d9234e6fe8609789fdf7c00?Expires=1738540800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=Lre-OwCdNqxrC8NSOmtxE~DcIDSQI~JJOmnLEWTSfBvn9-Ax5GyAoNgkjoK9dt~EjtPg0oQtoxV-xSjJ9VSWlVmGtKP6Sadgg8Y8KBnyn1fX5CNN5XYS1g8X0aOc08BOs3glpvtYVs~0D1NGRQPICtSWCrq7AWH2NJTnVhJjbwkDi0MxC47kucztlUYiSUyoyNetc3FyEw4NWrRth5bjLU5HOzNEeLoP~xowHU-tbAzbFucpVi-icLI8rymBQObpMBKwt7VQ1eeQkMts3lB8~exxOsV1jlSAmCoRo8m7rA3KyaEY8kfQL0EuSoYn7PnBmtHsvqdnPlVRsfJM91RaUQ__';
  @ContentChild('button1')
  button1: TemplateRef<any>;
  @ContentChild('text1111')
  text1111: TemplateRef<any>;
  @Input()
  imageAlt1: string = 'image';
  @ContentChild('heading11')
  heading11: TemplateRef<any>;
  @ContentChild('text12')
  text12: TemplateRef<any>;
  @ContentChild('text52')
  text52: TemplateRef<any>;
  @ContentChild('text512')
  text512: TemplateRef<any>;
  @ContentChild('text21')
  text21: TemplateRef<any>;
  @ContentChild('text31')
  text31: TemplateRef<any>;
  @ContentChild('text51111')
  text51111: TemplateRef<any>;
  rawigb0: string = ' ';
  rawst6l: string = ' ';

  constructor(
    private router: Router, 
    private proctoringService: ProctoringService, 
    private deviceService: DeviceDetectorService) {} // Inject Router


  checkSystemRequirements(): Promise<boolean> {
    // Implement checks for device type and audio/video availability
    const isDeviceSupported = this.isDeviceSupported();
    return this.isAudioVideoEnabled().then(enabled => isDeviceSupported && enabled);
  }
  
  
  async goToAssessment(): Promise<void> {
    if (await this.checkSystemRequirements()) {
      this.router.navigate(['/flashyre-assessment-rules-card']);
    } else {
      this.router.navigate(['/error-system-requirement-failed']);
    }
  }

  //goToAssessment(): void {
    //if (this.systemRequirementService.checkSystemRequirements()) {
      //this.router.navigate(['/flashyre-assessment-rules-card']);
    //} else {
      //this.router.navigate(['/error-system-requirement-failed']);
    //}
  //}
  

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
}