import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { CollectionFormService, PublicFormDetails } from '../../services/collection-form.service';

@Component({
  standalone: true,
  selector: 'app-public-apply',
  templateUrl: './public-apply.component.html',
  styleUrls: ['./public-apply.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, RouterLink]
})
export class PublicApplyComponent implements OnInit {
  formId = '';
  formDetails: PublicFormDetails | null = null;
  applyForm!: FormGroup;
  
  isLoading = false;
  isSubmitting = false;
  submitSuccess = false;
  errorMessage = '';
  
  formLoadTimestamp = 0;
  selectedFile: File | null = null;
  fileError = '';

  private submittedSuccessfully = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private formService: CollectionFormService
  ) {}

  ngOnInit(): void {
    this.formId = this.route.snapshot.paramMap.get('formId') || '';
    this.formLoadTimestamp = Date.now();
    this.initForm();
    this.loadFormDetails();
  }

  initForm(): void {
    // Validations: Name (max 30 chars, letters only), Phone (10 digits only), Gender (Male/Female/Others)
    this.applyForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.maxLength(30), 
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', [
        Validators.required, 
        Validators.pattern(/^\d{10}$/)
      ]],
      gender: ['', [Validators.required]],
      website: [''] // Honeypot field (hidden from view)
    });
  }

  loadFormDetails(): void {
    if (!this.formId) {
      this.errorMessage = 'Form link is invalid or incomplete.';
      return;
    }

    this.isLoading = true;
    this.formService.getPublicFormDetails(this.formId).subscribe({
      next: (details) => {
        this.formDetails = details;
        this.isLoading = false;
        
        // Add template-specific fields dynamically
        if (details.template_type === 'campus') {
          this.applyForm.addControl('latest_university', this.fb.control('', [
            Validators.required, 
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z\s]+$/)
          ]));
          this.applyForm.addControl('year_of_graduation', this.fb.control('', [
            Validators.required, 
            Validators.pattern(/^[0-9]{4}$/)
          ]));
        } else if (details.template_type === 'experienced') {
          this.applyForm.addControl('latest_company', this.fb.control('', [
            Validators.required, 
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z0-9\s]+$/)
          ]));
          this.applyForm.addControl('current_ctc', this.fb.control('', [
            Validators.required
          ]));
          this.applyForm.addControl('notice_period', this.fb.control('', [
            Validators.required, 
            Validators.maxLength(50)
          ]));
        }
        
        // If resume is required, make file validation mandatory
        if (details.require_resume) {
          this.fileError = 'Resume is required.';
        }
      },
      error: (err) => {
        console.error('Failed to load form details', err);
        this.errorMessage = err.error?.error || 'Form not found or no longer active.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.selectedFile = null;
    this.fileError = '';

    if (!file) {
      if (this.formDetails?.require_resume) {
        this.fileError = 'Resume is required.';
      }
      return;
    }

    // 1. Extension check
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc'];
    if (!allowed.includes(ext)) {
      this.fileError = 'Only PDF, DOCX, and DOC files are allowed.';
      return;
    }

    // 2. Size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'File size exceeds the 5MB limit.';
      return;
    }

    // 3. Client-side Magic Byte validation
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arr = new Uint8Array(e.target.result);
      let header = '';
      for (let i = 0; i < Math.min(arr.length, 8); i++) {
        header += arr[i].toString(16).padStart(2, '0');
      }
      header = header.toUpperCase();

      let isValid = false;
      if (ext === '.pdf' && header.startsWith('25504446')) {
        isValid = true; // %PDF
      } else if (ext === '.docx' && header.startsWith('504B0304')) {
        isValid = true; // PK..
      } else if (ext === '.doc' && header.startsWith('D0CF11E0A1B11AE1')) {
        isValid = true; // OLE2 doc
      }

      if (!isValid) {
        this.fileError = 'File integrity check failed. The file structure does not match the extension.';
      } else {
        this.selectedFile = file;
        this.fileError = '';
      }
    };
    // Read first 8 bytes
    reader.readAsArrayBuffer(file.slice(0, 8));
  }

  // Gather signals to form browser fingerprint
  generateBrowserToken(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillText('flashyre', 10, 10);
      }
      const canvasHash = canvas.toDataURL().slice(-20);
      const signals = [
        navigator.language,
        window.screen.width + 'x' + window.screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvasHash,
        (navigator as any).hardwareConcurrency?.toString() || '0',
        (navigator as any).maxTouchPoints?.toString() || '0',
        Date.now().toString()
      ].join('|');
      return btoa(signals);
    } catch (e) {
      return btoa('fallback|' + Date.now().toString());
    }
  }

  onSubmit(): void {
    if (this.submittedSuccessfully) {
      return;
    }

    if (this.applyForm.invalid || (this.formDetails?.require_resume && !this.selectedFile) || this.fileError) {
      this.applyForm.markAllAsTouched();
      return;
    }

    if (!this.formDetails || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    // Calculate bot protection details
    const timeSpent = (Date.now() - this.formLoadTimestamp) / 1000;
    const browserToken = this.generateBrowserToken();

    const formData = new FormData();
    formData.append('name', this.applyForm.value.name);
    formData.append('email', this.applyForm.value.email);
    formData.append('phone_number', this.applyForm.value.phone_number);
    formData.append('gender', this.applyForm.value.gender);
    formData.append('website', this.applyForm.value.website); // honeypot
    
    // Append optional fields if they exist
    if (this.applyForm.value.latest_university) formData.append('latest_university', this.applyForm.value.latest_university);
    if (this.applyForm.value.year_of_graduation) formData.append('year_of_graduation', this.applyForm.value.year_of_graduation);
    if (this.applyForm.value.latest_company) formData.append('latest_company', this.applyForm.value.latest_company);
    if (this.applyForm.value.current_ctc) formData.append('current_ctc', this.applyForm.value.current_ctc);
    if (this.applyForm.value.notice_period) formData.append('notice_period', this.applyForm.value.notice_period);
    
    formData.append('_ts', this.formLoadTimestamp.toString());
    formData.append('_duration', timeSpent.toString());
    formData.append('_browser_token', browserToken);
    formData.append('_form_token', this.formDetails.form_token);

    if (this.selectedFile) {
      formData.append('resume', this.selectedFile);
    }

    this.formService.submitPublicForm(this.formId, formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submittedSuccessfully = true;
        this.submitSuccess = true;
      },
      error: (err) => {
        console.error('Submission failed', err);
        if (err.status === 429) {
          const retryAfter = err.headers?.get('Retry-After') || err.headers?.get('X-Retry-After');
          const waitMinutes = retryAfter ? Math.ceil(parseInt(retryAfter, 10) / 60) : 5;
          this.errorMessage = err.error?.error || `You've submitted too many applications. Please try again in ${waitMinutes} minute(s).`;
        } else {
          this.errorMessage = err.error?.error || 'Failed to submit application. Please refresh the page and try again.';
        }
        this.isSubmitting = false;
      }
    });
  }

  get whatsappLink(): string {
    if (!this.formDetails?.created_by_phone) return '';
    const cleanPhone = this.formDetails.created_by_phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `Hi with ${this.formDetails.title || 'Job Application'}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  }
}
