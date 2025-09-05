import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ProgrammingLanguage } from '../../pages/coding-assessment/models';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements OnInit {
  @Input() languages: ProgrammingLanguage[] = [];
  @Input() initialCode: string = '';
  @Input() initialLanguage!: string;
  @Output() codeChange = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<ProgrammingLanguage>();
  @Output() runCodeEvent = new EventEmitter<{code: string, language: ProgrammingLanguage}>();
  @Output() submitCodeEvent = new EventEmitter<{code: string, language: ProgrammingLanguage}>();

  selectedLanguage: ProgrammingLanguage | null = null;
  code: string = '';
  
  editorOptions = {
    theme: 'material',
    mode: 'javascript',
    lineNumbers: true,
    lineWrapping: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    tabSize: 2,
  };

  ngOnInit() {
    if (this.languages.length > 0) {
      this.selectedLanguage = this.languages[0];
      this.code = this.selectedLanguage.template_code;
      this.updateEditorMode();
    }
  }

  onLanguageChange() {
    if (this.selectedLanguage) {
      this.code = this.selectedLanguage.template_code;
      this.updateEditorMode();
      this.languageChange.emit(this.selectedLanguage);
    }
  }

  onCodeChange() {
    this.codeChange.emit(this.code);
  }

  updateEditorMode() {
    if (this.selectedLanguage) {
      switch (this.selectedLanguage.name.toLowerCase()) {
        case 'python 3':
          this.editorOptions.mode = 'python';
          break;
        case 'java':
          this.editorOptions.mode = 'text/x-java';
          break;
        case 'c++':
          this.editorOptions.mode = 'text/x-c++src';
          break;
        case 'javascript':
          this.editorOptions.mode = 'javascript';
          break;
        default:
          this.editorOptions.mode = 'text/plain';
      }
    }
  }

  runCode() {
    if (this.selectedLanguage && this.code.trim()) {
      this.runCodeEvent.emit({
        code: this.code,
        language: this.selectedLanguage
      });
    }
  }

  submitCode() {
    if (this.selectedLanguage && this.code.trim()) {
      this.submitCodeEvent.emit({
        code: this.code,
        language: this.selectedLanguage
      });
    }
  }
}