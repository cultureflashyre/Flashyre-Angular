import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AdminService, JobDescription } from '../../services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'admin-jd-extended-component',
  templateUrl: 'admin-jd-extended-component.component.html',
  styleUrls: ['admin-jd-extended-component.component.css'],
})
export class AdminJdExtendedComponent implements OnInit, OnDestroy {
  @Input() rootClassName: string = '';
  
  public jd: JobDescription | null = null;
  private jdSubscription: Subscription;

  // We no longer need placeholders or @Input for text here
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.jdSubscription = this.adminService.activeJd$.subscribe(latestJd => {
      this.jd = latestJd;
    });
  }

  ngOnDestroy(): void {
    if (this.jdSubscription) {
      this.jdSubscription.unsubscribe();
    }
  }
}