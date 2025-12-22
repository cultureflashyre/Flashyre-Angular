import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { Component, OnInit, NgZone, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { 
  ReactiveFormsModule,
  FormsModule,
  FormBuilder, 
  FormGroup, 
  FormArray, 
  Validators,
  AbstractControl 
} from '@angular/forms';

import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { AdbClientService } from '../../services/adb-client.service'; // Adjust path as needed
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from 'src/environments/environment';
import { Subject, Subscription, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'recruiter-workflow-client',
  templateUrl: 'recruiter-workflow-client.component.html',
  styleUrls: ['recruiter-workflow-client.component.css'],
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule, // Important for Forms
    FormsModule,
    RecruiterWorkflowNavbarComponent,
    AlertMessageComponent
  ]
})
export class RecruiterWorkflowClient implements OnInit, AfterViewInit, OnDestroy {
  mainForm: FormGroup;
  existingClients: any[] = []; // Stores data fetched from DB

   // --- NEW PROPERTIES FOR DETAIL MODAL ---
  showDetailsModal = false;
  selectedClientDetails: any | null = null;

  masterClients: any[] = []; // The original full list from DB
  isFilterPanelVisible: boolean = false;
  filterForm: FormGroup;
  currentSort: string = 'none';

  showToast: boolean = false;
  toastMessage: string = '';

  isErrorToast: boolean = false;

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];

  private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
  private loader: Loader = new Loader({
    apiKey: this.googleMapsApiKey,
    version: 'weekly',
    libraries: ['places']
  });
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any;
  
  // Stream for input
  private locationInput$ = new Subject<string>();
  private subscriptions = new Subscription();

  // State for suggestions
  locationSuggestions: google.maps.places.AutocompletePrediction[] = [];
  
  // Track WHICH input is currently active (Client Index -> Contact Index)
  activeField: { clientIndex: number, contactIndex: number } | null = null;
  
  // Stores the action waiting for confirmation
  // type: 'SUBMIT_CREATE', 'SUBMIT_UPDATE', 'DELETE_BULK', 'DELETE_SINGLE', 'EDIT_MODE', 'DOWNLOAD'
  pendingAction: { type: string, data?: any } = { type: '' };

    // CONTROLS VISIBILITY
  showList: boolean = true;      // Shows the list by default
  showForm: boolean = false;     // Hides the form by default
  isLoading: boolean = false;    // Hides the loader by default

  // EDIT MODE variables
  isEditMode: boolean = false;   // Are we editing?
  currentEditId: any = null;     // Which client are we editing?

  // USER INFO variable
  recruiterFirstName: string = 'Loading...';
  isSuperUser: boolean = false;

  isPageLoading: boolean = true;

  constructor(
    private title: Title, 
    private meta: Meta,
    private fb: FormBuilder,
    private clientService: AdbClientService,
    private ngZone: NgZone
  ) {
    this.title.setTitle('Recruiter-Workflow-Client - Flashyre');
    
    // Initialize the main form containing an array of clients
    this.mainForm = this.fb.group({
      clients: this.fb.array([])
    });

    this.filterForm = this.fb.group({
      company_name: ['', [Validators.pattern('^[a-zA-Z0-9\\s]*$')]], 
      client_name: ['', [Validators.pattern('^[a-zA-Z0-9\\s]*$')]],
      location: ['', [Validators.pattern('.*[a-zA-Z].*')]], 
      date_created: ['']
    });
  }

   // === NEW METHODS FOR DETAIL POPUP ===
  
  openClientDetails(client: any): void {
    this.selectedClientDetails = client;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedClientDetails = null;
  }

  ngOnInit(): void {
  // 1. Fetch the User Name
  this.fetchRecruiterName();

  // 2. Fetch the Client List
  this.fetchClients();
}

fetchRecruiterName(): void {
  // 1. Get ID from cache
  const userId = localStorage.getItem('user_id'); 
  
  // 2. Check for Super User status (Based on your screenshot)
  const isSuper = localStorage.getItem('isSuperUser');
  this.isSuperUser = (isSuper === 'true'); // Converts string "true" to boolean true

  if (userId) {
    console.log("Fetching name for user:", userId);
    this.recruiterFirstName = "Recruiter (" + userId + ")"; 
  } else {
    this.recruiterFirstName = "Guest";
  }
}

  openAddClientForm(): void {
  this.isEditMode = false;       // We are NOT editing
  this.mainForm.reset();         // Clear old data
  this.clientsArray.clear();     // Remove old rows
  this.addClient();              // Add one empty row
  
  this.showList = false;         // Hide List
  this.showForm = true;          // Show Form
}

