import { Component, OnInit, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'profile-basicinformation-component',
  templateUrl: 'profile-basicinformation-component.component.html',
  styleUrls: ['profile-basicinformation-component.component.css'],
})
export class ProfileBasicinformationComponent implements OnInit {
  @Input() textinputPlaceholder32: string = 'Enter your email';
  @Input() imageSrc: string = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDIwfHxnaXJsfGVufDB8fHx8MTczNDA4MzI2NHww&ixlib=rb-4.0.3&w=200';
  @Input() textinputPlaceholder4: string = 'Enter First name';
  @Input() textinputPlaceholder: string = 'Upload Resume';
  @ContentChild('text2') text2: TemplateRef<any>;
  @Input() textinputPlaceholder31: string = 'Enter Mobile Number';
  @Input() imageAlt: string = 'image';
  @ContentChild('text6') text6: TemplateRef<any>;
  @Input() textinputPlaceholder3: string = 'Enter Last Name';
  @Input() rootClassName: string = '';
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text52') text52: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text51') text51: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;

  profileForm: FormGroup;
  @Output() saveAndNext = new EventEmitter<FormData>();
  @Output() skip = new EventEmitter<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      profile_picture: [null],
      resume: [null],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', Validators.required]
    });
  }

  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.profileForm.patchValue({ profile_picture: input.files[0] });
      this.profileForm.get('profile_picture')?.updateValueAndValidity();
      const reader = new FileReader();
      reader.onload = (e: any) => (this.imageSrc = e.target.result);
      reader.readAsDataURL(input.files[0]);
    }
  }

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.profileForm.patchValue({ resume: input.files[0] });
      this.profileForm.get('resume')?.updateValueAndValidity();
    }
  }

  onSaveAndNext(): void {
    if (this.profileForm.valid) {
      const formData = new FormData();
      formData.append('profile_picture', this.profileForm.get('profile_picture')?.value || '');
      formData.append('resume', this.profileForm.get('resume')?.value || '');
      formData.append('first_name', this.profileForm.get('first_name')?.value);
      formData.append('last_name', this.profileForm.get('last_name')?.value);
      formData.append('email', this.profileForm.get('email')?.value);
      formData.append('phone_number', this.profileForm.get('phone_number')?.value);
      this.saveAndNext.emit(formData);
    }
  }

  onSkip(): void {
    this.skip.emit();
  }
}