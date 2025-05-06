import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { FileUploadService } from '../../services/file-upload.service';
import { JobDescriptionService } from '../../services/job-description.service';

@Component({
  selector: 'create-job-post1st-page',
  templateUrl: './create-job-post-1st-page.component.html',
  styleUrls: ['./create-job-post-1st-page.component.css']
})
export class CreateJobPost1stPageComponent implements OnInit {
  jobDetails: any = {
    role: '',
    location: '',
    job_type: '',
    workplace_type: '',
    total_experience_min: 0,
    total_experience_max: 0,
    relevant_experience_min: 0,
    relevant_experience_max: 0,
    budget_type: '',
    min_budget: 0,
    max_budget: 0,
    notice_period: '',
    skills: '',
    job_description: '',
    job_description_url: ''
  };
  selectedFile: File | null = null;
  token: string | null = null;
  user_id: number = 1; // Hardcoded user_id for testing

  constructor(
    private title: Title,
    private meta: Meta,
    private fileUploadService: FileUploadService,
    private jobDescriptionService: JobDescriptionService
  ) {
    this.title.setTitle('Create-Job-Post-1st-page - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Create-Job-Post-1st-page - Flashyre'
      },
      {
        property: 'og:image',
        content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original'
      }
    ]);
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('access_token'); // Attempt to retrieve token
    this.loadJobDetailsFromStorage(); // Load job details from localStorage if available
    
    // Add event listener for storage changes to update UI when localStorage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'job_details') {
        this.loadJobDetailsFromStorage();
      }
    });
  }

  loadJobDetailsFromStorage(): void {
    const savedJobDetails = localStorage.getItem('job_details');
    if (savedJobDetails) {
      try {
        const parsedDetails = JSON.parse(savedJobDetails);
        // Merge saved details with default structure to ensure all fields exist
        this.jobDetails = { ...this.jobDetails, ...parsedDetails };
        console.log('Job details loaded from localStorage:', this.jobDetails);
      } catch (error) {
        console.error('Error parsing job details from localStorage:', error);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      alert('Please select a file.');
      return;
    }

    // Temporarily bypass token check and use hardcoded user_id
    this.fileUploadService.uploadFile(this.selectedFile, 'temporary-token').subscribe({
      next: (response) => {
        this.jobDetails.job_description_url = response.file_url;
        this.processJobDescription(response.file_url);
      },
      error: (error) => {
        console.error('File upload failed:', error);
        alert('Failed to upload file. Please try again.');
      }
    });
  }

  processJobDescription(fileUrl: string): void {
    // Use hardcoded user_id for testing
    this.jobDescriptionService.processJobDescription(fileUrl, 'temporary-token').subscribe({
      next: (response) => {
        this.populateForm(response);
        this.jobDescriptionService.storeMCQs(response.mcqs);
        // Save job details to localStorage
        this.saveJobDetailsToStorage();
      },
      error: (error) => {
        console.error('AI processing failed:', error);
        alert('Failed to process job description. Please try again.');
      }
    });
  }

  populateForm(jobData: any): void {
    // Map AI response to form fields
    this.jobDetails.role = jobData.job_titles[0]?.value || '';
    this.jobDetails.location = jobData.location || 'Unknown';
    this.jobDetails.job_type = this.mapJobType(jobData.job_titles[0]?.value || '');
    this.jobDetails.workplace_type = jobData.workplace_type || 'Remote';
    const [minExp, maxExp] = this.parseExperience(jobData.experience?.value || '0-0 years');
    this.jobDetails.total_experience_min = minExp;
    this.jobDetails.total_experience_max = maxExp;
    this.jobDetails.relevant_experience_min = Math.max(0, minExp - 1);
    this.jobDetails.relevant_experience_max = Math.min(maxExp, minExp + 2);
    this.jobDetails.budget_type = jobData.budget_type || 'Annually';
    this.jobDetails.min_budget = jobData.min_budget || 0;
    this.jobDetails.max_budget = jobData.max_budget || 0;
    this.jobDetails.notice_period = jobData.notice_period || '30 days';
    this.jobDetails.skills = [
      ...jobData.skills.primary.map((s: any) => s.skill),
      ...jobData.skills.secondary.map((s: any) => s.skill)
    ].join(',');
    this.jobDetails.job_description = jobData.job_description || '';
  }

  mapJobType(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'Internship';
    if (lowerTitle.includes('contract')) return 'Contract';
    if (lowerTitle.includes('part-time')) return 'Part-time';
    return 'Permanent';
  }

  parseExperience(exp: string): [number, number] {
    const match = exp.match(/(\d+)-(\d+)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
  }

  submitJobPost(): void {
    // Save job details to localStorage before submitting
    this.saveJobDetailsToStorage();
    
    // Use hardcoded user_id for testing
    this.jobDescriptionService.saveJobPost(this.jobDetails, 'temporary-token').subscribe({
      next: () => {
        alert('Job post created successfully!');
        // Clear localStorage after successful submission if needed
        // localStorage.removeItem('job_details');
        this.resetForm();
      },
      error: (error) => {
        console.error('Job post creation failed:', error);
        alert('Failed to create job post. Please try again.');
      }
    });
  }

  saveJobDetailsToStorage(): void {
    try {
      localStorage.setItem('job_details', JSON.stringify(this.jobDetails));
      console.log('Job details saved to localStorage:', this.jobDetails);
      // Trigger a custom event to ensure the UI updates if the save is happening 
      // in the same window/tab
      const storageEvent = new StorageEvent('storage', {
        key: 'job_details',
        newValue: JSON.stringify(this.jobDetails),
        storageArea: localStorage
      });
      window.dispatchEvent(storageEvent);
    } catch (error) {
      console.error('Error saving job details to localStorage:', error);
    }
  }

  resetForm(): void {
    this.jobDetails = {
      role: '',
      location: '',
      job_type: '',
      workplace_type: '',
      total_experience_min: 0,
      total_experience_max: 0,
      relevant_experience_min: 0,
      relevant_experience_max: 0,
      budget_type: '',
      min_budget: 0,
      max_budget: 0,
      notice_period: '',
      skills: '',
      job_description: '',
      job_description_url: ''
    };
    this.selectedFile = null;
    // Clear localStorage when form is reset
    localStorage.removeItem('job_details');
  }
  
  // Method to manually load job details from localStorage (for testing)
  loadStoredJobDetails(): void {
    this.loadJobDetailsFromStorage();
    
    // If no job details were found, show a message
    if (!localStorage.getItem('job_details')) {
      alert('No saved job details found in localStorage.');
    } else {
      alert('Job details loaded from localStorage.');
    }
  }
}