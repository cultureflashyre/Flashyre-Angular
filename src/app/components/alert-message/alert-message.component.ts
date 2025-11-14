import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-alert-message',
    templateUrl: 'alert-message.component.html',
    styleUrls: ['alert-message.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class AlertMessageComponent {
  @Input() message: string = '';
  @Input() buttons: string[] = [];

  @Output() buttonClicked = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  onButtonClick(button: string) {
    this.buttonClicked.emit(button);
  }

  onClose() {
    this.close.emit();
  }
}
