import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'relativeDate',
  standalone: true, // Mark pipe as standalone
})
export class RelativeDatePipe implements PipeTransform {

  transform(value: string | Date | undefined | null): string {
    if (!value) {
      return ''; // Return empty if the date is null or undefined
    }

    const datePipe = new DatePipe('en-US');
    const inputDate = new Date(value);
    
    // Get today's date, but reset the time part to 00:00:00 for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Reset the time part of the input date as well
    const inputDateWithoutTime = new Date(inputDate);
    inputDateWithoutTime.setHours(0, 0, 0, 0);

    // Compare timestamps
    if (inputDateWithoutTime.getTime() === today.getTime()) {
      return 'Today';
    }
    
    if (inputDateWithoutTime.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    // For all other dates, format as 'Month Day, Year'
    return datePipe.transform(inputDate, 'MMM d, y') || '';
  }
}