// Create a new file: services/assessment-state.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type QuestionState = 'unvisited' | 'visited' | 'answered' | 'skipped';

interface QuestionStateMap {
  [questionId: number]: QuestionState;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentStateService {
  private questionStatesSubject = new BehaviorSubject<QuestionStateMap>({});
  questionStates$: Observable<QuestionStateMap> = this.questionStatesSubject.asObservable();
  
  private activeQuestionId: number | null = null;

  constructor() {}

  /**
   * Initialize question states for an assessment
   * @param questionIds Array of question IDs in the assessment
   */
  initializeStates(questionIds: number[]): void {
    const initialStates: QuestionStateMap = {};
    questionIds.forEach(id => {
      initialStates[id] = 'unvisited';
    });
    this.questionStatesSubject.next(initialStates);
  }

  /**
   * Mark a question as visited
   * @param questionId ID of the question
   */
  markAsVisited(questionId: number): void {
    const currentStates = this.questionStatesSubject.value;
    if (currentStates[questionId] === 'unvisited') {
      this.questionStatesSubject.next({
        ...currentStates,
        [questionId]: 'visited'
      });
    }
    this.activeQuestionId = questionId;
  }

  /**
   * Mark a question as answered
   * @param questionId ID of the question
   */
  markAsAnswered(questionId: number): void {
    const currentStates = this.questionStatesSubject.value;
    this.questionStatesSubject.next({
      ...currentStates,
      [questionId]: 'answered'
    });
  }

  /**
   * Mark a question as skipped
   * @param questionId ID of the question
   */
  markAsSkipped(questionId: number): void {
    const currentStates = this.questionStatesSubject.value;
    this.questionStatesSubject.next({
      ...currentStates,
      [questionId]: 'skipped'
    });
  }

  /**
   * Get the current state of a question
   * @param questionId ID of the question
   * @returns Current state of the question
   */
  getQuestionState(questionId: number): QuestionState {
    return this.questionStatesSubject.value[questionId] || 'unvisited';
  }

  /**
   * Check if a question is the active question
   * @param questionId ID of the question
   * @returns Whether the question is active
   */
  isActiveQuestion(questionId: number): boolean {
    return this.activeQuestionId === questionId;
  }

  /**
   * Reset all question states
   */
  resetStates(): void {
    this.questionStatesSubject.next({});
    this.activeQuestionId = null;
  }
}