import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import this
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';



import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

@Component({
  standalone: true,
  selector: 'recruiter-workflow-requirement',
  templateUrl: 'recruiter-workflow-requirement.component.html',
  styleUrls: ['recruiter-workflow-requirement.component.css'],
  imports: [
    CommonModule, 
    RouterModule, 
    RecruiterWorkflowNavbarComponent,
    FormsModule
  ]
})
export class RecruiterWorkflowRequirement {
   clientName: string = '';
  subClientName: string = '';
  interviewLocation: string = '';
  interviewDate: string = '';
  
  // 2. View Switching & Data List
  showListing: boolean = true; // Controls Form vs Listing view
  requirementsList: any[] = []; 
  isEditMode: boolean = false;
  currentRequirementId: number | null = null;
  isAllSelected: boolean = false;

  constructor(private title: Title, private meta: Meta, private adbService: AdbRequirementService ) {
    this.title.setTitle('Recruiter-Workflow-Requirement - Flashyre');
    // ... rest of your constructor logic
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    
    this.minDate = `${year}-${month}-${day}`;
  }

  ngOnInit() {
    this.fetchRequirements(); // Fetch the data as soon as page loads
  }

  ctcOptions: string[] = [
    '1 LPA - 3 LPA',
    '4 LPA - 6 LPA',
    '7 LPA - 10 LPA',
    '11 LPA - 15 LPA',
    '16 LPA - 20 LPA',
    '21 LPA - 25 LPA',
    '26 LPA - 30 LPA',
    '30 LPA+'
  ];
  noticePeriodOptions: string[] = [
    'Immediate',
    'Less than 15 Days',
    'Less than 30 Days',
    'Less than 60 Days',
    'Less than 90 days'
  ];
    genderOptions: string[] = ['Male', 'Female', 'Others'];
  selectedCtc: string = ''; // Stores the selected value
  isCtcDropdownOpen: boolean = false; // Toggles visibility
   selectedNoticePeriod: string = '';
  isNoticePeriodDropdownOpen: boolean = false;
   selectedGender: string = '';
  isGenderDropdownOpen: boolean = false;
   jobDescription: string = '';
  isJobDescriptionInvalid: boolean = false;

   experience = {
    totalMin: null as number | null,
    totalMax: null as number | null,
    relevantMin: null as number | null,
    relevantMax: null as number | null
  };
  minDate: string = '';

  errors = {
    minExperience: false,
    maxExperience: false
  };

  validateClientName(event: any) {
    const input = event.target as HTMLInputElement;
    // Regex explanation:
    // [^a-zA-Z0-9 ] -> Matches any character that is NOT a-z, A-Z, 0-9, or a space.
    // We replace those invalid characters with an empty string.
    input.value = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
  }

  validateSubClientName(event: any) {
    const input = event.target as HTMLInputElement;
    // Replace any character that is NOT a-z, A-Z, 0-9, or a space with an empty string
    input.value = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
  }

 validateExperience() {
    // 1. Prevent Negative Values (Auto-correct to 0)
    if (this.experience.totalMin !== null && this.experience.totalMin < 0) this.experience.totalMin = 0;
    if (this.experience.totalMax !== null && this.experience.totalMax < 0) this.experience.totalMax = 0;
    if (this.experience.relevantMin !== null && this.experience.relevantMin < 0) this.experience.relevantMin = 0;
    if (this.experience.relevantMax !== null && this.experience.relevantMax < 0) this.experience.relevantMax = 0;

    // 2. Validate Relevant vs Total (Set Error Flags)
    
    // Check Min Experience
    if (
      this.experience.totalMin !== null && 
      this.experience.relevantMin !== null && 
      this.experience.relevantMin > this.experience.totalMin
    ) {
      this.errors.minExperience = true;
    } else {
      this.errors.minExperience = false;
    }

    // Check Max Experience
    if (
      this.experience.totalMax !== null && 
      this.experience.relevantMax !== null && 
      this.experience.relevantMax > this.experience.totalMax
    ) {
      this.errors.maxExperience = true;
    } else {
      this.errors.maxExperience = false;
    }
  }
  salary = {
    min: null as number | null,
    max: null as number | null
  };

  // Salary error state
  salaryErrors = {
    rangeError: false
  };

  validateSalary() {
    // 1. Prevent Negative Values
    if (this.salary.min !== null && this.salary.min < 0) this.salary.min = 0;
    if (this.salary.max !== null && this.salary.max < 0) this.salary.max = 0;

    // 2. Validate Min <= Max
    if (
      this.salary.min !== null && 
      this.salary.max !== null && 
      this.salary.min > this.salary.max
    ) {
      this.salaryErrors.rangeError = true;
    } else {
      this.salaryErrors.rangeError = false;
    }
  }
  toggleCtcDropdown() {
    this.isCtcDropdownOpen = !this.isCtcDropdownOpen;
  }

