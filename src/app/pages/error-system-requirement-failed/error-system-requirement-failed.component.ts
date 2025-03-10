// error-system-requirement-failed.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
//import { FlashyreDashboardComponent } from '../flashyre-dashboard/flashyre-dashboard.component';
import { SystemRequirementService } from '../../services/system-requirement.service';

@Component({
  selector: 'error-system-requirement-failed',
  templateUrl: './error-system-requirement-failed.component.html',
  styleUrls: ['./error-system-requirement-failed.component.css']
})
export class ErrorSystemRequirementFailedComponent implements OnInit {

  constructor(private systemRequirementService: SystemRequirementService, private router: Router) { }

  ngOnInit(): void {
  }

  checkAgain(): void {
    this.systemRequirementService.reInitiateCheck();
  }

  close(): void {
    this.router.navigate(['/flashyre-dashboard']);
  }
}
