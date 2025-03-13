// navigation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private pages = ['basic', 'employment', 'certifications'];
  private currentPageIndex = 0;
  public currentPage$ = new BehaviorSubject<string>(this.pages[0]);

  private data: { [key: string]: any } = {};

  constructor() { }

  getCurrentPage(): string {
    return this.pages[this.currentPageIndex];
  }

  navigateTo(page: string) {
    const index = this.pages.indexOf(page);
    if (index !== -1) {
      this.currentPageIndex = index;
      this.currentPage$.next(page);
    }
  }

  nextPage() {
    if (this.currentPageIndex < this.pages.length - 1) {
      this.currentPageIndex++;
      this.currentPage$.next(this.pages[this.currentPageIndex]);
    }
  }

  previousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.currentPage$.next(this.pages[this.currentPageIndex]);
    }
  }

  setData(page: string, data: any) {
    this.data[page] = data;
  }

  getData(page: string): any {
    return this.data[page];
  }

  saveData(page: string, data: any): void {
    console.log(`Saving data for ${page}`, data);
    // In a real application, you would save this data to a database or API.
  }
}