// 2. Click "Cancel" -> Hide Form, Show List
closeForm(): void {
  this.showList = true;
  this.showForm = false;
  this.isEditMode = false;
}


  // --- Getters for easy access in HTML ---
  get clientsArray(): FormArray {
    return this.mainForm.get('clients') as FormArray;
  }

  getContactsArray(clientIndex: number): FormArray {
    return this.clientsArray.at(clientIndex).get('contacts') as FormArray;
  }

  // --- Form Construction Helpers ---
  
  // Creates the structure for a Single Client
  createClientGroup(): FormGroup {
    return this.fb.group({
      company_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      client_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      sub_client_name: ['', [Validators.pattern('^[a-zA-Z\\s]+$')]], // Optional
      client_description: ['', Validators.required],
      contacts: this.fb.array([this.createContactGroup()]) // Start with 1 location
    });
  }

  // Creates the structure for a Single Contact/Location
  createContactGroup(): FormGroup {
    return this.fb.group({
      // Req 3: Must contain at least one alphabet (cannot be just numbers or special chars)
      location: ['', [Validators.required, Validators.pattern('.*[a-zA-Z].*')]],
      
      // Req 4: Only characters and spaces
      spoc_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      
      // Req 5: Only digits (Phone numbers)
      phone_number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      
      // Req 6: Valid Email format
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // --- Actions ---

  addClient(): void {
    this.clientsArray.push(this.createClientGroup());
  }

  removeClient(index: number): void {
    this.clientsArray.removeAt(index);
  }

  addLocation(clientIndex: number): void {
    this.getContactsArray(clientIndex).push(this.createContactGroup());
  }

  removeLocation(clientIndex: number, contactIndex: number): void {
    this.getContactsArray(clientIndex).removeAt(contactIndex);
  }

  // --- API Interaction ---

  fetchClients(onComplete?: () => void): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        // 1. Store Original Data
        this.masterClients = data.map(client => ({ ...client, selected: false }));
        
        // 2. Apply current filters/sort to populate existingClients (the view list)
        this.applyFiltersAndSort();
        this.isPageLoading = false;
        if (onComplete) onComplete();
      },
      error: (err) => {
        console.error('Error fetching clients:', err);
        this.isPageLoading = false;
        if (onComplete) onComplete();
      }
    });
  }

  onSubmit(): void {
    // Validation Check
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      this.openAlert('Please fix the validation errors in the form before submitting.', ['OK']);
      return;
    }

    const clients = this.mainForm.value.clients;

    // Iterate through each client block
    for (let i = 0; i < clients.length; i++) {
      const contacts = clients[i].contacts;
      const emails = contacts.map((c: any) => c.email.toLowerCase());
      const phones = contacts.map((c: any) => c.phone_number);

      // Check for duplicate Emails in the current form
      const hasDuplicateEmails = emails.some((item: any, idx: number) => emails.indexOf(item) !== idx);
      if (hasDuplicateEmails) {
        this.openAlert(`Duplicate email addresses found in Client #${i + 1}. Each contact must have a unique email.`, ['OK']);
        return;
      }

      // Check for duplicate Phones in the current form
      const hasDuplicatePhones = phones.some((item: any, idx: number) => phones.indexOf(item) !== idx);
      if (hasDuplicatePhones) {
        this.openAlert(`Duplicate phone numbers found in Client #${i + 1}. Each contact must have a unique number.`, ['OK']);
        return;
      }
    }

    // Trigger Alert instead of window.confirm
    if (this.isEditMode) {
      this.pendingAction = { type: 'SUBMIT_UPDATE' };
      this.openAlert('Are you sure you want to update this client details?', ['Cancel', 'Update']);
    } else {
      this.pendingAction = { type: 'SUBMIT_CREATE' };
      this.openAlert('Are you sure you want to add this client?', ['Cancel', 'Add']);
    }
  }

  // Logic moved here to be called AFTER confirmation
  proceedWithSubmit(): void {
    this.isLoading = true;
    this.showForm = false; 

    const payload = this.mainForm.value.clients;

    const handleSuccess = () => {
      this.fetchClients(() => {
         this.isLoading = false; 
         this.showList = true;
         this.mainForm.reset();
         this.clientsArray.clear();
         this.addClient();

         // --- START OF NEW CODE ---
         // Trigger the success message based on the mode
         if (this.isEditMode) {
           this.showSuccessToast('Client data updated successfully');
         } else {
           this.showSuccessToast('Client added successfully');
         }
         // --- END OF NEW CODE ---
      });
    };

    const handleError = (err: any) => {
      console.error(err);
      this.isLoading = false;
      this.showForm = true; // Re-open form so they can fix it

      let msg = 'Failed to save data. Please check your inputs.';
      
      // 1. Check if backend sent an Array (Your current scenario)
      // Structure: [{"detail": ["The email..."]}]
      if (Array.isArray(err.error) && err.error.length > 0) {
        const firstError = err.error[0]; // Get { detail: [...] }
        
        // Check if 'detail' exists inside that object
        if (firstError.detail) {
           // If 'detail' is an array (["Message"]), take the first item
           if (Array.isArray(firstError.detail)) {
             msg = firstError.detail[0];
           } else {
             // If 'detail' is just a string ("Message"), use it directly
             msg = firstError.detail;
           }
        } else {
           // Fallback: If structure isn't what we expect, show the raw JSON
           msg = JSON.stringify(err.error);
        }
      } 
      // 2. Check if backend sent a simple object (Django default for some errors)
      // Structure: { "detail": "The email..." }
      else if (err.error && err.error.detail) {
        msg = err.error.detail;
      }
      // 3. Fallback for unexpected formats
      else if (err.error) {
        msg = JSON.stringify(err.error);
      }

      this.openAlert(msg, ['OK']);
    };

    if (this.isEditMode) {
      // Use pendingAction type or existing logic to determine mode
      const clientData = payload[0]; 
      this.clientService.updateClient(this.currentEditId, clientData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.clientService.createClients(payload).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }


// Helper to clean up after save
finishSubmit(): void {
  setTimeout(() => {
    // Wait a little bit so user sees the loader (optional)
    this.isLoading = false;      // Stop loader
    this.showList = true;        // Show the list again
    this.fetchClients();         // Refresh data
    alert('Success!');           // Simple success message (or use your custom UI)
  }, 1000);
}

  toggleSelectAll(event: any): void {
  const isChecked = event.target.checked;
  // Loop through all clients and set a temporary property 'selected'
  this.existingClients.forEach(client => client.selected = isChecked);
}

// --- DELETE LOGIC ---
deleteSelectedClients(): void {
    const selected = this.existingClients.filter(c => c.selected);

    if (selected.length === 0) {
      this.openAlert('Select at least one client', ['OK']);
      return;
    }

    this.pendingAction = { type: 'DELETE_BULK' };
    this.openAlert('Are you sure to delete all those clients?', ['Cancel', 'Delete']);
  }

  proceedWithBulkDelete(): void {
    const selected = this.existingClients.filter(c => c.selected);
    let deletedCount = 0;
    
    selected.forEach((client) => {
      const id = client.id || client.client_id;
      
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount === selected.length) {
             this.fetchClients();
             const selectAllBox = document.getElementById('select-checkbox') as HTMLInputElement;
             if(selectAllBox) selectAllBox.checked = false;
          }
        },
        error: (err) => console.error('Error deleting', id, err)
      });
    });
  }

