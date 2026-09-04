import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import DOMPurify from 'dompurify';
import { CollectionFormService, CollectionForm } from '../../services/collection-form.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

@Component({
  standalone: true,
  selector: 'app-collection-forms',
  templateUrl: './collection-forms.component.html',
  styleUrls: ['./collection-forms.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RecruiterWorkflowNavbarComponent]
})
export class CollectionFormsComponent implements OnInit, OnDestroy {
  forms: CollectionForm[] = [];
  filteredForms: CollectionForm[] = [];
  jobRequirements: any[] = [];
  isLoading = false;
  isSubmitting = false;
  isDeleting = false;
  togglingFormId: string | null = null;
  submitCooldown = false;
  
  searchQuery = '';
  currentFilter = 'all';
  
  // Modal states
  showCreateModal = false;
  showQRModal = false;
  showDeleteModal = false;
  selectedFormForQR: CollectionForm | null = null;
  formToDelete: CollectionForm | null = null;
  
  qrCodeUrl = '';
  formUrl = '';
  
  createFormGroup!: FormGroup;
  copiedFormId: string | null = null;
  
  // Preview modal states
  showPreviewModal = false;
  previewTemplateName = '';
  previewFields: { name: string, optional?: boolean }[] = [];
  
  private timeUpdateInterval: any;

  constructor(
    private fb: FormBuilder,
    private collectionFormService: CollectionFormService,
    private adbRequirementService: AdbRequirementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadForms();
    this.loadJobRequirements();
    
    // Update countdowns every minute
    this.timeUpdateInterval = setInterval(() => {
      // Trigger change detection for pure pipes or function calls in template
    }, 60000);
  }
  
  ngOnDestroy(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  initForm(): void {
    this.createFormGroup = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9\s\-_.&()]+$/)
      ]],
      job_post: [null],
      company_name: ['', [Validators.maxLength(100)]],
      logo_url: ['', [Validators.pattern(/https?:\/\/.+/)]],
      require_resume: [true],
      template_type: ['standard', [Validators.required]],
      expires_at: [''],
      max_submissions: ['', [Validators.min(1)]]
    });
  }

  loadForms(): void {
    this.isLoading = true;
    this.collectionFormService.getForms().subscribe({
      next: (data) => {
        this.forms = data;
        this.filterForms();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load collection forms', err);
        this.isLoading = false;
      }
    });
  }

  loadJobRequirements(): void {
    this.adbRequirementService.getRequirements().subscribe({
      next: (data: any) => {
        this.jobRequirements = Array.isArray(data) ? data : (data.results || []);
      },
      error: (err) => {
        console.error('Failed to load job requirements', err);
      }
    });
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value.toLowerCase();
    this.filterForms();
  }
  
  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.filterForms();
  }

  filterForms(): void {
    this.filteredForms = this.forms.filter(f => {
      const status = this.getFormStatus(f);
      const matchFilter = this.currentFilter === 'all' || status === this.currentFilter;
      const matchSearch = !this.searchQuery || 
        f.title.toLowerCase().includes(this.searchQuery) ||
        (f.company_name && f.company_name.toLowerCase().includes(this.searchQuery));
      return matchFilter && matchSearch;
    });
  }

  get activeFormsCount(): number {
    return this.forms.filter(f => f.effective_active).length;
  }
  
  get totalSubmissionsCount(): number {
    return this.forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);
  }

  openCreateModal(): void {
    this.createFormGroup.reset({
      require_resume: true,
      template_type: 'standard'
    });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onSubmit(): void {
    if (this.createFormGroup.invalid || this.isSubmitting || this.submitCooldown) {
      return;
    }
    const val = this.createFormGroup.value;
    const sanitizedTitle = DOMPurify.sanitize(val.title?.trim() || '');
    const sanitizedCompany = val.company_name ? DOMPurify.sanitize(val.company_name.trim()) : null;

    const payload: CollectionForm = {
      title: sanitizedTitle,
      job_post: val.job_post ? Number(val.job_post) : null,
      company_name: sanitizedCompany,
      logo_url: val.logo_url || null,
      require_resume: !!val.require_resume,
      template_type: val.template_type,
      is_active: true,
      expires_at: val.expires_at ? new Date(val.expires_at).toISOString() : null,
      max_submissions: val.max_submissions ? Number(val.max_submissions) : null
    };

    this.isSubmitting = true;
    this.collectionFormService.createForm(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeCreateModal();
        this.loadForms();
        this.submitCooldown = true;
        setTimeout(() => {
          this.submitCooldown = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Failed to create form', err);
        this.isSubmitting = false;
      }
    });
  }

  toggleActive(form: CollectionForm): void {
    if (!form.unique_id || this.togglingFormId) return;
    this.togglingFormId = form.unique_id;
    const newStatus = !form.is_active;
    this.collectionFormService.updateForm(form.unique_id, { is_active: newStatus }).subscribe({
      next: (updated) => {
        const index = this.forms.findIndex(f => f.unique_id === updated.unique_id);
        if (index !== -1) {
          this.forms[index] = updated;
          this.filterForms();
        }
        this.togglingFormId = null;
      },
      error: (err) => {
        console.error('Failed to toggle active status', err);
        this.togglingFormId = null;
      }
    });
  }

  openDeleteModal(form: CollectionForm): void {
    this.formToDelete = form;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.formToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.formToDelete || !this.formToDelete.unique_id || this.isDeleting) return;
    this.isDeleting = true;
    this.collectionFormService.deleteForm(this.formToDelete.unique_id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.loadForms();
      },
      error: (err) => {
        console.error('Failed to delete form', err);
        this.isDeleting = false;
        this.closeDeleteModal();
      }
    });
  }

  getFormUrl(form: CollectionForm): string {
    return `${window.location.origin}/apply/${form.unique_id}`;
  }

  copyLink(form: CollectionForm): void {
    if (!form.unique_id) return;
    const url = this.getFormUrl(form);
    navigator.clipboard.writeText(url).then(() => {
      this.copiedFormId = form.unique_id || null;
      setTimeout(() => {
        if (this.copiedFormId === form.unique_id) {
          this.copiedFormId = null;
        }
      }, 2000);
    });
  }

  openQRModal(form: CollectionForm): void {
    this.selectedFormForQR = form;
    this.formUrl = this.getFormUrl(form);
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(this.formUrl)}&color=0f172a`;
    this.showQRModal = true;
  }

  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedFormForQR = null;
    this.qrCodeUrl = '';
    this.formUrl = '';
  }

  previewTemplate(type: string): void {
    if (type === 'standard') {
      this.previewTemplateName = 'Standard';
      this.previewFields = [
        { name: 'Full Name' },
        { name: 'Email Address' },
        { name: 'Phone Number' },
        { name: 'Gender' },
        { name: 'Resume Upload', optional: true }
      ];
    } else if (type === 'campus') {
      this.previewTemplateName = 'Campus';
      this.previewFields = [
        { name: 'Full Name' },
        { name: 'Email Address' },
        { name: 'Phone Number' },
        { name: 'Gender' },
        { name: 'Latest University' },
        { name: 'Year of Graduation' },
        { name: 'Resume Upload', optional: true }
      ];
    } else if (type === 'experienced') {
      this.previewTemplateName = 'Experienced';
      this.previewFields = [
        { name: 'Full Name' },
        { name: 'Email Address' },
        { name: 'Phone Number' },
        { name: 'Gender' },
        { name: 'Latest Company' },
        { name: 'Current CTC' },
        { name: 'Notice Period' },
        { name: 'Resume Upload', optional: true }
      ];
    } else if (type === 'walkin') {
      this.previewTemplateName = 'Walk-in';
      this.previewFields = [
        { name: 'Full Name' },
        { name: 'Email Address' },
        { name: 'Phone Number' },
        { name: 'Gender' },
        { name: 'Resume Upload', optional: true }
      ];
    }
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
  }

  downloadQR(): void {
    if (!this.qrCodeUrl || !this.selectedFormForQR) return;
    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.target = '_blank';
    link.download = `${this.selectedFormForQR.title.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  viewCandidates(form: CollectionForm): void {
    if (!form.unique_id) return;
    this.router.navigate(['/recruiter-workflow-candidate'], {
      queryParams: { form_id: form.unique_id }
    });
  }
  
  getFormStatus(form: CollectionForm): string {
    if (!form.is_active) return 'inactive';
    if (form.is_expired) return 'expired';
    if (form.is_submission_limit_reached) return 'limit-reached';
    return 'active';
  }
  
  getTimeRemaining(expiresAt: string | null | undefined): string {
    if (!expiresAt) return 'No expiry';
    
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Expires in ${days}d ${hours}h`;
    if (hours > 0) return `Expires in ${hours}h ${mins}m`;
    return `Expires in ${mins}m`;
  }
}
