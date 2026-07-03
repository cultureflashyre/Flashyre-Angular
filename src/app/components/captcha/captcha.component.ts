import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaptchaService } from '../../services/captcha.service';

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CaptchaComponent implements OnInit {
  captchaId: string = '';
  question: string = '';
  userAnswer: string = '';
  isLoading: boolean = false;

  @Output() captchaData = new EventEmitter<{ captchaId: string, captchaAnswer: string }>();

  constructor(private captchaService: CaptchaService) {}

  ngOnInit() {
    this.loadNewCaptcha();
  }

  /**
   * Fetches a new math challenge from the backend.
   */
  loadNewCaptcha() {
    this.isLoading = true;
    this.userAnswer = '';
    this.captchaData.emit({ captchaId: '', captchaAnswer: '' }); // Reset parent
    
    this.captchaService.generateCaptcha().subscribe({
      next: (data) => {
        this.captchaId = data.captcha_id;
        this.question = data.question;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load CAPTCHA:', err);
        this.question = 'Error loading challenge';
        this.isLoading = false;
      }
    });
  }

  /**
   * Called on keyup/change of the input field.
   * Emits the ID and answer to the parent component.
   */
  onInputChange() {
    this.captchaData.emit({
      captchaId: this.captchaId,
      captchaAnswer: this.userAnswer.trim()
    });
  }
}