deleteSingleClient(client: any): void {
    this.pendingAction = { type: 'DELETE_SINGLE', data: client };
    this.openAlert('Are you sure to delete this client?', ['Cancel', 'Delete']);
  }

  proceedWithSingleDelete(client: any): void {
    const idToDelete = client.id || client.client_id; 

    this.clientService.deleteClient(idToDelete).subscribe({
      next: () => {
        // Optional: Show success alert or just refresh
        // this.openAlert('Client deleted successfully', ['OK']); 
        this.fetchClients(); 
        this.showSuccessToast('Client deleted successfully');
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.showErrorToast('Failed to delete client');
      }
    });
  }

// --- EDIT LOGIC ---
editClientClick(client: any): void {
    this.pendingAction = { type: 'EDIT_MODE', data: client };
    this.openAlert('Are you sure to edit this client data?', ['Cancel', 'Edit']);
  }

  proceedWithEdit(client: any): void {
    this.isEditMode = true;
    this.currentEditId = client.id; 

    this.clientsArray.clear();
    
    const group = this.createClientGroup();
    group.patchValue({
      company_name: client.company_name,
      client_name: client.client_name,
      sub_client_name: client.sub_client_name,
      client_description: client.client_description
    });

    const contactsFormArray = group.get('contacts') as FormArray;
    contactsFormArray.clear();
    
    client.contacts.forEach((contact: any) => {
      const contactGroup = this.createContactGroup();
      contactGroup.patchValue(contact);
      contactsFormArray.push(contactGroup);
    });

    this.clientsArray.push(group);

    this.showList = false;
    this.showForm = true;
  }

