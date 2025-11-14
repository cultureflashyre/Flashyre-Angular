import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AdminService } from '../../services/admin.service';
import { AdminPage1Component as AdminPage1ChildComponent } from '../../components/admin-page1-component/admin-page1-component.component';

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { NavbarForAdminView } from 'src/app/components/navbar-for-admin-view/navbar-for-admin-view.component';
import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { AdminPage1Component } from '../../components/admin-page1-component/admin-page1-component.component';
// const ACTIVE_JOB_ID_KEY = 'active_job_processing_id';
const MAX_TOTAL_UPLOAD_SIZE_MB = 25; // New constant for total upload size limit

@Component({
  selector: 'admin-page1',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    NavbarForAdminView, AlertMessageComponent,
    AdminPage1Component,

  ],
  templateUrl: 'admin-page1.component.html',
  styleUrls: ['admin-page1.component.css'],
})
export class AdminPage1 implements OnInit {
  userProfile: any = {};

  // public activeView: 'resumes' | 'jobDescription' = 'resumes';
  public isUploadingCVs: boolean = false;
  // public isUploadingJd: boolean = false;

  // Add these properties
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';
  private actionContext: { action: string } | null = null;

  @ViewChild(AdminPage1ChildComponent) adminPage1Component!: AdminPage1ChildComponent;
  @ViewChild('cvUploader') cvUploader!: ElementRef;
  // @ViewChild('jdUploader') jdUploader!: ElementRef;

  constructor(
    private title: Title,
    private meta: Meta,
    private adminService: AdminService
  ) {
    this.title.setTitle('Admin-Page1 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Admin-Page1 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit(): void {

    this.loadUserProfile();

    // const activeJobId = sessionStorage.getItem(ACTIVE_JOB_ID_KEY);
    // if (activeJobId) {
    //   this.activeView = 'jobDescription';
    // }
  }

  onCvFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']; // Only PDF and DOC
const hasInvalidType = files.some(file => !allowedTypes.includes(file.type));

  if (hasInvalidType) {
    this.showErrorPopup('upload only pdf or word document'); // Your custom error message
    this.cvUploader.nativeElement.value = ''; // Clear the input
    return; // Stop the function here
  }
    const validFiles: File[] = [];
    const maxFileSize = 5 * 1024 * 1024; // 5 MB
    const maxTotalSize = MAX_TOTAL_UPLOAD_SIZE_MB * 1024 * 1024; // Convert MB to bytes
    let totalSize = 0;

    // First, validate each file individually
    files.forEach(file => {
      if (file.size > maxFileSize) {
        this.showErrorPopup(`Error: File "${file.name}" is larger than 5MB and was ignored.`);
      } else {
        validFiles.push(file);
        totalSize += file.size; // Add to total size if valid
      }
    });

    // If there are no valid files after the first check, do nothing further
    if (validFiles.length === 0) {
      this.cvUploader.nativeElement.value = '';
      return;
    }

    // Now, check the total size of the valid files
    if (totalSize > maxTotalSize) {
      this.showErrorPopup(`Error: Total upload size exceeds the limit of ${MAX_TOTAL_UPLOAD_SIZE_MB}MB. Please upload a smaller batch.`);
      this.cvUploader.nativeElement.value = '';
      return;
    }

    // If all checks pass, proceed with the upload
    this.isUploadingCVs = true;
    this.adminService.uploadCVs(validFiles).subscribe({
      next: (response) => {
        this.showSuccessPopup(`Successfully uploaded ${response.processed_files.length} CV(s). The list will now refresh.`);
        if (this.adminPage1Component) {
          this.adminPage1Component.refreshFiltersAndLoadLatest();
        }
      },
      error: (err) => {
        console.error('CV upload failed:', err);
        this.showErrorPopup(`CV upload failed: ${err.error?.error || 'Please try again.'}`);
      },
      complete: () => {
        this.isUploadingCVs = false;
      }
    });

    this.cvUploader.nativeElement.value = '';
  }

  // onJdFileSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (!input.files || input.files.length === 0) {
  //     return;
  //   }

  //   const file = input.files[0];
  //   this.isUploadingJd = true;

  //   this.adminService.uploadJd(file).subscribe({
  //     next: (response) => {
  //       this.showSuccessPopup(`Successfully processed JD for role: ${response.role}. The view will now switch.`);
  //       sessionStorage.setItem(ACTIVE_JOB_ID_KEY, response.job_id.toString());
  //       this.activeView = 'jobDescription';
  //     },
  //     error: (err) => {
  //       console.error('JD upload failed:', err);
  //       const errorMessage = err.error?.error || 'An unknown server error occurred. Please try again.';
  //       this.showErrorPopup(`JD upload failed: ${errorMessage}`);
  //     },
  //     complete: () => {
  //       this.isUploadingJd = false;
  //     }
  //   });

  //   this.jdUploader.nativeElement.value = '';
  // }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }

  // --- Alert and Popup Handling ---

  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000);
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  closePopup() {
    this.showPopup = false;
  }

  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    if (action.toLowerCase() === 'cancel') {
      this.actionContext = null;
      return;
    }

    if (this.actionContext) {
      switch (this.actionContext.action) {
        case 'cvUpload':
          this.cvUploadConfirmed();
          break;
        // case 'jdUpload':
        //   this.jdUploadConfirmed();
        //   break;
      }
      this.actionContext = null;
    }
  }

  // --- Action "Attempt" Handlers ---

  onCvUploadAttempt() {
    this.actionContext = { action: 'cvUpload' };
    this.openAlert('You are about to upload CVs. Do you want to continue?', ['Cancel', 'Upload']);
  }

  // onJdUploadAttempt() {
  //   this.actionContext = { action: 'jdUpload' };
  //   this.openAlert('You are about to upload a Job Description. Do you want to continue?', ['Cancel', 'Upload']);
  // }

  // --- Confirmed Actions ---

  private cvUploadConfirmed() {
    this.cvUploader.nativeElement.click();
  }

  // private jdUploadConfirmed() {
  //   this.jdUploader.nativeElement.click();
  // }
}