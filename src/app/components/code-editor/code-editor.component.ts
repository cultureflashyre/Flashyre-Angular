import { Component, EventEmitter, Input, Output, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import { FormsModule } from '@angular/forms';
import { AlertMessageComponent } from '../alert-message/alert-message.component'; 

@Component({
    selector: 'app-code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ['./code-editor.component.css'],
    standalone: true,
    imports: [FormsModule, AlertMessageComponent]
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {
  @Input() problemId: number = 0;
  @Input() initialCode: string = '';
  @Input() initialLanguage: any;

  @Output() runCode = new EventEmitter<{ source_code: string, language_id: number }>();
  @Output() submitCode = new EventEmitter<{ source_code: string, language_id: number }>();
  @Output() codeChange = new EventEmitter<{ code: string; language: any }>();
  @ViewChild('editor') private editorRef!: ElementRef<HTMLDivElement>;

  languages = [
    { name: 'C++', id: 54, mode: 'ace/mode/c_cpp' },
    { name: 'Java', id: 62, mode: 'ace/mode/java' },
    { name: 'Python', id: 71, mode: 'ace/mode/python' },
    { name: 'JavaScript', id: 63, mode: 'ace/mode/javascript' }
  ];
  selectedLanguage = this.languages[0];
  // Define constant placeholder
  private readonly PLACEHOLDER_CODE = '// Write your code here'; 
  code = this.PLACEHOLDER_CODE;
  private editor?: ace.Ace.Editor;

  // State for Alert Message
  showValidationAlert: boolean = false;

  constructor() {}

  ngAfterViewInit() {
    this.setupAceEditor();
  }

    /**
     * THIS IS THE KEY MECHANISM FOR STATE PERSISTENCE.
     * This hook fires whenever an @Input() property changes. When the parent navigates
     * to a new section, it changes the `problemId`, `initialCode`, and `initialLanguage`
     * bindings, which triggers this function.
     */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.editor) {
      // If problemId has changed, we know we've navigated to a new question.
      if (changes['problemId'] && !changes['problemId'].firstChange) {
        
        // 1. Get the new language from the parent, or default to C++
        this.selectedLanguage = this.initialLanguage || this.languages[0];
        this.editor.session.setMode(this.selectedLanguage.mode);

        // 2. Get the new code from the parent, or default to the placeholder
        const newCode = this.initialCode || '// Write your code here';
        
        // 3. Update the editor only if the code is actually different to avoid losing cursor position
        if (this.editor.getValue() !== newCode) {
            this.editor.setValue(newCode, -1); // -1 moves cursor to start
        }
      }
    }
  }

  setupAceEditor() {
    if (this.editorRef && this.editorRef.nativeElement) {
      this.editor = ace.edit(this.editorRef.nativeElement);
      this.editor.setTheme('ace/theme/monokai');

      this.selectedLanguage = this.initialLanguage || this.languages[0];
      this.code = this.initialCode || '// Write your code here';

      this.editor.session.setMode(this.selectedLanguage.mode);
      this.editor.setValue(this.code, 1); // Move cursor to the end
      this.editor.setOptions({
        showLineNumbers: true,
        tabSize: 2,
        fontSize: 14,
        showPrintMargin: false
      });
      this.editor.on('change', () => {
        this.code = this.editor!.getValue();
        // This emit is how the parent knows the user is typing
        this.codeChange.emit({ code: this.code, language: this.selectedLanguage });
      });
    }
  }

  onLanguageChange() {
    if (this.editor) {
      this.editor.session.setMode(this.selectedLanguage.mode);
      // This emit is how the parent knows the language changed
      this.codeChange.emit({ code: this.code, language: this.selectedLanguage });
    }
  }

  run() {
    this.runCode.emit({ source_code: this.code, language_id: this.selectedLanguage.id });
  }

  submit() {
    // 1. Get the latest value and trim whitespace
    const currentCode = this.code ? this.code.trim() : '';

    // 2. Validation Logic: Check if empty or equals placeholder
    if (!currentCode || currentCode === this.PLACEHOLDER_CODE) {
      this.showValidationAlert = true;
      return; // Stop submission
    }

    this.submitCode.emit({ source_code: this.code, language_id: this.selectedLanguage.id });
  }

  // Handle closing the alert
  closeAlert() {
    this.showValidationAlert = false;
  }

  /**
   * Public method that can be called by a parent component.
   * It commands the Ace editor instance to resize itself to fit its container.
   */
  public onResize(): void {
    if (this.editor) {
      this.editor.resize();
    }
  }
}