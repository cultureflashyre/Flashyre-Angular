import { Component, Input, AfterViewInit, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: 'candidate-job-for-you-card.component.html',
  styleUrls: ['candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements AfterViewInit {

  @Input()
  perc: number = 0;

  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4GObeMz7kg6Kmk7a9iOIYXqqp-qRBeuRSILqUH9s6N-q5DphgEKuOnEvvcwSUbZEvVBqcrwkg6txq3COMJFK7Sm2Gvb8~Q1EmKXJBhingSOoVxYxsnvL9v6V-y9pb6Lz9e82VXGr46k8A~USzriFdWvRPCJyrJODdI42GV-p1WeEQ8fmemtUfuNNEP5fFOc~94zGAaHwf3rqDl~WWm5r5QbxvCnvNpT5QjNAOCOAdBIE-V0~0Lepa2iIQ-h9fT9sARy6sZlJpJWG7cxgqSaAQjS9liz8s1JrjXOgw__'
  @ContentChild('button1')
  button1: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text3')
  text3: TemplateRef<any>

  constructor() {}

  ngAfterViewInit(): void {
    this.animateProgressBar();
  }

  // Determine the fill color based on the percentage
  private getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6'; // Ampere color
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  // Animate the progress bar
  private animateProgressBar(): void {
    const progress: HTMLElement | null = document.querySelector('.progress');
    const bar: HTMLElement | null = progress ? progress.querySelector('.bar') : null;
    const score: HTMLElement | null = document.querySelector('.score');

    if (bar && score) {
      let start: number = 0;
      const duration: number = 3000; // Animation duration in milliseconds
      const startTime: number = performance.now();

      const animate = (currentTime: number) => {
        const elapsedTime: number = currentTime - startTime;
        const progressPercentage: number = Math.min(elapsedTime / duration, 1);
        const currentPerc: number = progressPercentage * this.perc;

        // Update the width and color of the bar
        bar.style.width = ${currentPerc}%;
        bar.style.backgroundColor = this.getFillColor(currentPerc);

        // Update the displayed score
        score.textContent = ${Math.round(currentPerc)}%;

        if (progressPercentage < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }
}
