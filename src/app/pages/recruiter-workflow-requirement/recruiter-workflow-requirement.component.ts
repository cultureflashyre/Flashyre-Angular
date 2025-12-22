import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import this
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // Add these
import { NgZone, OnDestroy, AfterViewInit } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from 'src/environments/environment';
import { of, Observable } from 'rxjs';




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
export class RecruiterWorkflowRequirement implements OnInit, AfterViewInit, OnDestroy {
  statusOptions = [
    { label: 'Active', color: '#28a745' },  // Green
    { label: 'On-hold', color: '#ffc107' }, // Yellow
    { label: 'Hired', color: '#17a2b8' },   // Blue
    { label: 'Closed', color: '#dc3545' }   // Red
  ];
  bulkStatusSelected: string = '';
  isSuperUser: boolean = false;
  clientName: string = '';
  subClientName: string = '';
  jobRole: string = ''; 
  interviewLocation: string = '';
  interviewDate: string = '';

  clientList: any[] = []; // Stores the API response
  availableSubClients: string[] = []; // Sub-clients for the selected client
public formErrors: { [key: string]: string } = {};
  // NEW PROPERTIES FOR LOCATION SEARCH
  locationSuggestions: any[] = [];
  showLocationSuggestions: boolean = false;
  searchTimeout: any;

// --- NEW PROPERTIES FOR DETAIL MODAL ---
  showDetailsModal = false;
  selectedReqDetails: any | null = null;

  // --- Google Maps Properties ---
private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
private loader: Loader;
private placesService: google.maps.places.AutocompleteService | undefined;
private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
private google: any;

// Streams for Debouncing Input
private interviewLocationInput$ = new Subject<string>();

// Suggestions State
interviewLocationSuggestions: google.maps.places.AutocompletePrediction[] = [];
showInterviewLocationSuggestions = false;

// Selected Data Array (for Pills)
interviewLocationsList: string[] = [];

private subscriptions = new Subscription();

  
  // 2. View Switching & Data List
  isFormVisible: boolean = false;
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
  selectedFile: File | null = null;
  fileUploadError: string | null = null;
  existingFileUrl: string | null = null;

  // Master list to keep original data safe while filtering
  masterRequirements: any[] = []; 

  // --- MULTI-SELECT USER ASSIGNMENT PROPERTIES ---
  availableUsers: any[] = [];     // Full list from API
  filteredUsers: any[] = [];      // List shown in dropdown
  selectedAssignees: any[] = [];  // Users selected in the form
  userSearchText: string = '';    // Input text
  isUserDropdownOpen: boolean = false;

  additionalDetailsErrors: any[] = [];

  isClientNameInvalid: boolean = false;
  isJobRoleInvalid: boolean = false;
  isJobRoleNumericOnly: boolean = false;
  isInterviewLocationInvalid: boolean = false;

  isTotalExpInvalid: boolean = false;
  isRelevantExpInvalid: boolean = false;
  isSalaryInvalid: boolean = false;
  isInterviewDateInvalid: boolean = false;
  isNoticePeriodInvalid: boolean = false;
  isGenderInvalid: boolean = false;

