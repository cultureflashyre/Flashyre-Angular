import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent {
  @Input() problemId: number = 0;
  @Input() userId: number = 1; // Default user_id for testing; replace with actual user_id
  @Output() runCode = new EventEmitter<{ source_code: string, language_id: number, user_id: number }>();
  @Output() submitCode = new EventEmitter<{ source_code: string, language_id: number, user_id: number }>();

  languages = [
    { name: 'C++', id: 54, mode: 'c_cpp' },
    { name: 'Java', id: 62, mode: 'java' },
    { name: 'Python', id: 71, mode: 'python' },
    { name: 'JavaScript', id: 63, mode: 'javascript' }
  ];
  selectedLanguage = this.languages[0];
  code = '// Write your code here';
  editorOptions = { theme: 'ace/theme/monokai', mode: this.selectedLanguage.mode };

  onLanguageChange() {
    this.editorOptions = { ...this.editorOptions, mode: this.selectedLanguage.mode };
  }

  run() {
    this.runCode.emit({ source_code: this.code, language_id: this.selectedLanguage.id, user_id: this.userId });
  }

  submit() {
    this.submitCode.emit({ source_code: this.code, language_id: this.selectedLanguage.id, user_id: this.userId });
  }
}