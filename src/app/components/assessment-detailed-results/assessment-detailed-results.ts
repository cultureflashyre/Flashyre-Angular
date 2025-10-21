import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router } from '@angular/router';

@Component({
  selector: 'assessment-detailed-results',
  templateUrl: 'assessment-detailed-results.html',
  styleUrls: ['assessment-detailed-results.css'],
})
export class AssessmentDetailedResults implements OnChanges  {
    @Input() assessmentData: any;  // This will receive the selected attempt object
    @ViewChild('capsuleContainer') capsuleContainer!: ElementRef;
    @Output() back = new EventEmitter<void>();

    questions: any[] = [];
    groupedQuestions: { [key: string]: any[] } = {};  // Grouped by section
    sectionOrder: string[] = [];  // Ordered list of section names
    totalQuestions: number = 0;  // Total for numbering
    selectedSection: string | null = null;  // New: Track currently selected section
    rawhg86: string = ' '
    rawdt3n: string = ' '
    rawrm7v: string = ' '
    rawvn2j: string = ' '
    rawvdwg: string = ' '
    constructor(private title: Title, private meta: Meta, private router: Router) {
      this.title.setTitle('Assessment-Detailed-Results - Flashyre')
      this.meta.addTags([
        {
          property: 'og:title',
          content: 'Assessment-Detailed-Results - Flashyre',
        },
        {
          property: 'og:image',
          content:
            'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
        },
      ])
    }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assessmentData'] && this.assessmentData) {
      this.questions = this.assessmentData.detailed_questions || [];
      this.totalQuestions = this.questions.length;

      // Assign global question numbers
      let index = 1;
      this.questions.forEach(q => {
        q.questionNumber = index++;
      });

      // Group questions by section, preserving order
      this.sectionOrder = [];
      this.groupedQuestions = this.questions.reduce((acc: { [key: string]: any[] }, q: any) => {
        const sectionName = q.section || 'Unnamed Section';  // Fallback if section is missing
        if (!acc[sectionName]) {
          acc[sectionName] = [];
          this.sectionOrder.push(sectionName);
        }
        acc[sectionName].push(q);
        return acc;
      }, {});

      // Set default selected section to the first one
      this.selectedSection = this.sectionOrder[0] || null;

      this.questions.forEach((q, idx) => {
        console.log(`Q${idx+1} correct:`, q.q_correct_answer, 'explanation:', q.q_answer_explained);
      });
    }
  }

  // New: Method to handle section selection
  selectSection(section: string) {
    this.selectedSection = section;
  }

  onBackClick() {
  this.back.emit();
}

onReattempt() {
    // Navigate to assessment rules page with the assessment ID
    this.router.navigate(['/flashyre-assessment-rules-card'], { 
      queryParams: { id: this.assessmentData.assessment_id } 
    });
  }


// Helper methods for options and correct answer
  //getOptions(question: any) {
  //  const options = [];
  //  if (question.q_option1) options.push({ value: question.q_option1, label: 'A' });
  //  if (question.q_option2) options.push({ value: question.q_option2, label: 'B' });
  //  if (question.q_option3) options.push({ value: question.q_option3, label: 'C' });
  //  if (question.q_option4) options.push({ value: question.q_option4, label: 'D' });
  //  return options;
  //}

  getOptions(question: any) {
  // Returns [{key: 'option1', value: 'x = 5', image: ...}, ...]
  const options = [];
  for (let i = 1; i <= 4; i++) {
    const key = `option${i}`;
    const value = question[`q_option${i}`];
    if (value) {
      options.push({
        key,
        value,
        image: question[`q_option${i}_image`]
      });
    }
  }
  return options;
}

  getCorrectOptionLetter(question: any): string {
    switch (question.q_correct_answer) {
      case 'option1': return 'A';
      case 'option2': return 'B';
      case 'option3': return 'C';
      case 'option4': return 'D';
      default: return '';
    }
  }

  logRadioStatus(question: any, opt: any, i: number): boolean {
    const isChecked = question.user_selected_option === opt.key;
    console.log(
      `Question #${i + 1}, Option: ${opt.key}, User Selected: ${question.user_selected_option}, Checked: ${isChecked}`
    );
    return isChecked;
  }

  getOptionStatus(question: any, opt: any): string {
    if (question.user_selected_option === opt.key && question.q_correct_answer === opt.key) {
      console.log('Correct:', opt.key);
      return 'correct';
    }
    if (question.user_selected_option === opt.key && question.q_correct_answer !== opt.key) {
      console.log('Incorrect:', opt.key);
      return 'incorrect';
    }
    return '';
  }

    getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }
  
  scrollLeft() {
        this.capsuleContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
    }

  scrollRight() {
        this.capsuleContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
    }
}