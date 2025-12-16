import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'recruiter-view-candidate-profile',
    templateUrl: 'recruiter-view-candidate-profile.component.html',
    styleUrls: ['recruiter-view-candidate-profile.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class RecruiterViewCandidateProfile {
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1738540800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=CfIJ6moQiOBB~nz1awM9PvkoabzOIsDLbnY7Sme7ahET4M~TXRRPKRRF9hJd7hkqp0Xyv5gbWmjjcm1xb1fboBRclCvBhPFKVbF4fgZOFbDzaRBb10tCuZBqQrpP4Uck4bXpH9ZYkqEIjJYnmVGOEB1Pu6Ilbp-c7~HZgNsAMRRH74kbqJzj1rxCj-CLe3zCKgeb6uByvClNgTzqUpY91895Xrtl3pl-4L81JSzB5A9aZI3d1GkIFFvdb5W9O2rKOtt0seRAbcEzz7jQLFgn6DlmovpYdFvjs77sYu9SxOtmFK6oZx6gN6UOo6hgxumw5WpETSWBHlHt9c7m1U~Vmw__'
  @Input()
  rootClassName: string = ''
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text2')
  text2: TemplateRef<any>
  constructor() {}
}
