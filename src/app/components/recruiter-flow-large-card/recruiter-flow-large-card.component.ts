import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-flow-large-card',
  templateUrl: 'recruiter-flow-large-card.component.html',
  styleUrls: ['recruiter-flow-large-card.component.css'],
})
export class RecruiterFlowLargeCard {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  imageSrc6: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=mzV95~Di8P6dzRNgufJKyH68f3UqvlGYcYMjXkzOgwT0pBb5Qw6In072uR9jkN6BFmw4HrkP70x9BHfkVwkZbMVRvPL0e2pHMRXGFTFsMq6sQWythHaBlVtJ5blJ9DP6B-HyJP92sgZ3sxxqAVrISABTQtBM-uOBpA~2S0PUg8vNy-3QqVNsez9U24Zf5NwIh98cE0RiTjQN2DIpluEvto4KkxU6DIq4y2nHpSUDc8SgIWt2bigDd5XALKxvLTTDzOEpwcAEx6Ul8Ld1CxHUnx90pKn2Yi~TytFDg7jvqtHA9OcTU1M3SA1ImRyh42bGA5MJ4HwCvUteyteOVv181w__'
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  imageAlt6: string = 'Candidate Profile Picture'
  @ContentChild('text21')
  text21: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @Input()
  imageSrc5: string =
    'https://s3-alpha-sig.figma.com/img/8254/7737/b3eefffb9d9234e6fe8609789fdf7c00?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=jNmjxko0T1JxAaxAQ4~VMsPHjMdFsJAVP8h0taNQhb2~mkXOp--KmftiZtXcqkM5VQ0nm8oHRDmx97aeqi3V8mkGcEPpBI2npi4mGaMxm6pkG~adNCWWQ1SNWJ9xWUQjjX94BcDwcl-LxTEe9vKRK3SabpcqhF9nYqdK7j-QRoJBffY6uoEr1WQJyAEzmDB~GkRdHeQf7pLUGDJZQ0oq1tqw1Lds~lssM7~4Sx3uUJtNRs3W7PeczCfu7eya~Gy0751GrR7UmgIUqPG6DZz3bEPj5Wd9azxcqHVFAEfHtuDT1Gl2X1UjShDZKvIFyqUvRBYcr8tpxdi69cPMRhRLg__'
  @Input()
  imageAlt5: string = 'Candidate Profile Picture'
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=AWePlF-pHGfkDpvAxQkVOEKn6ei0wCQlVYu2oyaio65v32g8ylOmVbTs0muKAqz~iUBe-CPQTwUxEliMP5iFCiNMWlvaUDmnDaQ-9hL50Y2Rj~XfChKWsk1VhZQeHfMHDKP3KjN5DqeJBjU3k3Y3mOBUO9Fti0wsO9NNgpx1w4Kzu2hgpAP4Tf-EvspJzKotE8oB5AZzw1Qq6A~Vf6j1~AUW5vncBp6~E1xz7xUg0j59ZNm-wCSegvZWTPmBQ0fffJ95NegzQoPhltiUTwYrUPuIYjMEMcWOY3Poet~fqbTxf8bLNC1SRF3brHyO894K9GtoUm~V7HPmDgnR9J4qTg__'
  @Input()
  imageAlt: string = 'Company Logo'
  constructor() {}
}