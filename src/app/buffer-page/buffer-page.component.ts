import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { BufferService } from '../services/buffer.service';
import { Observable } from 'rxjs';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'buffer-page',
  standalone: true,
  imports: [
    CommonModule // This makes the 'async' pipe and '@if' available
  ],
  templateUrl: 'buffer-page.component.html',
  styleUrls: ['buffer-page.component.css'],
})
export class BufferPage {
  showBuffer$: Observable<boolean>;
//  showBuffer = false;
  subscription: Subscription;

  constructor(
    private title: Title, 
    private meta: Meta, 
    private bufferService: BufferService,

  ) {
    this.showBuffer$ = this.bufferService.showBuffer;
    this.title.setTitle('Buffer-Page - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Buffer-Page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }



  //using buffer service where buffer page is considered as a page
 // ngOnInit(): void {
   // this.subscription = this.bufferService.showBuffer.subscribe((show) => {
   //   this.showBuffer = show;
  //  });
  //}

    // using buffer-overlay as a service where buffer page is considered as a overlay component
  //ngOnInit(): void {
    //this.subscription = this.bufferOverlayService.showBuffer.subscribe((show) => {
      //this.showBuffer = show;
    //});
  //}

  //ngOnDestroy(): void {
   // this.subscription.unsubscribe();
  //}

}
