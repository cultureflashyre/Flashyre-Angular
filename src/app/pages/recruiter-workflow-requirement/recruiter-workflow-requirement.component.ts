import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import this
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // Add these



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
    FormsModule,
    AlertMessageComponent,
    ReactiveFormsModule
  ]
})
export class RecruiterWorkflowRequirement implements OnInit {
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
  showAlert: boolean = false;
  alertMessage: string = '';
  alertButtons: string[] = [];
  pendingAction: string = ''; 
  pendingDeleteIndex: number | null = null;
  filterForm!: FormGroup;
  isFilterPanelVisible: boolean = false;
  currentSort: string = 'none';

  // Master list to keep original data safe while filtering
  masterRequirements: any[] = []; 

  // --- MULTI-SELECT USER ASSIGNMENT PROPERTIES ---
  availableUsers: any[] = [];     // Full list from API
  filteredUsers: any[] = [];      // List shown in dropdown
  selectedAssignees: any[] = [];  // Users selected in the form
  userSearchText: string = '';    // Input text
  isUserDropdownOpen: boolean = false;

  constructor(
    private title: Title, 
    private meta: Meta, 
    private adbService: AdbRequirementService,  
    private fb: FormBuilder 
  ) {
    this.title.setTitle('Recruiter-Workflow-Requirement - Flashyre');
    // ... rest of your constructor logic
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    
    this.minDate = `${year}-${month}-${day}`;
    this.initializeFilterForm();
  }

