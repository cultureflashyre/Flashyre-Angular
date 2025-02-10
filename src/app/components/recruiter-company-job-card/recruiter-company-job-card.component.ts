import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-company-job-card',
  templateUrl: 'recruiter-company-job-card.component.html',
  styleUrls: ['recruiter-company-job-card.component.css'],
})
export class RecruiterCompanyJobCard {
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1738540800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=lcaNZRRUfIMW4ZW-75UkbD38qaP0~6PVuZqQyJzEpNWa3hWUB-7XqRiAt7JoWcZDSlUSgBZjHRriUbJgo2Oe-QqZaCRoOwyeK0Pc~77KrvKg00XIbvfsy0xeR7Ot2cJYGA~R1veKdQEX2NM8p79G0eFROg7w~C3wsgiwkRY7GmBO8wO5Rv55elFL06kXSLhYGenOQJ1xA6FEZBLSWIZsjo7c3yjV9-LaUs3Iw-sYfMFYNvb5YT~UnjlUZIcFaXMODn8rfCqflEf-KV~J-6gobtSe6aCaOogmWjxla5S1mhq~RrEuUYnQ15UUKEV~LXSljLVM~yeqZ7vnjME3cTJDKw__'
  @Input()
  imageAlt: string = 'image'
  constructor() {}
}
