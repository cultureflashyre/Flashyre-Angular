import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: 'candidate-job-for-you-card.component.html',
  styleUrls: ['candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements OnInit {

  score: number = 0; // Initialize with 0 or fetch dynamically
  
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

  ngOnInit(): void {
    // Fetch the dynamic value (e.g., from an API or service)
    this.fetchDynamicValue().then((value) => {
      this.score = value; // Set the dynamic value
      this.animateProgressBar(); // Start the animation
    });
  }
 
  // Function to determine the fill color based on the percentage
  private getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6'; // Ampere color
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  // Function to animate the progress bar
  private animateProgressBar(): void {
    const duration = 3000; // Animation duration in milliseconds
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1); // Progress between 0 and 1

      // Calculate the current percentage
      const currentPercentage = progress * this.score;

      // Update the progress bar
      this.updateProgressBar(currentPercentage);

      // Continue animation until duration is complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start the animation
    animate();
  }

  // Function to update the progress bar width and color
  private updateProgressBar(percentage: number): void {
    const barElement = document.querySelector('.bar') as HTMLElement;
    if (barElement) {
      barElement.style.width = `${percentage}%`;
      barElement.style.backgroundColor = this.getFillColor(percentage);
    }
  }

  // Simulate fetching a dynamic value (e.g., from an API or service)
  private async fetchDynamicValue(): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(75); // Example dynamic value (e.g., 75%)
      }, 1000);
    });
  }


}