  // STEP 1: REPLACE your existing parseErrorResponse function with this new, smarter version.
  /**
   * Parses the error response from the Django backend into a user-friendly,
   * readable string, translating technical field names into clean labels.
   * @param err The error object from the HttpClient request.
   * @returns A formatted string listing all validation errors.
   */
  private parseErrorResponse(err: any): string {
    const errors = err.error;

    // Handle cases where the error isn't a structured object
    if (!errors || typeof errors !== 'object') {
      return 'An unexpected error occurred. Please try again.';
    }

    // This is the "translator" map from backend field names to user-friendly labels.
    const fieldNameMap: { [key: string]: string } = {
      client_name: 'Client Name',
      sub_client_name: 'Sub Client',
      job_role: 'Job Role',
      job_description: 'Job Description',
      total_experience_min: 'Total Experience (Min)',
      total_experience_max: 'Total Experience (Max)',
      relevant_experience_min: 'Relevant Experience (Min)',
      relevant_experience_max: 'Relevant Experience (Max)',
      salary_min: 'Salary (Min)',
      salary_max: 'Salary (Max)',
      interview_location: 'Interview Location',
      interview_date: 'Interview Date',
      notice_period: 'Notice Period',
      gender: 'Gender',
      file_attachment: 'File Upload',
      assigned_users: 'Assigned Users',
      location_details: 'Location Details',
    };

    const errorMessages: string[] = [];

    // Loop through each key (field name) in the error object from Django
    for (const key in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, key)) {
        // Use the map to get the friendly name, or create a default one
        const friendlyName = fieldNameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        
        const messages = errors[key];
        if (Array.isArray(messages) && messages.length > 0) {
          // Join the friendly name with the error message from Django
          errorMessages.push(`- ${friendlyName}: ${messages.join(' ')}`);
        }
      }
    }

    // If we successfully parsed any messages, display them
    if (errorMessages.length > 0) {
      return 'Please correct the following errors:\n\n' + errorMessages.join('\n');
    }

    // Fallback for any truly unexpected error format
    return 'An unknown validation error occurred. Please check your inputs.';
  }


  constructor(
    private title: Title, 
    private meta: Meta, 
    private adbService: AdbRequirementService,  
    private fb: FormBuilder ,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.title.setTitle('Recruiter-Workflow-Requirement - Flashyre');
    // ... rest of your constructor logic
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    
    this.minDate = `${year}-${month}-${day}`;
    this.initializeFilterForm();
     // Add this line at the end of the constructor
  this.loader = new Loader({
    apiKey: this.googleMapsApiKey,
    version: 'weekly',
    libraries: ['places']
  });
  }

  ngAfterViewInit(): void {
  this.initializeGooglePlaces();
}

// === NEW METHODS FOR DETAIL POPUP ===
  
  openRequirementDetails(item: any): void {
    this.selectedReqDetails = item;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReqDetails = null;
  }
  
  // Method to handle file opening (reusing or creating new if needed)
  openFile(url: string | null): void {
    if (url) window.open(url, '_blank');
  }

ngOnDestroy(): void {
  this.subscriptions.unsubscribe();
}

// --- Google Maps Initialization ---
private async initializeGooglePlaces(): Promise<void> {
  try {
    this.google = await this.loader.load();
    this.placesService = new this.google.maps.places.AutocompleteService();
  } catch (error) {
    console.error('Fatal error: Google Maps script could not be loaded.', error);
  }
}

// --- Setup RxJS Stream for Location Input ---
private setupLocationAutocomplete(): void {
  this.subscriptions.add(
    this.interviewLocationInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.showInterviewLocationSuggestions = true;
        this.initSessionToken();
      }),
      switchMap(term => this.getPlacePredictions(term))
    ).subscribe(suggestions => {
      this.ngZone.run(() => {
        this.interviewLocationSuggestions = suggestions;
      });
    })
  );
}

private initSessionToken(): void {
  if (this.google && !this.sessionToken) {
    this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
  }
}

private getPlacePredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
  if (!term.trim() || !this.placesService) {
    return of([]);
  }
  
  if (!this.sessionToken && this.google) {
    this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
  }

  return new Observable(observer => {
    this.placesService!.getPlacePredictions({
      input: term,
      types: ['(cities)'],
      sessionToken: this.sessionToken
    }, (predictions, status) => {
      this.ngZone.run(() => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          observer.next(predictions);
        } else {
          observer.next([]);
        }
        observer.complete();
      });
    });
  });
}

 /**
   * Check if the current user is assigned to this requirement.
   */
  private isAssignedToRequirement(item: any): boolean {
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) return false;

    // Check assigned_users_details (Array of objects) or assigned_users (Array of IDs)
    const assignedList = item.assigned_users_details || item.assigned_users || [];
    
    return assignedList.some((u: any) => {
      // Normalize comparison: Handle object {user_id: '...'} or simple string '...'
      const uId = u.user_id ? String(u.user_id) : String(u);
      return uId === String(currentUserId);
    });
  }

  /**
   * Check if the current user created this requirement.
   */
  private isCreatorOfRequirement(item: any): boolean {
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) return false;

    // Handle nested object {user_id: '...'} or simple ID
    const creatorId = item.created_by_details ? item.created_by_details.user_id : item.created_by;
    
    return String(creatorId) === String(currentUserId);
  }

