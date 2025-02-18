import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'signup-corporate',
  templateUrl: 'signup-corporate.component.html',
  styleUrls: ['signup-corporate.component.css'],
})
export class SignupCorporate {
  firstName: string = '';
  lastName: string = '';
  companyName: string = '';
  phoneNumber: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  message: string = '';

  constructor(private title: Title, private meta: Meta,private http: HttpClient) {
    this.title.setTitle('Signup-Corporate - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Signup-Corporate - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }
  onSubmit() {
    const data = {
      first_name: this.firstName,
      last_name: this.lastName,
      company_name: this.companyName,
      phone_number: this.phoneNumber,
      email: this.email,
      password: this.password
    };

    this.message = 'The data is being sent...';

    this.http.post('http://localhost:8000/api/signup-corporate/', data)
      .subscribe(
        (response: any) => {
          this.message = 'Signup successful!';
          console.log(response);
        },
        (error) => {
          this.message = 'Error during signup. Please try again.';
          console.error(error);
        }
      );
  }
}

