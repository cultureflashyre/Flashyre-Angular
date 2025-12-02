import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { 
  ReactiveFormsModule, 
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
    RecruiterWorkflowNavbarComponent
  ]
})
export class RecruiterWorkflowClient implements OnInit {
  mainForm: FormGroup;
  existingClients: any[] = []; // Stores data fetched from DB

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
    // Add one default client form on load
    this.addClient();
    // Fetch existing clients for the bottom list
    this.fetchClients();
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
      this.mainForm.markAllAsTouched(); // Show all error messages
      return;
    }

    const payload = this.mainForm.value.clients; // Send the array of clients

    this.clientService.createClients(payload).subscribe({
      next: (response) => {
        console.log('Clients saved successfully', response);
        this.mainForm.reset();
        this.clientsArray.clear();
        this.addClient(); // Reset to initial state
        this.fetchClients(); // Refresh the list
      },
      error: (err) => {
        console.error('Error saving clients:', err);
      }
    });
  }

  onCancel(): void {
    this.mainForm.reset();
    this.clientsArray.clear();
    this.addClient();
  }
}