// --- HTML Event Handlers for Interview Location ---

onInterviewLocationInput(event: Event): void {
  const term = (event.target as HTMLInputElement).value;
  if (!term.trim()) {
    this.showInterviewLocationSuggestions = false;
    return;
  }
  this.interviewLocationInput$.next(term);
}

selectInterviewLocation(prediction: google.maps.places.AutocompletePrediction, inputElement: HTMLInputElement): void {
  const locationName = prediction.description;
  if (!this.interviewLocationsList.includes(locationName)) {
    this.interviewLocationsList.push(locationName);
  }
  
  inputElement.value = '';
  this.showInterviewLocationSuggestions = false;
  this.interviewLocationSuggestions = [];
  this.sessionToken = undefined;
  this.isInterviewLocationInvalid = false;
}

addManualInterviewLocation(event: any): void {
  const value = event.target.value.trim();
  if (value && !this.interviewLocationsList.includes(value)) {
    this.interviewLocationsList.push(value);
  }
  this.showInterviewLocationSuggestions = false;
  event.target.value = '';
  event.preventDefault();

  this.isInterviewLocationInvalid = false;
}

removeInterviewLocation(index: number): void {
  this.interviewLocationsList.splice(index, 1);
}


  // 1. Initialize the Filter Form
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      client_name: [''],
      location: [''],
      description: [''], // Will search in job_description
      ctc: [''],
      role: ['']
    });
  }

  onFileSelected(event: any): void {
  this.fileUploadError = null;
  const file: File = event.target.files[0];

  if (file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      this.fileUploadError = 'Upload only pdf or word documents';
      this.selectedFile = null;
      event.target.value = ''; // Clear the input
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      this.fileUploadError = 'File size cannot exceed 5MB.';
      this.selectedFile = null;
      event.target.value = ''; // Clear the input
      return;
    }

    this.selectedFile = file;
  }
}

