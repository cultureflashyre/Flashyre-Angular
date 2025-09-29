import { Component, EventEmitter, Input, Output, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit {
  @Input() problemId: number = 0;
  @Output() runCode = new EventEmitter<{ source_code: string, language_id: number }>();
  @Output() submitCode = new EventEmitter<{ source_code: string, language_id: number }>();
  @Output() codeChange = new EventEmitter<void>(); // New output event
  @ViewChild('editor') private editorRef!: ElementRef<HTMLDivElement>;

  languages = [
    { name: 'C++', id: 54, mode: 'ace/mode/c_cpp' },
    { name: 'Java', id: 62, mode: 'ace/mode/java' },
    { name: 'Python', id: 71, mode: 'ace/mode/python' },
    { name: 'JavaScript', id: 63, mode: 'ace/mode/javascript' }
  ];
  selectedLanguage = this.languages[0];
  code = '// Write your code here';
  private editor?: ace.Ace.Editor;

  constructor() {}

ngAfterViewInit() {
    // Initialize Ace editor (example)
    this.editor = ace.edit('editor'); // Adjust based on your setup
    this.editor.on('change', () => {
      this.codeChange.emit(); // Emit event on every change
    });
  }

  setupAceEditor() {
    if (this.editorRef && this.editorRef.nativeElement) {
      this.editor = ace.edit(this.editorRef.nativeElement);
      this.editor.setTheme('ace/theme/monokai');
      this.editor.session.setMode(this.selectedLanguage.mode);
      this.editor.setValue(this.code);
      this.editor.setOptions({
        showLineNumbers: true,
        tabSize: 2,
        fontSize: 14,
        showPrintMargin: false
      });
      this.editor.on('change', () => {
        this.code = this.editor!.getValue();
      });
    }
  }

  onLanguageChange() {
    if (this.editor) {
      this.editor.session.setMode(this.selectedLanguage.mode);
    }
  }

  run() {
    this.runCode.emit({ source_code: this.code, language_id: this.selectedLanguage.id });
  }

  submit() {
    this.submitCode.emit({ source_code: this.code, language_id: this.selectedLanguage.id });
  }
}