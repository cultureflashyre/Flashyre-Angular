import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'create-job-post1st-page',
  templateUrl: 'create-job-post-1st-page.component.html',
  styleUrls: ['create-job-post-1st-page.component.css'],
})
export class CreateJobPost1stPage implements AfterViewInit {
  @ViewChild('totalRangeIndicator') totalRangeIndicator!: ElementRef;
  @ViewChild('totalMarkerLeft') totalMarkerLeft!: ElementRef;
  @ViewChild('totalMarkerRight') totalMarkerRight!: ElementRef;
  @ViewChild('totalLabelLeft') totalLabelLeft!: ElementRef;
  @ViewChild('totalLabelRight') totalLabelRight!: ElementRef;
  @ViewChild('totalFilledSegment') totalFilledSegment!: ElementRef;

  @ViewChild('relevantRangeIndicator') relevantRangeIndicator!: ElementRef;
  @ViewChild('relevantMarkerLeft') relevantMarkerLeft!: ElementRef;
  @ViewChild('relevantMarkerRight') relevantMarkerRight!: ElementRef;
  @ViewChild('relevantLabelLeft') relevantLabelLeft!: ElementRef;
  @ViewChild('relevantLabelRight') relevantLabelRight!: ElementRef;
  @ViewChild('relevantFilledSegment') relevantFilledSegment!: ElementRef;

  private isDragging = false;
  private currentMarker: HTMLElement | null = null;

  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Create-Job-Post-1st-page - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Create-Job-Post-1st-page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngAfterViewInit() {
    this.initializeRangeSlider(
      this.totalRangeIndicator,
      this.totalMarkerLeft,
      this.totalMarkerRight,
      this.totalLabelLeft,
      this.totalLabelRight,
      this.totalFilledSegment
    );
    this.initializeRangeSlider(
      this.relevantRangeIndicator,
      this.relevantMarkerLeft,
      this.relevantMarkerRight,
      this.relevantLabelLeft,
      this.relevantLabelRight,
      this.relevantFilledSegment
    );
  }

  initializeRangeSlider(
    rangeIndicator: ElementRef,
    markerLeft: ElementRef,
    markerRight: ElementRef,
    labelLeft: ElementRef,
    labelRight: ElementRef,
    filledSegment: ElementRef
  ) {
    const updateFilledSegment = () => {
      const leftPos = parseInt(markerLeft.nativeElement.style.left || '55');
      const rightPos = parseInt(markerRight.nativeElement.style.left || '175');
      filledSegment.nativeElement.style.left = `${leftPos + 5}px`;
      filledSegment.nativeElement.style.width = `${rightPos - leftPos}px`;
    };

    const updateLabelPosition = (marker: HTMLElement, label: HTMLElement) => {
      const markerPos = parseInt(marker.style.left || '0');
      label.style.left = `${markerPos + 5}px`;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      const rect = rangeIndicator.nativeElement.getBoundingClientRect();
      let newLeft = e.clientX - rect.left - 5;

      const minLeft = 0;
      const maxLeft = rect.width - 10;

      if (this.currentMarker === markerLeft.nativeElement) {
        newLeft = Math.max(minLeft, Math.min(newLeft, parseInt(markerRight.nativeElement.style.left || '175') - 10));
      } else if (this.currentMarker === markerRight.nativeElement) {
        newLeft = Math.min(maxLeft, Math.max(newLeft, parseInt(markerLeft.nativeElement.style.left || '55') + 10));
      }

      this.currentMarker!.style.left = `${newLeft}px`;
      updateFilledSegment();
      updateLabelPosition(
        this.currentMarker!,
        this.currentMarker === markerLeft.nativeElement ? labelLeft.nativeElement : labelRight.nativeElement
      );
    };

    const onMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      this.currentMarker = e.target as HTMLElement;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    markerLeft.nativeElement.addEventListener('mousedown', onMouseDown);
    markerRight.nativeElement.addEventListener('mousedown', onMouseDown);

    updateFilledSegment();
  }

  formatText(type: string) {
    document.execCommand(type === 'list' ? 'insertUnorderedList' : type, false, type === 'highlight' ? '#fff3cd' : null);
    document.getElementById('editor')?.focus();
  }

  checkEmpty(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const isEmpty = element.textContent?.trim() === '';
      element.setAttribute('data-empty', isEmpty ? 'true' : 'false');
    }
  }
}