// --- DOWNLOAD PDF LOGIC ---
downloadClientData(client: any): void {
    this.pendingAction = { type: 'DOWNLOAD', data: client };
    this.openAlert('Are you sure to download this client data?', ['Cancel', 'Download']);
  }

  onCancel(): void {
    this.mainForm.reset();
    this.clientsArray.clear();
    this.addClient();
  }

  getHumanDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Normalize times to midnight for accurate day comparison
    const dateMidnight = new Date(date.setHours(0, 0, 0, 0));
    const nowMidnight = new Date(now.setHours(0, 0, 0, 0));
    
    const diffTime = nowMidnight.getTime() - dateMidnight.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 0) {
      return 'Today'; // Or 'Now' if you prefer
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      // Return standard date format (e.g., Dec 3, 2025)
      // You can adjust 'en-US' to your locale
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    }
  }

  // 2. Helper to determine if we show 'Created at' or 'Edited at'
  // Returns an object with { label: string, date: string }
  getDateStatus(client: any): { label: string, date: string } {
    const created = new Date(client.created_at).getTime();
    const updated = new Date(client.updated_at).getTime();

    // If updated time is significantly larger than created time (e.g., > 1 second difference)
    // we consider it Edited.
    if (updated - created > 1000) {
      return { 
        label: 'Updated at :', 
        date: client.updated_at 
      };
    } else {
      return { 
        label: 'Created at :', 
        date: client.created_at 
      };
    }
  }

  openAlert(message: string, buttons: string[]): void {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  // 2. Handle Button Clicks from the Custom Alert
  onAlertButtonClicked(action: string): void {
    this.showAlert = false; // Close popup
    
    // Normalize action string (handle case sensitivity)
    const act = action.toLowerCase();

    // If user clicked Cancel, No, or OK (for simple info), just clear pending action and return
    if (act === 'cancel' || act === 'no') {
      this.pendingAction = { type: '' };
      return;
    }

    // Proceed based on the Pending Action Type
    if (act === 'add' || act === 'update' || act === 'delete' || act === 'edit' || act === 'yes' || act === 'download' || act === 'ok') {
      
      switch (this.pendingAction.type) {
        case 'SUBMIT_CREATE':
        case 'SUBMIT_UPDATE':
          this.proceedWithSubmit(); // We will separate the API logic into this function
          break;
          
        case 'DELETE_BULK':
          this.proceedWithBulkDelete();
          break;
          
        case 'DELETE_SINGLE':
          this.proceedWithSingleDelete(this.pendingAction.data);
          break;
          
        case 'EDIT_MODE':
          this.proceedWithEdit(this.pendingAction.data);
          break;

        case 'REMOVE_LOCATION_ROW':
          const { clientIndex, contactIndex } = this.pendingAction.data;
          this.removeLocation(clientIndex, contactIndex);
          break;
          
        case 'DOWNLOAD':
          // Just a console log for now as per previous code
          console.log("PDF Data:", JSON.stringify(this.pendingAction.data));
          // You could call this.showSuccessPopup here if you had one
          break;
      }
    }
    
    // Reset pending action
    this.pendingAction = { type: '' };
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.showToast = true;

    // Hide after 2 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 2000);
  }

  showErrorToast(message: string): void {
  this.isErrorToast = true; // Red mode
  this.toastMessage = message;
  this.showToast = true;
  setTimeout(() => {
    this.showToast = false;
  }, 3000); 
}

   toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  // The Core Logic Engine
  applyFiltersAndSort(): void {
    let clients = [...this.masterClients]; // Start with full list
    const filters = this.filterForm.value;

    // 1. Filter by Company Name
    if (filters.company_name) {
      const term = filters.company_name.toLowerCase();
      clients = clients.filter(c => c.company_name.toLowerCase().includes(term));
    }

    // 2. Filter by Client Name
    if (filters.client_name) {
      const term = filters.client_name.toLowerCase();
      clients = clients.filter(c => c.client_name.toLowerCase().includes(term));
    }

    // 3. Filter by Location (Nested Check)
    if (filters.location) {
      const term = filters.location.toLowerCase();
      clients = clients.filter(c => 
        c.contacts.some((contact: any) => contact.location.toLowerCase().includes(term))
      );
    }

    // 4. Filter by Date (Exact match on YYYY-MM-DD)
    if (filters.date_created) {
      clients = clients.filter(c => c.created_at.startsWith(filters.date_created));
    }

    // 5. Apply Sorting
    if (this.currentSort === 'a-z') {
      clients.sort((a, b) => a.company_name.localeCompare(b.company_name));
    } else if (this.currentSort === 'z-a') {
      clients.sort((a, b) => b.company_name.localeCompare(a.company_name));
    } else if (this.currentSort === 'newest') {
      clients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (this.currentSort === 'oldest') {
      clients.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    // Update the View List
    this.existingClients = clients;
  }

  applyFiltersFromPanel(): void {
    if (this.filterForm.invalid) {
      // Optional: Add a touched mark to show errors immediately if not already shown
      this.filterForm.markAllAsTouched();
      return; 
    }
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  clearFilters(): void {
    this.filterForm.reset({ company_name: '', client_name: '', location: '', date_created: '' });
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  sortClients(event: Event): void {
    this.currentSort = (event.target as HTMLSelectElement).value;
    this.applyFiltersAndSort();
  }

  confirmRemoveLocation(clientIndex: number, contactIndex: number): void {
    // Store the indices in pendingAction so we know what to delete if confirmed
    this.pendingAction = { 
      type: 'REMOVE_LOCATION_ROW', 
      data: { clientIndex, contactIndex } 
    };
    
    // Open the alert with OK and Cancel buttons
    this.openAlert('Are you sure you want to remove this location?', ['Cancel', 'OK']);
  }
ngAfterViewInit(): void {
    this.initializeGooglePlaces();
    this.setupLocationAutocomplete();
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
      console.error('Google Maps script could not be loaded.', error);
    }
  }

  // --- Setup RxJS Stream ---
  private setupLocationAutocomplete(): void {
    this.subscriptions.add(
      this.locationInput$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => this.getPlacePredictions(term))
      ).subscribe(suggestions => {
        this.ngZone.run(() => {
          this.locationSuggestions = suggestions;
        });
      })
    );
  }

  // --- Fetch Predictions from Google ---
  private getPlacePredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (!term.trim() || !this.placesService) {
      return of([]);
    }
    
    // Initialize session token if missing
    if (!this.sessionToken && this.google) {
      this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
    }

    return new Observable(observer => {
      const request = {
        input: term,
        types: ['(cities)'], // Filter for cities
        sessionToken: this.sessionToken
      };

      this.placesService!.getPlacePredictions(request, (predictions, status) => {
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

  // --- HTML Event: User Types ---
  onLocationInput(event: Event, cIndex: number, locIndex: number): void {
    const input = event.target as HTMLInputElement;
    
    // Sanitize: Allow Alphabets, spaces, hyphens
    input.value = input.value.replace(/[^a-zA-Z \-]/g, '');
    
    // Mark which specific row is active
    this.activeField = { clientIndex: cIndex, contactIndex: locIndex };

    const term = input.value;
    if (!term.trim()) {
      this.locationSuggestions = [];
      return;
    }
    this.locationInput$.next(term);
  }

  // --- HTML Event: User Clicks Suggestion ---
  selectLocation(suggestion: google.maps.places.AutocompletePrediction, cIndex: number, locIndex: number): void {
    const locationName = suggestion.description;
    
    // Update the specific Form Control
    const contactsArray = this.getContactsArray(cIndex);
    const contactGroup = contactsArray.at(locIndex);
    
    if (contactGroup) {
      contactGroup.get('location')?.setValue(locationName);
    }

    // Clear suggestion state
    this.locationSuggestions = [];
    this.activeField = null;
    this.sessionToken = undefined; // Reset token for billing efficiency
  }
  
  // --- HTML Event: Blur (Click away) ---
  closeSuggestions(): void {
    // Delay to allow 'selectLocation' (mousedown) to fire first
    setTimeout(() => {
        this.activeField = null;
    }, 200);
  }

}