  // 1. Initialize the Filter Form
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      client_name: [''],
      location: [''],
      description: [''], // Will search in job_description
      ctc: ['']
    });
  }

  ngOnInit() {
    this.fetchRequirements(); // Fetch the data as soon as page loads
    this.fetchAvailableUsers();
  }

  // 1. Fetch Users from Backend
  fetchAvailableUsers() {
    this.adbService.getAllUsers().subscribe({
      next: (users: any[]) => {
        this.availableUsers = users;
        this.filteredUsers = users; // Initialize filtered list
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  // 2. Filter Users based on input
  filterUsers() {
    if (!this.userSearchText) {
      this.filteredUsers = this.availableUsers.filter(u => !this.isSelected(u));
    } else {
      const term = this.userSearchText.toLowerCase();
      this.filteredUsers = this.availableUsers.filter(u => 
        (u.first_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)) &&
        !this.isSelected(u)
      );
    }
    this.isUserDropdownOpen = true;
  }

  // 3. Helper: Check if user is already selected
  isSelected(user: any): boolean {
    return this.selectedAssignees.some(selected => selected.user_id === user.user_id);
  }

  // 4. Select a User
  selectUser(user: any) {
    this.selectedAssignees.push(user);
    this.userSearchText = ''; // Clear input
    this.isUserDropdownOpen = false;
  }

  // 5. Remove a User
  removeUser(index: number) {
    this.selectedAssignees.splice(index, 1);
  }

  // 6. Close dropdown if clicked outside (Optional, simplistic version)
  closeUserDropdown() {
    // A small timeout allows the click event on the list item to fire first
    setTimeout(() => { this.isUserDropdownOpen = false; }, 200);
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
  isSortDropdownOpen: boolean = false;

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

    // POPULATE ASSIGNED USERS
    if (item.assigned_users_details) {
      this.selectedAssignees = [...item.assigned_users_details];
    } else {
      this.selectedAssignees = [];
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

  // BULK DELETE FUNCTION
 deleteSelectedRequirements() {
    const selectedItems = this.requirementsList.filter(item => item.selected);

    if (selectedItems.length === 0) {
      this.triggerAlert('Please select at least one requirement to delete.', ['OK']);
      return;
    }

    const msg = `Are you sure you want to delete ${selectedItems.length} selected requirement(s)?`;
    this.triggerAlert(msg, ['Yes', 'Cancel'], 'deleteBulk');
  }

  // 3. DELETE FROM UI FUNCTIONALITY
  // Removes from the array list only, does not call API
  deleteCardFromUi(index: number) {
    this.pendingDeleteIndex = index; 
    this.triggerAlert(
      'Are you sure you want to delete this requirement permanently?', 
      ['Yes', 'Cancel'], 
      'deleteSingle'
    );
  }


 onSubmit() {

  // Extract User IDs for the backend
    const assignedUserIds = this.selectedAssignees.map(u => u.user_id);

    // ... (Keep your existing validation logic here) ...
    this.validateJobDescription();
    if (!this.clientName) {
      this.triggerAlert('Client Name is required', ['OK']);
      return;
    }
    if (!this.interviewLocation) {
      this.triggerAlert('Interview Location is required', ['OK']);
      return;
    }
    if (this.isJobDescriptionInvalid) {
      this.triggerAlert('Please fill in the Job Description.', ['OK']);
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
      location_details: this.additionalDetails.filter(d => d.location && d.spoc).map(d => ({
        location: d.location,
        spoc_name: d.spoc,
        vacancies: parseInt(d.vacancies) || 1
      })),
      // NEW FIELD
      assigned_users: assignedUserIds 
      
    };

    // --- NEW LOGIC: Check if Editing or Creating ---
    if (this.isEditMode && this.currentRequirementId) {
      // UPDATE EXISTING
      this.adbService.updateRequirement(this.currentRequirementId, payload).subscribe({
        next: (response) => {
          this.triggerAlert('Requirement updated successfully!', ['OK']);
          this.onCancel(); // Reset form and mode
          this.showListing = true;
          this.fetchRequirements(); // Refresh list
        },
        error: () => this.triggerAlert('Failed to update. Check inputs.', ['OK'])
      });
    } else {
      // CREATE NEW (Existing logic)
      this.adbService.createRequirement(payload).subscribe({
        next: (response) => {
          this.triggerAlert('Requirement created successfully!', ['OK']);
          this.onCancel();
          this.showListing = true;
          this.fetchRequirements();
        },
       error: () => this.triggerAlert('Failed to create. Check inputs.', ['OK'])
      });
    }
  }

  // 4. UPDATE onCancel Function
  onCancel() {

    this.selectedAssignees = [];
    this.userSearchText = '';

    // 1. Reset Edit Mode flags
    this.showListing = true; 
    this.isEditMode = false;
    this.currentRequirementId = null;

    // 2. Clear all input fields
    this.clientName = '';
    this.subClientName = '';
    this.interviewLocation = '';
    this.interviewDate = '';
    this.jobDescription = '';
    
    // 3. Reset Objects
    this.experience = { totalMin: null, totalMax: null, relevantMin: null, relevantMax: null };
    this.salary = { min: null, max: null };
    
    // 4. Reset Dropdowns
    this.selectedCtc = '';
    this.selectedNoticePeriod = '';
    this.selectedGender = '';
    
    // 5. Reset Array to initial state
    this.additionalDetails = [{ location: '', spoc: '', vacancies: '' }];
    
    // 6. Reset Errors
    this.isJobDescriptionInvalid = false;
    this.salaryErrors.rangeError = false;
    this.errors = { minExperience: false, maxExperience: false };
    
    // 7. CRITICAL: Switch view back to the List
    this.showListing = true; 
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
        // Map data and set BOTH lists
        const processedData = data.map(item => ({
          ...item,
          selected: false,
          isExpanded: false
        }));
        
        this.masterRequirements = processedData; // Save original copy
        this.requirementsList = processedData;   // Display copy
        
        this.applyFiltersAndSort(); // Re-apply any active filters
      },
      error: (err) => console.error(err)
    });
  }

  // 3. Filter Panel Toggles
  toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  clearFilters(): void {
    this.filterForm.reset({ client_name: '', location: '', description: '', ctc: '' });
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  applyFiltersFromPanel(): void {
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  // 4. CORE LOGIC: Filtering and Sorting
  applyFiltersAndSort(): void {
    let data = [...this.masterRequirements]; // Start with full list
    const filters = this.filterForm.value;

    // Filter by Client Name
    if (filters.client_name) {
      const term = filters.client_name.toLowerCase();
      data = data.filter(item => item.client_name.toLowerCase().includes(term));
    }

    // Filter by Location
    if (filters.location) {
      const term = filters.location.toLowerCase();
      data = data.filter(item => item.interview_location.toLowerCase().includes(term));
    }

    // Filter by Job Description/Skills
    if (filters.description) {
      const term = filters.description.toLowerCase();
      data = data.filter(item => item.job_description.toLowerCase().includes(term));
    }

    // Filter by CTC
    if (filters.ctc) {
      data = data.filter(item => item.current_ctc_range === filters.ctc);
    }

    // Apply Sorting
    if (this.currentSort === 'a-z') {
      data.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
    } else if (this.currentSort === 'z-a') {
      data.sort((a, b) => (b.client_name || '').localeCompare(a.client_name || ''));
    }

    this.requirementsList = data; // Update UI
  }

  // 5. Sort Change Event
  sortRequirementsChange(event: Event): void {
    this.currentSort = (event.target as HTMLSelectElement).value;
    this.applyFiltersAndSort();
  }
toggleDescription(item: any) {
    item.isExpanded = !item.isExpanded;
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
triggerAlert(message: string, buttons: string[], action: string = '') {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.pendingAction = action;
    this.showAlert = true;
  }

  onAlertButtonClick(button: string) {
    const btn = button.toLowerCase();

    // HANDLE "YES" ACTIONS
    if (btn === 'yes') {
      if (this.pendingAction === 'deleteSingle' && this.pendingDeleteIndex !== null) {
        this.executeSingleDelete(this.pendingDeleteIndex);
      } 
      else if (this.pendingAction === 'deleteBulk') {
        this.executeBulkDelete();
      }
    }
    // CLOSE ALERT
    this.closeAlert();
  }

  closeAlert() {
    this.showAlert = false;
    this.pendingAction = '';
    this.pendingDeleteIndex = null;
  }

  // Logic for Single Delete (Called by Alert)
  executeSingleDelete(index: number) {
    const itemToDelete = this.requirementsList[index];
    this.adbService.deleteRequirement(itemToDelete.id).subscribe({
      next: () => {
        this.requirementsList.splice(index, 1);
        this.triggerAlert('Requirement deleted successfully.', ['OK']);
      },
      error: (err) => {
        console.error(err);
        this.triggerAlert('Failed to delete requirement.', ['OK']);
      }
    });
  }

  // Logic for Bulk Delete (Called by Alert)
  executeBulkDelete() {
    const selectedItems = this.requirementsList.filter(item => item.selected);
    const deleteRequests = selectedItems.map(item => this.adbService.deleteRequirement(item.id));

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.requirementsList = this.requirementsList.filter(item => !item.selected);
        this.isAllSelected = false;
        this.triggerAlert('Selected requirements deleted successfully.', ['OK']);
      },
      error: (err) => {
        console.error(err);
        this.triggerAlert('An error occurred while deleting.', ['OK']);
        this.fetchRequirements();
      }
    });
  }
   toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }
  sortRequirements(order: string) {
    if (order === 'asc') {
      // Sort A to Z (Ascending) based on Client Name
      this.requirementsList.sort((a, b) => 
        (a.client_name || '').localeCompare(b.client_name || '')
      );
    } else if (order === 'desc') {
      // Sort Z to A (Descending) based on Client Name
      this.requirementsList.sort((a, b) => 
        (b.client_name || '').localeCompare(a.client_name || '')
      );
    }
    
    // Close the dropdown after selection
    this.isSortDropdownOpen = false;
  }
}