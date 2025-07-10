import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-details',
  templateUrl: 'details.component.html',
  styleUrls: ['details.component.css'],
})
export class Details {
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
