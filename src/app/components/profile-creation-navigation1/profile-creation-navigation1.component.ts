import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter  } from '@angular/core'
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'profile-creation-navigation1',
  templateUrl: 'profile-creation-navigation1.component.html',
  styleUrls: ['profile-creation-navigation1.component.css'],
})
export class ProfileCreationNavigation1 {
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>

  @Output() saveAndNextClicked = new EventEmitter<any>();
  @Output() skipClicked = new EventEmitter<void>();
  @Output() previousClicked = new EventEmitter<void>();

  constructor(private navigationService: NavigationService) {}

  onSkipClick(): void {
    this.skipClicked.emit();
  }

  onSaveAndNextClick(data: any): void {
    this.saveAndNextClicked.emit(data);
  }

    onPreviousClick(): void {
    this.previousClicked.emit();
  }
}