  selectCtc(option: string) {
    this.selectedCtc = option;
    this.isCtcDropdownOpen = false; // Close dropdown after selection
  }
  validateLocation(event: any) {
    const input = event.target as HTMLInputElement;
    // Regex explanation:
    // [^a-zA-Z ] -> Matches any character that is NOT a letter (a-z, A-Z) or a space.
    // This removes numbers and special characters immediately.
    input.value = input.value.replace(/[^a-zA-Z ]/g, '');
  }
toggleNoticePeriodDropdown() {
    this.isNoticePeriodDropdownOpen = !this.isNoticePeriodDropdownOpen;
  }

  selectNoticePeriod(option: string) {
    this.selectedNoticePeriod = option;
    this.isNoticePeriodDropdownOpen = false;
  }
   toggleGenderDropdown() {
    this.isGenderDropdownOpen = !this.isGenderDropdownOpen;
  }

  selectGender(option: string) {
    this.selectedGender = option;
    this.isGenderDropdownOpen = false;
  }
  validateJobDescription() {
    // Check if the description is empty or just whitespace
    if (!this.jobDescription || this.jobDescription.trim().length === 0) {
      this.isJobDescriptionInvalid = true;
    } else {
      this.isJobDescriptionInvalid = false;
    }
  }
  additionalDetails = [
    { location: '', spoc: '', vacancies: '' }
  ];

  // 1. Validate Location: Allows a-z, A-Z, space, and comma
  validateDetailLocation(index: number, event: any) {
    const input = event.target as HTMLInputElement;
    // Regex: Replace anything that is NOT (^) a letter, space, or comma
    const cleanValue = input.value.replace(/[^a-zA-Z, ]/g, '');
    
    // Update DOM immediately
    input.value = cleanValue;
    // Update Model
    this.additionalDetails[index].location = cleanValue;
  }

  // 2. Validate SPOC: Allows a-z, A-Z, space, and comma
  validateDetailSpoc(index: number, event: any) {
    const input = event.target as HTMLInputElement;
    // Regex: Replace anything that is NOT (^) a letter, space, or comma
    const cleanValue = input.value.replace(/[^a-zA-Z, ]/g, '');
    
    // Update DOM immediately
    input.value = cleanValue;
    // Update Model
    this.additionalDetails[index].spoc = cleanValue;
  }

  // 3. Validate Vacancies: Allows 0-9 only
  validateDetailVacancies(index: number, event: any) {
    const input = event.target as HTMLInputElement;
    // Regex: Replace anything that is NOT (^) a number
    const cleanValue = input.value.replace(/[^0-9]/g, '');
    
    // Update DOM immediately
    input.value = cleanValue;
    // Update Model
    this.additionalDetails[index].vacancies = cleanValue;
  }

  // 4. Remove Row Functionality
  removeDetail(index: number) {
    this.additionalDetails.splice(index, 1);
  }
   addDetail() {
    this.additionalDetails.push({ location: '', spoc: '', vacancies: '' });
  }

 onEdit(item: any) {
    this.isEditMode = true;
    this.currentRequirementId = item.id;
    this.showListing = false; // Switch to form view

    // Populate Fields
    this.clientName = item.client_name;
    this.subClientName = item.sub_client_name;
    this.jobDescription = item.job_description;
    this.interviewLocation = item.interview_location;
    this.interviewDate = item.interview_date;

    this.experience = {
      totalMin: item.total_experience_min,
      totalMax: item.total_experience_max,
      relevantMin: item.relevant_experience_min,
      relevantMax: item.relevant_experience_max
    };

    this.salary = {
      min: item.salary_min,
      max: item.salary_max
    };

    this.selectedCtc = item.current_ctc_range;
    this.selectedNoticePeriod = item.notice_period;
    this.selectedGender = item.gender;

    // Populate Table
    if (item.location_details && item.location_details.length > 0) {
      this.additionalDetails = item.location_details.map((loc: any) => ({
        location: loc.location,
        spoc: loc.spoc_name,
        vacancies: loc.vacancies.toString()
      }));
    } else {
      this.additionalDetails = [{ location: '', spoc: '', vacancies: '' }];
    }
  }

  downloadCardAsPdf(index: number) {
    // Find the specific card element by the ID we assigned in HTML
    const data = document.getElementById('requirement-card-' + index);

    if (data) {
      html2canvas(data, { scale: 2 }).then(canvas => {
        // High quality image settings
        const imgWidth = 208; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.save('Job-Requirement-' + (index + 1) + '.pdf');
      });
    } else {
      console.error('Could not find element to print');
    }
  }

