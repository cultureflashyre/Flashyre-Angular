import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerFormatPipe } from '../pipe/timer-format.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

@NgModule({
  declarations: [TimerFormatPipe, SafeHtmlPipe],
  imports: [CommonModule],
  exports: [TimerFormatPipe, SafeHtmlPipe]
})
export class SharedPipesModule {}