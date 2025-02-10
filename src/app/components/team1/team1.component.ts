import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-team1',
  templateUrl: 'team1.component.html',
})
export class Team1 {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
