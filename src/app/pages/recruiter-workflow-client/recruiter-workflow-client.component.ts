import { Component, OnInit } from '@angular/core';
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
    RecruiterWorkflowNavbarComponent
  ]
})
export class RecruiterWorkflowClient implements OnInit {
  mainForm: FormGroup;
  existingClients: any[] = []; // Stores data fetched from DB

  // CONTROLS VISIBILITY
showList: boolean = true;      // Shows the list by default
showForm: boolean = false;     // Hides the form by default
isLoading: boolean = false;    // Hides the loader by default

// EDIT MODE variables
isEditMode: boolean = false;   // Are we editing?
currentEditId: any = null;     // Which client are we editing?

// USER INFO variable
recruiterFirstName: string = 'Loading...';

  constructor(
    private title: Title, 
    private meta: Meta,
    private fb: FormBuilder,
    private clientService: AdbClientService
  ) {
    this.title.setTitle('Recruiter-Workflow-Client - Flashyre');
    
    // Initialize the main form containing an array of clients
    this.mainForm = this.fb.group({
      clients: this.fb.array([])
    });
  }

  ngOnInit(): void {
  // 1. Fetch the User Name
  this.fetchRecruiterName();

  // 2. Fetch the Client List
  this.fetchClients();
}

fetchRecruiterName(): void {
  // Get ID from cache (Local Storage)
  const userId = localStorage.getItem('user_id'); 

  if (userId) {
    // We assume you have a service method to get user details. 
    // If not, we will just show the ID for now, or you can connect your API here.
    // Ideally: this.userService.getUser(userId).subscribe(...)
    
    // For now, let's simulate fetching it or use a service if you have one linked to that Django model.
    console.log("Fetching name for user:", userId);
    // Placeholder logic:
    this.recruiterFirstName = "Recruiter (" + userId + ")"; 
    
    // REAL WORLD CODE (Uncomment if you have the service):
    /*
    this.clientService.getUserName(userId).subscribe(data => {
       this.recruiterFirstName = data.first_name;
    });
    */
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
      location: ['', Validators.required],
      spoc_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      phone_number: ['', [Validators.required, Validators.pattern('^[0-9+]+$')]],
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

  fetchClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.existingClients = data;
      },
      error: (err) => {
        console.error('Error fetching clients:', err);
      }
    });
  }

  onSubmit(): void {
  if (this.mainForm.invalid) {
    this.mainForm.markAllAsTouched();
    return;
  }

  // 1. Show Loader, Hide Form
  this.isLoading = true;
  this.showForm = false; 

  const payload = this.mainForm.value.clients;

  if (this.isEditMode) {
    // --- UPDATE LOGIC ---
    // In edit mode, we usually update one client. 
    // We use the ID we saved earlier.
    const clientData = payload[0]; 
    this.clientService.updateClient(this.currentEditId, clientData).subscribe({
      next: () => {
        this.finishSubmit();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false; // Stop loader on error
        this.showForm = true;   // Show form again so they can fix it
      }
    });

  } else {
    // --- CREATE LOGIC ---
    this.clientService.createClients(payload).subscribe({
      next: () => {
        this.finishSubmit();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.showForm = true;
      }
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
  // 1. Get the list of selected clients
  const selected = this.existingClients.filter(c => c.selected);

  if (selected.length === 0) {
    alert('Select At least one client');
    return;
  }

  if (confirm('Are you sure to delete all those clients?')) {
    // 2. Loop through and delete each one
    // Note: In a professional app, we would send one "Bulk Delete" request.
    // For now, we will do it one by one.
    
    let deletedCount = 0;
    
    selected.forEach((client) => {
      const id = client.id || client.client_id;
      
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          deletedCount++;
          // If we have deleted all of them, refresh the list
          if (deletedCount === selected.length) {
             this.fetchClients();
             // Uncheck the "Select All" box
             const selectAllBox = document.getElementById('select-checkbox') as HTMLInputElement;
             if(selectAllBox) selectAllBox.checked = false;
          }
        },
        error: (err) => console.error('Error deleting', id, err)
      });
    });
  }
}

deleteSingleClient(client: any): void {
  if (confirm('Are you sure to delete this client?')) {
    // We assume your client object has a property called 'id' or 'client_id'
    // Check your console logs if 'id' is undefined.
    const idToDelete = client.id || client.client_id; 

    this.clientService.deleteClient(idToDelete).subscribe({
      next: () => {
        alert('Client deleted successfully');
        this.fetchClients(); // Refresh the list!
      },
      error: (err) => {
        console.error('Delete failed', err);
        alert('Failed to delete client');
      }
    });
  }
}

// --- EDIT LOGIC ---
editClientClick(client: any): void {
  if (confirm('Are you sure to edit this client data')) {
    this.isEditMode = true;
    this.currentEditId = client.id; // Save ID for later

    // Prepare the form
    this.clientsArray.clear();
    
    // Create a form group and fill it with data
    const group = this.createClientGroup();
    group.patchValue({
      company_name: client.company_name,
      client_name: client.client_name,
      sub_client_name: client.sub_client_name,
      client_description: client.client_description
    });

    // Handle Contacts (Locations)
    // Clear default contact and add existing ones
    const contactsFormArray = group.get('contacts') as FormArray;
    contactsFormArray.clear();
    
    client.contacts.forEach((contact: any) => {
      const contactGroup = this.createContactGroup();
      contactGroup.patchValue(contact);
      contactsFormArray.push(contactGroup);
    });

    this.clientsArray.push(group);

    // Switch Views
    this.showList = false;
    this.showForm = true;
  }
}

// --- DOWNLOAD PDF LOGIC ---
downloadClientData(client: any): void {
  if (confirm('Are you sure to download this client data')) {
    alert('Downloading PDF for ' + client.client_name + '...');
    
    // NOTE: To do real PDF, you need a library like 'jspdf'. 
    // Since we are keeping it simple:
    console.log("PDF Data:", JSON.stringify(client));
    // If you install jspdf later, you put the code here.
  }
}

  onCancel(): void {
    this.mainForm.reset();
    this.clientsArray.clear();
    this.addClient();
  }
}