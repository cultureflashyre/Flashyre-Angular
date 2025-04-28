import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerFormatPipe } from '../pipe/timer-format.pipe';

@NgModule({
  declarations: [TimerFormatPipe],
  imports: [CommonModule],
  exports: [TimerFormatPipe]
})
export class SharedPipesModule {}