  // 3. DELETE FROM UI FUNCTIONALITY
  // Removes from the array list only, does not call API
  deleteCardFromUi(index: number) {
    // Confirmation is optional, but good UX
    if(confirm('Are you sure you want to remove this card from the view?')) {
      this.requirementsList.splice(index, 1);
    }
  }


 onSubmit() {
    // ... (Keep your existing validation logic here) ...
    this.validateJobDescription();
    if (!this.clientName || !this.interviewLocation || this.isJobDescriptionInvalid) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    // Prepare Payload (Same as before)
    const validLocationDetails = this.additionalDetails
      .filter(d => d.location.trim() !== '' && d.spoc.trim() !== '')
      .map(d => ({
        location: d.location,
        spoc_name: d.spoc,
        vacancies: parseInt(d.vacancies) || 1
      }));

    const payload = {
      client_name: this.clientName,
      sub_client_name: this.subClientName,
      source: 'External',
      total_experience_min: this.experience.totalMin || 0,
      total_experience_max: this.experience.totalMax || 0,
      relevant_experience_min: this.experience.relevantMin || 0,
      relevant_experience_max: this.experience.relevantMax || 0,
      salary_min: this.salary.min || 0,
      salary_max: this.salary.max || 0,
      current_ctc_range: this.selectedCtc || null,
      notice_period: this.selectedNoticePeriod || null,
      gender: this.selectedGender || null,
      interview_location: this.interviewLocation,
      interview_date: this.interviewDate ? this.interviewDate : null,
      job_description: this.jobDescription,
      location_details: validLocationDetails
    };

    // --- NEW LOGIC: Check if Editing or Creating ---
    if (this.isEditMode && this.currentRequirementId) {
      // UPDATE EXISTING
      this.adbService.updateRequirement(this.currentRequirementId, payload).subscribe({
        next: (response) => {
          alert('Requirement updated successfully!');
          this.onCancel(); // Reset form and mode
          this.showListing = true;
          this.fetchRequirements(); // Refresh list
        },
        error: (error) => {
          console.error('Update Failed:', error);
          alert('Failed to update. Check inputs.');
        }
      });
    } else {
      // CREATE NEW (Existing logic)
      this.adbService.createRequirement(payload).subscribe({
        next: (response) => {
          alert('Requirement created successfully!');
          this.onCancel();
          this.showListing = true;
          this.fetchRequirements();
        },
        error: (error) => {
          console.error('Create Failed:', error);
          alert('Failed to create. Check inputs.');
        }
      });
    }
  }

  // 4. UPDATE onCancel Function
  onCancel() {
    // Reset Edit Mode flags
    this.isEditMode = false;
    this.currentRequirementId = null;

    // ... (Keep existing reset logic for all fields) ...
    this.clientName = '';
    this.subClientName = '';
    this.interviewLocation = '';
    this.interviewDate = '';
    this.jobDescription = '';
    this.experience = { totalMin: null, totalMax: null, relevantMin: null, relevantMax: null };
    this.salary = { min: null, max: null };
    this.selectedCtc = '';
    this.selectedNoticePeriod = '';
    this.selectedGender = '';
    this.additionalDetails = [{ location: '', spoc: '', vacancies: '' }];
    this.isJobDescriptionInvalid = false;
    this.salaryErrors.rangeError = false;
    this.errors = { minExperience: false, maxExperience: false };
    
    this.showListing = false; // Or true, depending on your desired UX for cancel
  }

  showAddForm() {
    // 1. Clear any existing data first (reuses your Cancel logic to reset fields)
    this.onCancel(); 
    
    // 2. Ensure we are explicitly in "Create" mode, not "Edit" mode
    this.isEditMode = false;
    this.currentRequirementId = null;

    // 3. Show the Form (Hide Listing)
    this.showListing = false;
  }


  // --- FETCH LISTING LOGIC ---
  fetchRequirements() {
    this.adbService.getRequirements().subscribe({
      next: (data: any[]) => {
        // We map the data to ensure every item has a 'selected' property set to false
        this.requirementsList = data.map(item => ({
          ...item,
          selected: false 
        }));
      },
      error: (err) => console.error(err)
    });
  }

  // 3. ADD THIS FUNCTION (For the "Select All" checkbox)
  toggleSelectAll() {
    // Loop through all items and set their selected state to match the master checkbox
    if (this.requirementsList) {
      for (const item of this.requirementsList) {
        item.selected = this.isAllSelected;
      }
    }
  }

  // 4. ADD THIS FUNCTION (For individual checkboxes)
  checkIfAllSelected() {
    if (this.requirementsList && this.requirementsList.length > 0) {
      // If every single item is selected, set master checkbox to true. Otherwise false.
      this.isAllSelected = this.requirementsList.every(item => item.selected);
    } else {
      this.isAllSelected = false;
    }
  }

}