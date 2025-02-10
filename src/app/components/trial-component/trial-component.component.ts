import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'trial-component',
  templateUrl: 'trial-component.component.html',
  styleUrls: ['trial-component.component.css'],
})
export class TrialComponent {
  @ContentChild('content1')
  content1: TemplateRef<any>
  @ContentChild('plan1Action')
  plan1Action: TemplateRef<any>
  @ContentChild('plan2Feature31')
  plan2Feature31: TemplateRef<any>
  @ContentChild('plan1Feature2')
  plan1Feature2: TemplateRef<any>
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @ContentChild('plan11')
  plan11: TemplateRef<any>
  @ContentChild('plan2Price')
  plan2Price: TemplateRef<any>
  @ContentChild('plan2Monthly2')
  plan2Monthly2: TemplateRef<any>
  @ContentChild('plan2Yearly')
  plan2Yearly: TemplateRef<any>
  @ContentChild('plan2Feature3')
  plan2Feature3: TemplateRef<any>
  @ContentChild('plan1Yearly1')
  plan1Yearly1: TemplateRef<any>
  @ContentChild('plan1Price1')
  plan1Price1: TemplateRef<any>
  @ContentChild('plan1Yearly')
  plan1Yearly: TemplateRef<any>
  @ContentChild('plan2Action1')
  plan2Action1: TemplateRef<any>
  @ContentChild('plan2Price1')
  plan2Price1: TemplateRef<any>
  @ContentChild('plan21')
  plan21: TemplateRef<any>
  @ContentChild('content2')
  content2: TemplateRef<any>
  @ContentChild('plan2Feature2')
  plan2Feature2: TemplateRef<any>
  @ContentChild('plan1Feature3')
  plan1Feature3: TemplateRef<any>
  @ContentChild('plan2Feature1')
  plan2Feature1: TemplateRef<any>
  @ContentChild('plan2Feature11')
  plan2Feature11: TemplateRef<any>
  @ContentChild('plan1Action1')
  plan1Action1: TemplateRef<any>
  @ContentChild('plan1Feature21')
  plan1Feature21: TemplateRef<any>
  @ContentChild('plan1Feature31')
  plan1Feature31: TemplateRef<any>
  @ContentChild('plan2Action')
  plan2Action: TemplateRef<any>
  @ContentChild('plan2Feature21')
  plan2Feature21: TemplateRef<any>
  @ContentChild('plan1Feature11')
  plan1Feature11: TemplateRef<any>
  @ContentChild('plan2')
  plan2: TemplateRef<any>
  @ContentChild('plan1Price')
  plan1Price: TemplateRef<any>
  @ContentChild('plan1')
  plan1: TemplateRef<any>
  @ContentChild('plan1Feature1')
  plan1Feature1: TemplateRef<any>
  rawnf9e: string = ' '
  rawyc4m: string = ' '
  rawt0ih: string = ' '
  rawzqmf: string = ' '
  constructor() {}
}
