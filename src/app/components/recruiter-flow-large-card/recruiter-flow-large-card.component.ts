import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-flow-large-card',
  templateUrl: 'recruiter-flow-large-card.component.html',
  styleUrls: ['recruiter-flow-large-card.component.css'],
})
export class RecruiterFlowLargeCard {
  @ContentChild('text2')  text2: TemplateRef<any>;
  @Input()  imageSrc6: string = 'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=mzV95~Di8P6dzRNgufJKyH68f3UqvlGYcYMjXkzOgwT0pBb5Qw6In072uR9jkN6BFmw4HrkP70x9BHfkVwkZbMVRvPL0e2pHMRXGFTFsMq6sQWythHaBlVtJ5blJ9DP6B-HyJP92sgZ3sxxqAVrISABTQtBM-uOBpA~2S0PUg8vNy-3QqVNsez9U24Zf5NwIh98cE0RiTjQN2DIpluEvto4KkxU6DIq4y2nHpSUDc8SgIWt2bigDd5XALKxvLTTDzOEpwcAEx6Ul8Ld1CxHUnx90pKn2Yi~TytFDg7jvqtHA9OcTU1M3SA1ImRyh42bGA5MJ4HwCvUteyteOVv181w__';
  @ContentChild('text1')  text1: TemplateRef<any>;
  @ContentChild('text')  text: TemplateRef<any>;
  @Input()  imageAlt6: string = 'Candidate Profile Picture';
  @ContentChild('text21')  text21: TemplateRef<any>;
  
  @Input()  rootClassName: string = '';
  @Input()  imageSrc5: string ='';
  @Input()  imageAlt5: string = 'Candidate Profile Picture';
  @Input()  imageSrc: string ='';
  @Input()  imageAlt: string = 'Company Logo';
  @Input()  companyInitials: string;

  constructor() {}

    // --- Helper and UI Methods ---
  isImage(src: string): boolean {
    return src && (src.startsWith('http') || src.startsWith('https') || src?.startsWith('data:image'));
  }
}