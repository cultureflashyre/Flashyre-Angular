import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: 'candidate-job-for-you-card.component.html',
  styleUrls: ['candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements OnInit {
  @Input() score: number = 75; // Default to 75; adjust if backend provides a score

  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('button1') button1: TemplateRef<any>;

  @Input() rootClassName: string = '';
  @Input() imageSrc: string = 'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4GObeMz7kg6Kmk7a9iOIYXqqp-qRBeuRSILqUH9s6N-q5DphgEKuOnEvvcwSUbZEvVBqcrwkg6txq3COMJFK7Sm2Gvb8~Q1EmKXJBhingSOoVxYxsnvL9v6V-y9pb6Lz9e82VXGr46k8A~USzriFdWvRPCJyrJODdI42GV-p1WeEQ8fmemtUfuNNEP5fFOc~94zGAaHwf3rqDl~WWm5r5QbxvCnvNpT5QjNAOCOAdBIE-V0~0Lepa2iIQ-h9fT9sARy6sZlJpJWG7cxgqSaAQjS9liz8s1JrjXOgw__';
  @Input() imageAlt: string = 'image';

  constructor() {}

  ngOnInit(): void {
    this.animateProgressBar();
  }

  private getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  private animateProgressBar(): void {
    const duration = 3000;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentPercentage = progress * this.score;

      this.updateProgressBar(currentPercentage);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private updateProgressBar(percentage: number): void {
    const barElement = document.querySelector('.bar') as HTMLElement;
    if (barElement) {
      barElement.style.width = `${percentage}%`;
      barElement.style.backgroundColor = this.getFillColor(percentage);
    }
  }
}