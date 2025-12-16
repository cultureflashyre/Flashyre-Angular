
import { Component, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
    imports: [
    RouterModule,      // This makes <router-outlet> available in your template
    NgxSpinnerModule   // This makes <ngx-spinner> available in your template
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  {
  title = 'Flashyre';
}