getFileName(): string {
  if (this.selectedFile) {
    return this.selectedFile.name;
  }
  if (this.existingFileUrl) {
    // Extracts filename from a URL like '.../media/requirements/files/MyDoc.pdf'
    return decodeURIComponent(this.existingFileUrl.split('/').pop() || 'Existing File');
  }
  return '';
}

  

  ngOnInit() {
    this.fetchRequirements(); // Fetch the data as soon as page loads
    this.fetchAvailableUsers();
    this.fetchClientList();
     this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';
     this.setupLocationAutocomplete();
  }

  getStatusColor(status: string): string {
    const found = this.statusOptions.find(s => s.label === status);
    return found ? found.color : '#ccc';
  }

  // 3. INLINE EDIT: Toggle Popover
  toggleStatusPopover(item: any, event: Event) {
    event.stopPropagation();
    
    // PERMISSION CHECK: Only Super User OR Assigned User
    if (!this.isSuperUser && !this.isAssignedToRequirement(item)) {
        this.triggerAlert("Access Denied: Only assigned users can change the status.", ['OK']);
        return;
    }

    // Close others
    this.requirementsList.forEach(req => {
      if (req !== item) req.showStatusDropdown = false;
    });
    item.showStatusDropdown = !item.showStatusDropdown;
  }


  // 4. INLINE EDIT: Update Status
  updateSingleStatus(item: any, newStatus: string, event: Event) {
    event.stopPropagation();
    item.showStatusDropdown = false;

    // Double Check Permission (Safety)
    if (!this.isSuperUser && !this.isAssignedToRequirement(item)) {
        this.triggerAlert("Access Denied: Only assigned users can change the status.", ['OK']);
        return;
    }

    if (item.status === newStatus) return;

    const oldStatus = item.status;
    item.status = newStatus; // Optimistic update

    const formData = new FormData();
    formData.append('status', newStatus);

    this.adbService.updateRequirement(item.id, formData).subscribe({
      next: () => {},
      error: (err) => {
        item.status = oldStatus;
        this.triggerAlert('Failed to update status on server.', ['OK']);
      }
    });
  }

  // 5. BULK UPDATE LOGIC
  // Triggered when the dropdown next to Delete button changes
  onBulkStatusChange(event: any) {
    const newStatus = event.target.value;
    if (!newStatus) return;

    // Filter selected items
    const selectedItems = this.requirementsList.filter(item => item.selected);
    
    if (selectedItems.length === 0) return;

    // PERMISSION CHECK: Filter list to only items user is allowed to change
    const allowedItems = this.isSuperUser 
        ? selectedItems 
        : selectedItems.filter(item => this.isAssignedToRequirement(item));

    if (allowedItems.length === 0) {
        this.triggerAlert("Access Denied: You are not assigned to any of the selected requirements.", ['OK']);
        this.bulkStatusSelected = '';
        return;
    }

    if (allowedItems.length < selectedItems.length) {
        // Warn if some were skipped
        this.triggerAlert(`Note: You only have permission to update ${allowedItems.length} out of ${selectedItems.length} selected items. Proceeding with allowed items.`, ['OK']);
    }

    const updateRequests = allowedItems.map(item => {
      const formData = new FormData();
      formData.append('status', newStatus);
      item.status = newStatus;
      return this.adbService.updateRequirement(item.id, formData);
    });

    forkJoin(updateRequests).subscribe({
      next: () => {
        // Optional success message specific to bulk
        this.bulkStatusSelected = '';
      },
      error: (err) => {
        this.triggerAlert('Some updates failed', ['OK']);
        this.fetchRequirements();
      }
    });
  }


  get isAnySelected(): boolean {
    return this.requirementsList && this.requirementsList.some(item => item.selected);
  }

  fetchClientList() {
    this.adbService.getClientsForDropdown().subscribe({
      next: (data) => {
        this.clientList = data;
      },
      error: (err) => console.error('Error loading clients', err)
    });
  }

  onClientChange() {
    // Find selected client object
    const selectedClientObj = this.clientList.find(c => c.client_name === this.clientName);
    if (selectedClientObj) {
      this.availableSubClients = selectedClientObj.sub_clients;
    } else {
      this.availableSubClients = [];
    }
    // Clear subclient if it doesn't belong to new client
    if (!this.availableSubClients.includes(this.subClientName)) {
      this.subClientName = '';
    }
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

  
  noticePeriodOptions: string[] = [
    'Immediate',
    'Less than 15 Days',
    'Less than 30 Days',
    'Less than 60 Days',
    'Less than 90 days'
  ];
    genderOptions: string[] = ['Male', 'Female', 'Others'];
 
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
    maxExperience: false,
    totalExpRange: false
  };

  validateClientName(event: any) {
    const input = event.target as HTMLInputElement;
    // Regex explanation:
    // [^a-zA-Z0-9 ] -> Matches any character that is NOT a-z, A-Z, 0-9, or a space.
    // We replace those invalid characters with an empty string.
    input.value = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
  }

  validateJobRoleInput(event: any) {
    const input = event.target as HTMLInputElement;
    
    // 1. STRIP SPECIAL CHARACTERS: Allow only Alphabets (a-z, A-Z), Numbers (0-9), and Spaces
    const cleanValue = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
    
    // Update the input immediately if invalid characters were found
    if (input.value !== cleanValue) {
      input.value = cleanValue;
      this.jobRole = cleanValue; // Sync model
    } else {
      this.jobRole = input.value;
    }

    // 2. CHECK FOR "NUMBERS ONLY"
    // If the string is not empty AND consists only of digits and spaces -> Invalid
    if (this.jobRole.trim().length > 0 && /^[0-9 ]+$/.test(this.jobRole)) {
      this.isJobRoleNumericOnly = true;
    } else {
      this.isJobRoleNumericOnly = false;
    }

    // Reset the "Required" error if user types something
    if (this.jobRole.trim().length > 0) {
        this.isJobRoleInvalid = false;
    }
  }

  validateSubClientName(event: any) {
    const input = event.target as HTMLInputElement;
    // Replace any character that is NOT a-z, A-Z, 0-9, or a space with an empty string
    input.value = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
  }

 validateExperience(event: any = null) {
    // 1. DOM LEVEL ENFORCEMENT (Keep existing logic)
    if (event) {
      const input = event.target as HTMLInputElement;
      const cleanValue = input.value.replace(/[^0-9]/g, '').slice(0, 2);
      if (input.value !== cleanValue) {
        input.value = cleanValue;
        const val = cleanValue === '' ? null : Number(cleanValue);
        if (input.id === 'total-exp-min') this.experience.totalMin = val;
        if (input.id === 'total-exp-max') this.experience.totalMax = val;
        if (input.id === 'rel-exp-min') this.experience.relevantMin = val;
        if (input.id === 'rel-exp-max') this.experience.relevantMax = val;
      }
    }

    // 2. LOGICAL VALIDATION
    // Auto-correct negatives
    if (this.experience.totalMin !== null && this.experience.totalMin < 0) this.experience.totalMin = 0;
    if (this.experience.totalMax !== null && this.experience.totalMax < 0) this.experience.totalMax = 0;
    if (this.experience.relevantMin !== null && this.experience.relevantMin < 0) this.experience.relevantMin = 0;
    if (this.experience.relevantMax !== null && this.experience.relevantMax < 0) this.experience.relevantMax = 0;

     // --- NEW ADDITION START: Clear "Required" errors immediately ---
    if (this.experience.totalMin !== null && this.experience.totalMax !== null) {
        this.isTotalExpInvalid = false;
    }

    if (this.experience.relevantMin !== null && this.experience.relevantMax !== null) {
        this.isRelevantExpInvalid = false;
    }

    // --- NEW LOGIC: Check Total Min vs Total Max ---
    if (
      this.experience.totalMin !== null &&
      this.experience.totalMax !== null &&
      this.experience.totalMin > this.experience.totalMax
    ) {
      this.errors.totalExpRange = true;
    } else {
      this.errors.totalExpRange = false;
    }
    // ------------------------------------------------

    // Existing checks for Relevant vs Total
    if (
      this.experience.totalMin !== null &&
      this.experience.relevantMin !== null &&
      this.experience.relevantMin > this.experience.totalMin
    ) {
      this.errors.minExperience = true;
    } else {
      this.errors.minExperience = false;
    }

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
  
toggleNoticePeriodDropdown() {
    this.isNoticePeriodDropdownOpen = !this.isNoticePeriodDropdownOpen;
  }

  selectNoticePeriod(option: string) {
    this.selectedNoticePeriod = option;
    this.isNoticePeriodDropdownOpen = false;
    this.isNoticePeriodInvalid = false;
  }
   toggleGenderDropdown() {
    this.isGenderDropdownOpen = !this.isGenderDropdownOpen;
  }

  selectGender(option: string) {
    this.selectedGender = option;
    this.isGenderDropdownOpen = false;
    this.isGenderInvalid = false;
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
    { location: '', spoc: '', vacancies: '', email: '', phone: '' }
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
    this.additionalDetails.push({ location: '', spoc: '', vacancies: '', email: '', phone: '' });
  }

 onEdit(item: any) {

  // PERMISSION CHECK: Super User OR Assigned User OR Creator
    const canEdit = this.isSuperUser || 
                    this.isAssignedToRequirement(item) || 
                    this.isCreatorOfRequirement(item);

    if (!canEdit) {
        this.triggerAlert("Access Denied: Only assigned users or the creator can edit this requirement.", ['OK']);
        return;
    }

    this.isEditMode = true;
    this.currentRequirementId = item.id;
    this.showListing = false; // Switch to form view
    this.isFormVisible = true;

    // Populate Fields
    this.clientName = item.client_name;
    this.subClientName = item.sub_client_name;
    this.jobRole = item.job_role; 
    this.jobDescription = item.job_description;
this.interviewLocationsList = item.interview_location 
  ? item.interview_location.split(',').map((s: string) => s.trim()).filter(Boolean) 
  : [];
      this.interviewDate = item.interview_date;
    this.existingFileUrl = item.file_attachment;

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

    this.selectedNoticePeriod = item.notice_period;
    this.selectedGender = item.gender;

    // Populate Table
    if (item.location_details && item.location_details.length > 0) {
      this.additionalDetails = item.location_details.map((loc: any) => ({
        location: loc.location,
        spoc: loc.spoc_name,
        vacancies: loc.vacancies.toString(),
        email: loc.email || '',
        phone: loc.phone_number || ''
      }));
    } else {
      this.additionalDetails = [{ location: '', spoc: '', vacancies: '', email: '', phone: '' }];
    }

    // POPULATE ASSIGNED USERS
    if (item.assigned_users_details) {
      this.selectedAssignees = [...item.assigned_users_details];
    } else {
      this.selectedAssignees = [];
    }
    setTimeout(() => {
        this.onClientChange();
    }, 100);
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
  // 1. Reset Validations initially
  this.isClientNameInvalid = false;
  this.isJobRoleInvalid = false;
  this.isInterviewLocationInvalid = false;
  this.isJobDescriptionInvalid = false; // (Existing)

  this.isTotalExpInvalid = false;
    this.isRelevantExpInvalid = false;
    this.isSalaryInvalid = false;
    this.isInterviewDateInvalid = false;
    this.isNoticePeriodInvalid = false;
    this.isGenderInvalid = false;

  // 2. Perform Validation Checks
  let isValid = true;

  // Validate Client Name
  if (!this.clientName || this.clientName === '') {
    this.isClientNameInvalid = true;
    isValid = false;
  }

  // Validate Job Role
  if (!this.jobRole || this.jobRole.trim() === '') {
    this.isJobRoleInvalid = true;
    isValid = false;
  }else if (this.isJobRoleNumericOnly) {
      // New Check: Block submission if it's only numbers
      isValid = false; 
    }

  // Validate Interview Location
  if (this.interviewLocationsList.length === 0) {
    this.isInterviewLocationInvalid = true;
    isValid = false;
  }

  // Validate Job Description (Existing Logic)
  this.validateJobDescription(); 
  if (this.isJobDescriptionInvalid) {
    isValid = false;
  }

   if (this.experience.totalMin === null || this.experience.totalMax === null) {
        this.isTotalExpInvalid = true;
        isValid = false;
    }

    // 2. Relevant Experience
    if (this.experience.relevantMin === null || this.experience.relevantMax === null) {
        this.isRelevantExpInvalid = true;
        isValid = false;
    }

    // 3. Salary
    if (this.salary.min === null || this.salary.max === null) {
        this.isSalaryInvalid = true;
        isValid = false;
    }

    // 4. Interview Date
    if (!this.interviewDate) {
        this.isInterviewDateInvalid = true;
        isValid = false;
    }

    // 5. Notice Period
    if (!this.selectedNoticePeriod) {
        this.isNoticePeriodInvalid = true;
        isValid = false;
    }

    // 6. Gender
    if (!this.selectedGender) {
        this.isGenderInvalid = true;
        isValid = false;
    }


  // Validate Additional Details (Existing Logic)
  let hasDetailErrors = false;
  this.additionalDetails.forEach((_, index) => {
      this.validateAdditionalDetails(index);
      if (this.additionalDetailsErrors[index]?.email || this.additionalDetailsErrors[index]?.phone) {
          hasDetailErrors = true;
      }
  });

   if (this.errors.totalExpRange || this.errors.minExperience || this.errors.maxExperience) {
        this.triggerAlert('Please correct the experience range errors.', ['OK']);
        return;
    }

  // 3. Stop if Invalid
  if (!isValid || hasDetailErrors) {
    this.triggerAlert('Please fill in all required fields marked with *.', ['OK']);
    return; // STOP execution here
  }

    // --- Build the FormData object ---
    const formData = new FormData();
    formData.append('client_name', this.clientName);
    formData.append('sub_client_name', this.subClientName || '');
    formData.append('job_role', this.jobRole);
    formData.append('source', 'External');
    formData.append('total_experience_min', (this.experience.totalMin || 0).toString());
    formData.append('total_experience_max', (this.experience.totalMax || 0).toString());
    formData.append('relevant_experience_min', (this.experience.relevantMin || 0).toString());
    formData.append('relevant_experience_max', (this.experience.relevantMax || 0).toString());
    formData.append('salary_min', (this.salary.min || 0).toString());
    formData.append('salary_max', (this.salary.max || 0).toString());
    formData.append('notice_period', this.selectedNoticePeriod || '');
    formData.append('gender', this.selectedGender || '');
    formData.append('interview_location', this.interviewLocationsList.join(', '));
    if (this.interviewDate) {
        formData.append('interview_date', this.interviewDate);
    }
    formData.append('job_description', this.jobDescription);
    if (this.selectedFile) {
      formData.append('file_attachment', this.selectedFile, this.selectedFile.name);
    }

    // =================================================================
    // === MODIFIED LOGIC: ONLY APPEND 'assigned_users' FOR SUPERUSER ===
    // =================================================================
    if (this.isSuperUser) {
        if (this.selectedAssignees.length > 0) {
            // If users are selected, append each of their IDs
            this.selectedAssignees.forEach(user => {
                formData.append('assigned_users', user.user_id);
            });
        } else {
            // If no users are selected (or all were removed), send '[]'
            // This tells the backend to clear any existing assignments.
            formData.append('assigned_users', '[]');
        }
    }
    // For non-superusers, the 'assigned_users' field is never added to formData.
    // When editing, this means the backend will not touch the existing assignments.
    // When creating, the backend will leave the assignments empty.
    // =================================================================


    const validLocationDetails = this.additionalDetails
      .filter(d => d.location.trim() || d.spoc.trim() || d.vacancies.trim() || d.email.trim() || d.phone.trim())
      .map(d => ({
        location: d.location,
        spoc_name: d.spoc,
        email: d.email,
        phone_number: d.phone,
        vacancies: parseInt(d.vacancies, 10) || null // Send null if not a number
    }));
    if (validLocationDetails.length > 0) {
        formData.append('location_details', JSON.stringify(validLocationDetails));
    }

    // --- API Call Logic ---
    if (this.isEditMode && this.currentRequirementId) {
      // Handle UPDATE
      this.adbService.updateRequirement(this.currentRequirementId, formData).subscribe({
        next: (response) => {
          this.triggerAlert('Requirement updated successfully!', ['OK']);
          this.onCancel();
          this.fetchRequirements();
        },
        error: (err) => {
          const errorMessage = this.parseErrorResponse(err);
          this.triggerAlert(errorMessage, ['OK']);
        }
      });
    } else {
      // Handle CREATE
      this.adbService.createRequirement(formData).subscribe({
        next: (response) => {
          this.triggerAlert('Requirement created successfully!', ['OK']);
          this.onCancel();
          this.fetchRequirements();
        },
        error: (err) => {
          const errorMessage = this.parseErrorResponse(err);
          this.triggerAlert(errorMessage, ['OK']);
        }
      });
    }
  }
  // 4. UPDATE onCancel Function
   onCancel() {
    this.isFormVisible = false; // Hide the modal
    this.isEditMode = false;
    this.currentRequirementId = null;
    this.fileUploadError = null;
    this.existingFileUrl = null;
    this.selectedFile = null;

    // Reset all form fields
    this.clientName = '';
    this.subClientName = '';
    this.jobRole = '';
    this.isJobRoleNumericOnly = false;
    this.interviewLocation = '';
    this.interviewLocationsList = [];
    this.interviewLocationSuggestions = [];
    this.showInterviewLocationSuggestions = false;
    this.interviewDate = '';
    this.jobDescription = '';
    this.experience = { totalMin: null, totalMax: null, relevantMin: null, relevantMax: null };
    this.salary = { min: null, max: null };
    this.selectedNoticePeriod = '';
    this.selectedGender = '';
    this.additionalDetails = [{ location: '', spoc: '', vacancies: '', email: '', phone: '' }];
    this.selectedAssignees = [];
    this.userSearchText = '';

    // Reset validation errors
    this.isJobDescriptionInvalid = false;
    this.salaryErrors.rangeError = false;
    this.errors = { minExperience: false, maxExperience: false, totalExpRange: false  };

    this.isClientNameInvalid = false;
    this.isJobRoleInvalid = false;
    this.isInterviewLocationInvalid = false;

    this.isTotalExpInvalid = false;
    this.isRelevantExpInvalid = false;
    this.isSalaryInvalid = false;
    this.isInterviewDateInvalid = false;
    this.isNoticePeriodInvalid = false;
    this.isGenderInvalid = false;
    
  }

  showAddForm() {
    // 1. Clear any existing data first (reuses your Cancel logic to reset fields)
    this.onCancel(); 
    
    // 2. Ensure we are explicitly in "Create" mode, not "Edit" mode
    this.isEditMode = false;
    this.currentRequirementId = null;

    // 3. Show the Form (Hide Listing)
    this.showListing = false;
    this.isFormVisible = true;
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

    // Filter by Client Name (SAFE VERSION)
    if (filters.client_name) {
      const term = filters.client_name.toLowerCase();
      data = data.filter(item => 
        item.client_name && item.client_name.toLowerCase().includes(term)
      );
    }

    // Filter by Location (SAFE VERSION)
    if (filters.location) {
      const term = filters.location.toLowerCase();
      data = data.filter(item => 
        item.interview_location && item.interview_location.toLowerCase().includes(term)
      );
    }

    // Filter by Job Description/Skills (SAFE VERSION)
    if (filters.description) {
      const term = filters.description.toLowerCase();
      data = data.filter(item => 
        item.job_description && item.job_description.toLowerCase().includes(term)
      );
    }

    // Filter by Role (Already safe, remains the same)
    if (filters.role) {
      const term = filters.role.toLowerCase();
      data = data.filter(item => 
        item.job_role && item.job_role.toLowerCase().includes(term)
      );
    }

    // Filter by CTC (Already safe, but good practice to check)
    if (filters.ctc) {
      data = data.filter(item => item.current_ctc_range === filters.ctc);
    }

    // Apply Sorting (No changes here)
    if (this.currentSort === 'a-z') {
  // Sorts alphabetically from A-Z based on job_role
      data.sort((a, b) => (a.job_role || '').localeCompare(b.job_role || ''));
    } else if (this.currentSort === 'z-a') {
      // Sorts alphabetically from Z-A based on job_role
      data.sort((a, b) => (b.job_role || '').localeCompare(a.job_role || ''));
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

  navigateToAts(id: number): void {
    if (id) {
      // Navigates to the URL 'recruiter-workflow-ats/:id'
      this.router.navigate(['/recruiter-workflow-ats', id]);
    } else {
      console.error('Requirement ID is missing, cannot navigate to ATS.');
    }
  }

  // --- 3. LOCATION SEARCH SUGGESTION ---


  selectLocation(loc: any) {
    this.interviewLocation = loc.display_name.split(',')[0]; // Take city name
    this.showLocationSuggestions = false;
  }

  // --- 4. ADDITIONAL DETAILS (EMAIL/PHONE VALIDATION) ---
  
  // Regex patterns
  emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  phoneRegex = /^[0-9]{10}$/; // Simple 10 digit validation

  validateAdditionalDetails(index: number) {
    // Initialize error object for this index if not exists
    if (!this.additionalDetailsErrors[index]) {
      this.additionalDetailsErrors[index] = { email: '', phone: '' };
    }

    const currentItem = this.additionalDetails[index];
    const errors = this.additionalDetailsErrors[index];

    // 1. Email Format
    if (currentItem.email && !this.emailRegex.test(currentItem.email)) {
      errors.email = 'Invalid email format';
    } else {
      errors.email = '';
    }

    // 2. Phone Format
    if (currentItem.phone && !this.phoneRegex.test(currentItem.phone)) {
      errors.phone = 'Phone must be 10 digits';
    } else {
      errors.phone = '';
    }

    // 3. Duplicate Check (Check against other items in the array)
    const allEmails = this.additionalDetails.map(d => d.email).filter(e => e);
    const allPhones = this.additionalDetails.map(d => d.phone).filter(p => p);

    // Check Duplicate Email
    if (currentItem.email && allEmails.indexOf(currentItem.email) !== allEmails.lastIndexOf(currentItem.email)) {
       errors.email = 'Duplicate Email in list';
    }

    // Check Duplicate Phone
    if (currentItem.phone && allPhones.indexOf(currentItem.phone) !== allPhones.lastIndexOf(currentItem.phone)) {
       errors.phone = 'Duplicate Phone in list';
    }
  }
  
}