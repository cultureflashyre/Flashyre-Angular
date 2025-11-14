import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'not-found',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    ],
  templateUrl: 'not-found.component.html',
  styleUrls: ['not-found.component.css'],
})
export class NotFound {
  constructor(private title: Title) {
    this.title.setTitle('404 - Not Found')
  }
}
