import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'recruiter-flow-small-card',
    templateUrl: 'recruiter-flow-small-card.component.html',
    styleUrls: ['recruiter-flow-small-card.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class RecruiterFlowSmallCard {
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  imageSrc5: string =
    'https://s3-alpha-sig.figma.com/img/8254/7737/b3eefffb9d9234e6fe8609789fdf7c00?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=jNmjxko0T1JxAaxAQ4~VMsPHjMdFsJAVP8h0taNQhb2~mkXOp--KmftiZtXcqkM5VQ0nm8oHRDmx97aeqi3V8mkGcEPpBI2npi4mGaMxm6pkG~adNCWWQ1SNWJ9xWUQjjX94BcDwcl-LxTEe9vKRK3SabpcqhF9nYqdKk7j-QRoJBffY6uoEr1WQJyAEzmDB~GkRdHeQf7pLUGDJZQ0oq1tqw1Lds~lssM7~4Sx3uUJtNRs3W7PeczCfu7eya~Gy0751GrR7UmgIUqPG6DZz3bEPj5Wd9azxcqHVFAEfHtuDT1Gl2X1UjShDZKvIFyqUvRBYcr8tpxdi69cPMRhRLg__'
  @Input()
  rootClassName: string = ''
  @Input()
  imageSrc6: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=mzV95~Di8P6dzRNgufJKyH68f3UqvlGYcYMjXkzOgwT0pBb5Qw6In072uR9jkN6BFmw4HrkP70x9BHfkVwkZbMVRvPL0e2pHMRXGFTFsMq6sQWythHaBlVtJ5blJ9DP6B-HyJP92sgZ3sxxqAVrISABTQtBM-uOBpA~2S0PUg8vNy-3QqVNsez9U24Zf5NwIh98cE0RiTjQN2DIpluEvto4KkxU6DIq4y2nHpSUDc8SgIWt2bigDd5XALKxvLTTDzOEpwcAEx6Ul8Ld1CxHUnx90pKn2Yi~TytFDg7jvqtHA9OcTU1M3SA1ImRyh42bGA5MJ4HwCvUteyteOVv181w__'
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageAlt5: string = 'image'
  @Input()
  imageAlt6: string = 'image'
  @ContentChild('text2')
  text2: TemplateRef<any>
  constructor() {}
}
