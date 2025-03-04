import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'log-in-page',
  templateUrl: 'log-in-page.component.html',
  styleUrls: ['log-in-page.component.css'],
})
export class LogInPage implements OnChanges {
  // ContentChild templates passed from the parent component
  @ContentChild('text11') text11: TemplateRef<any>; // Password label
  @ContentChild('text4') text4: TemplateRef<any>;   // Sign up link text
  @ContentChild('text71') text71: TemplateRef<any>; // Unused error message template (optional use)
  @ContentChild('text1') text1: TemplateRef<any>;   // Email label
  @ContentChild('text3') text3: TemplateRef<any>;   // "Don’t have an account?" text
  @ContentChild('heading') heading: TemplateRef<any>; // Welcome heading
  @ContentChild('forgotPassword') forgotPassword: TemplateRef<any>; // Forgot Password link
  @ContentChild('button') button: TemplateRef<any>; // Login button text
  @ContentChild('text2') text2: TemplateRef<any>;   // Show/Hide password text

  // Input properties for placeholders and root class
  @Input() textinputPlaceholder1: string = 'Enter Password';
  @Input() textinputPlaceholder: string = 'Enter your email';
  @Input() rootClassName: string = '';
  @Input() errorMessage: string = ''; // Error message from parent (e.g., "Invalid Email or Password")

  // Output event to emit login data to parent
  @Output() loginSubmit = new EventEmitter<{ email: string, password: string }>();

  // Component properties
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor() {}

  // Optional: Debugging to verify errorMessage updates
  ngOnChanges(changes: SimpleChanges) {
    if (changes['errorMessage']) {
      console.log('Error Message Updated:', this.errorMessage);
    }
  }

  // Handle form submission
  onSubmit() {
    if (this.email && this.password) {
      this.loginSubmit.emit({ email: this.email, password: this.password });
    } else {
      // Optional: Set a local error if fields are empty
      this.errorMessage = 'Please enter both email and password';
    }
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}