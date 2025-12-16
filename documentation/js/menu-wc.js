'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">flashyre documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-3e55fc0c7154eb30cb2866f5667757ea004ca90b33b6fe6f96d9e604dac96e749582c4911d351cde4bb4aa8f3f9557022a3921818f3ea2d49d144118783549df"' : 'data-bs-target="#xs-components-links-module-AppModule-3e55fc0c7154eb30cb2866f5667757ea004ca90b33b6fe6f96d9e604dac96e749582c4911d351cde4bb4aa8f3f9557022a3921818f3ea2d49d144118783549df"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-3e55fc0c7154eb30cb2866f5667757ea004ca90b33b6fe6f96d9e604dac96e749582c4911d351cde4bb4aa8f3f9557022a3921818f3ea2d49d144118783549df"' :
                                            'id="xs-components-links-module-AppModule-3e55fc0c7154eb30cb2866f5667757ea004ca90b33b6fe6f96d9e604dac96e749582c4911d351cde4bb4aa8f3f9557022a3921818f3ea2d49d144118783549df"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssessmentTakenPage2Module.html" data-type="entity-link" >AssessmentTakenPage2Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AssessmentTakenPage2Module-bad355330b64b3bb5df5840e5b28dedaa16f1085367cd88fdcc8c5f0076afa877171515161872d90c1bd8a5a5a094effe33a7eb052e7e1e30fc2a52c1a65ac76"' : 'data-bs-target="#xs-components-links-module-AssessmentTakenPage2Module-bad355330b64b3bb5df5840e5b28dedaa16f1085367cd88fdcc8c5f0076afa877171515161872d90c1bd8a5a5a094effe33a7eb052e7e1e30fc2a52c1a65ac76"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AssessmentTakenPage2Module-bad355330b64b3bb5df5840e5b28dedaa16f1085367cd88fdcc8c5f0076afa877171515161872d90c1bd8a5a5a094effe33a7eb052e7e1e30fc2a52c1a65ac76"' :
                                            'id="xs-components-links-module-AssessmentTakenPage2Module-bad355330b64b3bb5df5840e5b28dedaa16f1085367cd88fdcc8c5f0076afa877171515161872d90c1bd8a5a5a094effe33a7eb052e7e1e30fc2a52c1a65ac76"' }>
                                            <li class="link">
                                                <a href="components/AssessmentTakenPage2.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentTakenPage2</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssessmentTakenPage3Module.html" data-type="entity-link" >AssessmentTakenPage3Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AssessmentTakenPage3Module-9454ac911badc859e0724c22d16e16f1cc37fd8666e8f2bea348bfd2cfe853d171b8d524aa2e70f5545c4a242663957cb336172a5c703786afd448417261ab1d"' : 'data-bs-target="#xs-components-links-module-AssessmentTakenPage3Module-9454ac911badc859e0724c22d16e16f1cc37fd8666e8f2bea348bfd2cfe853d171b8d524aa2e70f5545c4a242663957cb336172a5c703786afd448417261ab1d"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AssessmentTakenPage3Module-9454ac911badc859e0724c22d16e16f1cc37fd8666e8f2bea348bfd2cfe853d171b8d524aa2e70f5545c4a242663957cb336172a5c703786afd448417261ab1d"' :
                                            'id="xs-components-links-module-AssessmentTakenPage3Module-9454ac911badc859e0724c22d16e16f1cc37fd8666e8f2bea348bfd2cfe853d171b8d524aa2e70f5545c4a242663957cb336172a5c703786afd448417261ab1d"' }>
                                            <li class="link">
                                                <a href="components/AssessmentTakenPage3.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentTakenPage3</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssessmentTakenPageModule.html" data-type="entity-link" >AssessmentTakenPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AssessmentTakenPageModule-ad16bbf86eed74b7d8c13582e377d8026f5a765390c1a163d146de3b22ee76d16127db96f3d03967a586e4ff25f2b6b7575bd724aa0b007b63f9d7e33c2b6e99"' : 'data-bs-target="#xs-components-links-module-AssessmentTakenPageModule-ad16bbf86eed74b7d8c13582e377d8026f5a765390c1a163d146de3b22ee76d16127db96f3d03967a586e4ff25f2b6b7575bd724aa0b007b63f9d7e33c2b6e99"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AssessmentTakenPageModule-ad16bbf86eed74b7d8c13582e377d8026f5a765390c1a163d146de3b22ee76d16127db96f3d03967a586e4ff25f2b6b7575bd724aa0b007b63f9d7e33c2b6e99"' :
                                            'id="xs-components-links-module-AssessmentTakenPageModule-ad16bbf86eed74b7d8c13582e377d8026f5a765390c1a163d146de3b22ee76d16127db96f3d03967a586e4ff25f2b6b7575bd724aa0b007b63f9d7e33c2b6e99"' }>
                                            <li class="link">
                                                <a href="components/AssessmentTakenPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentTakenPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssessmentViolationMessageModule.html" data-type="entity-link" >AssessmentViolationMessageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AssessmentViolationMessageModule-8107f00efa4156ccf936331a24ab929f5416e56f566287f58c98116050d8eee09c3856163ede781e23de98a16dd2704cb33dbf2556a530662b84829c4f54d586"' : 'data-bs-target="#xs-components-links-module-AssessmentViolationMessageModule-8107f00efa4156ccf936331a24ab929f5416e56f566287f58c98116050d8eee09c3856163ede781e23de98a16dd2704cb33dbf2556a530662b84829c4f54d586"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AssessmentViolationMessageModule-8107f00efa4156ccf936331a24ab929f5416e56f566287f58c98116050d8eee09c3856163ede781e23de98a16dd2704cb33dbf2556a530662b84829c4f54d586"' :
                                            'id="xs-components-links-module-AssessmentViolationMessageModule-8107f00efa4156ccf936331a24ab929f5416e56f566287f58c98116050d8eee09c3856163ede781e23de98a16dd2704cb33dbf2556a530662b84829c4f54d586"' }>
                                            <li class="link">
                                                <a href="components/AssessmentViolationMessage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentViolationMessage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/BufferPageModule.html" data-type="entity-link" >BufferPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-BufferPageModule-f8a37edd01321bbe35db378abc2f2f36ede7139e8ecc7130e7a84577a85aea35f5e8d6e7a6dff098d83f7306f52adb42dfc89089971edc46cdb000eeef7496f1"' : 'data-bs-target="#xs-components-links-module-BufferPageModule-f8a37edd01321bbe35db378abc2f2f36ede7139e8ecc7130e7a84577a85aea35f5e8d6e7a6dff098d83f7306f52adb42dfc89089971edc46cdb000eeef7496f1"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-BufferPageModule-f8a37edd01321bbe35db378abc2f2f36ede7139e8ecc7130e7a84577a85aea35f5e8d6e7a6dff098d83f7306f52adb42dfc89089971edc46cdb000eeef7496f1"' :
                                            'id="xs-components-links-module-BufferPageModule-f8a37edd01321bbe35db378abc2f2f36ede7139e8ecc7130e7a84577a85aea35f5e8d6e7a6dff098d83f7306f52adb42dfc89089971edc46cdb000eeef7496f1"' }>
                                            <li class="link">
                                                <a href="components/BufferPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BufferPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CandidateAssessmentModule.html" data-type="entity-link" >CandidateAssessmentModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CandidateAssessmentModule-74bd23d874db29f94a606f48da28fa62891a87a5b5b1cc16381fb19aa3b2e383d6db2e8f015dc388de2a8980832252dbb9aa8c7ec7a1ca51da1c21111ea3c094"' : 'data-bs-target="#xs-components-links-module-CandidateAssessmentModule-74bd23d874db29f94a606f48da28fa62891a87a5b5b1cc16381fb19aa3b2e383d6db2e8f015dc388de2a8980832252dbb9aa8c7ec7a1ca51da1c21111ea3c094"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CandidateAssessmentModule-74bd23d874db29f94a606f48da28fa62891a87a5b5b1cc16381fb19aa3b2e383d6db2e8f015dc388de2a8980832252dbb9aa8c7ec7a1ca51da1c21111ea3c094"' :
                                            'id="xs-components-links-module-CandidateAssessmentModule-74bd23d874db29f94a606f48da28fa62891a87a5b5b1cc16381fb19aa3b2e383d6db2e8f015dc388de2a8980832252dbb9aa8c7ec7a1ca51da1c21111ea3c094"' }>
                                            <li class="link">
                                                <a href="components/CandidateAssessment.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateAssessment</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CandidateDashboardModule.html" data-type="entity-link" >CandidateDashboardModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CandidateDashboardModule-6b328533431be8618b0e874395f7b5ef82501f7d04de1692e765d14fe26ea8fbe4ad21be1c15878efcb5faae8fa683e64cfb8e70fea4f0ba7aab932c15a87e6c"' : 'data-bs-target="#xs-components-links-module-CandidateDashboardModule-6b328533431be8618b0e874395f7b5ef82501f7d04de1692e765d14fe26ea8fbe4ad21be1c15878efcb5faae8fa683e64cfb8e70fea4f0ba7aab932c15a87e6c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CandidateDashboardModule-6b328533431be8618b0e874395f7b5ef82501f7d04de1692e765d14fe26ea8fbe4ad21be1c15878efcb5faae8fa683e64cfb8e70fea4f0ba7aab932c15a87e6c"' :
                                            'id="xs-components-links-module-CandidateDashboardModule-6b328533431be8618b0e874395f7b5ef82501f7d04de1692e765d14fe26ea8fbe4ad21be1c15878efcb5faae8fa683e64cfb8e70fea4f0ba7aab932c15a87e6c"' }>
                                            <li class="link">
                                                <a href="components/CandidateDashboard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateDashboard</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CandidateHomeModule.html" data-type="entity-link" >CandidateHomeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CandidateHomeModule-e2dc7cec919c2eecb2cd812795ff20d8be583ed41433a0526d41f26b800888623f281067db56f0aabb5c848d785ccc3fce7c0fa2cf6964277baa36bb53f1b3b7"' : 'data-bs-target="#xs-components-links-module-CandidateHomeModule-e2dc7cec919c2eecb2cd812795ff20d8be583ed41433a0526d41f26b800888623f281067db56f0aabb5c848d785ccc3fce7c0fa2cf6964277baa36bb53f1b3b7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CandidateHomeModule-e2dc7cec919c2eecb2cd812795ff20d8be583ed41433a0526d41f26b800888623f281067db56f0aabb5c848d785ccc3fce7c0fa2cf6964277baa36bb53f1b3b7"' :
                                            'id="xs-components-links-module-CandidateHomeModule-e2dc7cec919c2eecb2cd812795ff20d8be583ed41433a0526d41f26b800888623f281067db56f0aabb5c848d785ccc3fce7c0fa2cf6964277baa36bb53f1b3b7"' }>
                                            <li class="link">
                                                <a href="components/CandidateHome.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateHome</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CandidateJobDetailViewModule.html" data-type="entity-link" >CandidateJobDetailViewModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CandidateJobDetailViewModule-71bbd932e248831208982255dba37e8b92057cf307deafeea8d2b9378818fc728d6a9674fd369c97e2c61c6f9602e466e27560cbf02d7af1b5961420ea89a3d6"' : 'data-bs-target="#xs-components-links-module-CandidateJobDetailViewModule-71bbd932e248831208982255dba37e8b92057cf307deafeea8d2b9378818fc728d6a9674fd369c97e2c61c6f9602e466e27560cbf02d7af1b5961420ea89a3d6"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CandidateJobDetailViewModule-71bbd932e248831208982255dba37e8b92057cf307deafeea8d2b9378818fc728d6a9674fd369c97e2c61c6f9602e466e27560cbf02d7af1b5961420ea89a3d6"' :
                                            'id="xs-components-links-module-CandidateJobDetailViewModule-71bbd932e248831208982255dba37e8b92057cf307deafeea8d2b9378818fc728d6a9674fd369c97e2c61c6f9602e466e27560cbf02d7af1b5961420ea89a3d6"' }>
                                            <li class="link">
                                                <a href="components/CandidateJobDetailView.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateJobDetailView</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ComponentsModule.html" data-type="entity-link" >ComponentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ComponentsModule-dc0227a294d1ad8514a9b226b768a031af7b23c1f949696bdda9a73bee02c9ee1518766a92bf47c877f3e79e3ab2f8b53fa785c3e138e56d8b2e6e02c45c5175"' : 'data-bs-target="#xs-components-links-module-ComponentsModule-dc0227a294d1ad8514a9b226b768a031af7b23c1f949696bdda9a73bee02c9ee1518766a92bf47c877f3e79e3ab2f8b53fa785c3e138e56d8b2e6e02c45c5175"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ComponentsModule-dc0227a294d1ad8514a9b226b768a031af7b23c1f949696bdda9a73bee02c9ee1518766a92bf47c877f3e79e3ab2f8b53fa785c3e138e56d8b2e6e02c45c5175"' :
                                            'id="xs-components-links-module-ComponentsModule-dc0227a294d1ad8514a9b226b768a031af7b23c1f949696bdda9a73bee02c9ee1518766a92bf47c877f3e79e3ab2f8b53fa785c3e138e56d8b2e6e02c45c5175"' }>
                                            <li class="link">
                                                <a href="components/AboutTheJob.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AboutTheJob</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BufferName.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BufferName</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BufferName1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BufferName1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BufferScreen.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BufferScreen</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CTA26.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CTA26</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CandidateJobForYouCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateJobForYouCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CandidateJobsForYouSearchAndFilterBar.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateJobsForYouSearchAndFilterBar</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CandidateProfileScore.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateProfileScore</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CandidateProfileShort.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateProfileShort</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CandidateViewLastPageCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CandidateViewLastPageCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Component1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Component1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Component2.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Component2</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Contact10.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Contact10</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DateSelector1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DateSelector1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DateSelector2Duplicate.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DateSelector2Duplicate</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Details.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Details</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EmailAndMobileNumberComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailAndMobileNumberComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Features24.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Features24</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Features25.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Features25</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FirstNameAndLastNameComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FirstNameAndLastNameComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FlashyreAssessment.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreAssessment</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FlashyreAssessmentRules.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreAssessmentRules</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FlashyreDashboard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreDashboard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FlashyreNavbar.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreNavbar</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Footer8.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Footer8</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Gallery3.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Gallery3</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HeaderContainer.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HeaderContainer</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Hero17.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Hero17</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InputDateComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InputDateComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandinPageTestimonialCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandinPageTestimonialCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageArticalPreviewCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageArticalPreviewCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageArticleCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageArticleCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageFooter.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageFooter</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageJobSearchHero.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageJobSearchHero</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageNavbar.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageNavbar</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageReadableArticlesCardSmall.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageReadableArticlesCardSmall</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingPageVideoArticlesCardSmall.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingPageVideoArticlesCardSmall</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LogInPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LogInPage</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginPageNavbar.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginPageNavbar</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MoreFiltersComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MoreFiltersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Navbar1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Navbar1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Navbar4.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Navbar4</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Navbar5.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Navbar5</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Navbar6.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Navbar6</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/Navbar8.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Navbar8</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForCandidateView.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForCandidateView</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForCandidateView1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForCandidateView1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForCandidateView107672.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForCandidateView107672</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForCandidateView86072.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForCandidateView86072</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForCandidateView860721.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForCandidateView860721</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForRecruiterView.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForRecruiterView</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForRecruiterView1076721.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForRecruiterView1076721</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarForRecruiterViewOption.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarForRecruiterViewOption</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PasswordInputContainer.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PasswordInputContainer</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileBasicinformationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileBasicinformationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileCertificationsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileCertificationsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileCreationNavigation1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileCreationNavigation1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileCreationNavigation2.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileCreationNavigation2</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileEducationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileEducationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileEmploymentComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileEmploymentComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileHeaderComponent1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileHeaderComponent1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressBarStep1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressBarStep1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressBarStep2.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressBarStep2</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressBarStep3.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressBarStep3</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressBarStep4.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressBarStep4</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressBarStep5.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressBarStep5</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterCompanyJobCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterCompanyJobCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterFlowJobPostedCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterFlowJobPostedCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterFlowLargeCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterFlowLargeCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterFlowProfileCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterFlowProfileCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterFlowSmallCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterFlowSmallCard</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterJobPosted.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterJobPosted</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterNavbar.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterNavbar</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterProfile.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterProfile</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterProfile1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterProfile1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RecruiterViewCandidateProfile.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterViewCandidateProfile</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SignupCandidate1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupCandidate1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SignupCollege1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupCollege1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SignupCorporate1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupCorporate1</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SignupPageNavbar.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupPageNavbar</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VerifyEmailSMSPopup.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VerifyEmailSMSPopup</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewMoreCandidates.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewMoreCandidates</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WriteAJobPostForRecruiter.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WriteAJobPostForRecruiter</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CreateJobPost1stPageModule.html" data-type="entity-link" >CreateJobPost1stPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CreateJobPost1stPageModule-3fa509dc5b826376dc511d9d9b3eaf1fb59f177f3ff659554158063ceb980ddbaafe0545b86aab394abe0236ebd52a2c57aa165622accd941cd05008a9875b2b"' : 'data-bs-target="#xs-components-links-module-CreateJobPost1stPageModule-3fa509dc5b826376dc511d9d9b3eaf1fb59f177f3ff659554158063ceb980ddbaafe0545b86aab394abe0236ebd52a2c57aa165622accd941cd05008a9875b2b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CreateJobPost1stPageModule-3fa509dc5b826376dc511d9d9b3eaf1fb59f177f3ff659554158063ceb980ddbaafe0545b86aab394abe0236ebd52a2c57aa165622accd941cd05008a9875b2b"' :
                                            'id="xs-components-links-module-CreateJobPost1stPageModule-3fa509dc5b826376dc511d9d9b3eaf1fb59f177f3ff659554158063ceb980ddbaafe0545b86aab394abe0236ebd52a2c57aa165622accd941cd05008a9875b2b"' }>
                                            <li class="link">
                                                <a href="components/CreateJobPost1stPageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateJobPost1stPageComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ErrorSystemRequirementFailedModule.html" data-type="entity-link" >ErrorSystemRequirementFailedModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ErrorSystemRequirementFailedModule-2401baa3667cfa2d2a3f6f22f7cdf9412646e1fa4d76188472073bcf355dee522b6d695b1fc919c0cf9be07cbbbe6b2625cbc92da9d0f38de5973d35d252cfb4"' : 'data-bs-target="#xs-components-links-module-ErrorSystemRequirementFailedModule-2401baa3667cfa2d2a3f6f22f7cdf9412646e1fa4d76188472073bcf355dee522b6d695b1fc919c0cf9be07cbbbe6b2625cbc92da9d0f38de5973d35d252cfb4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ErrorSystemRequirementFailedModule-2401baa3667cfa2d2a3f6f22f7cdf9412646e1fa4d76188472073bcf355dee522b6d695b1fc919c0cf9be07cbbbe6b2625cbc92da9d0f38de5973d35d252cfb4"' :
                                            'id="xs-components-links-module-ErrorSystemRequirementFailedModule-2401baa3667cfa2d2a3f6f22f7cdf9412646e1fa4d76188472073bcf355dee522b6d695b1fc919c0cf9be07cbbbe6b2625cbc92da9d0f38de5973d35d252cfb4"' }>
                                            <li class="link">
                                                <a href="components/ErrorSystemRequirementFailed.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ErrorSystemRequirementFailed</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FlashyreAssessment11Module.html" data-type="entity-link" >FlashyreAssessment11Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-FlashyreAssessment11Module-948807b5c9e617cdaf76ba37fb0a27316b9958e4b42415119def8637db18afaaeb8bbc8fe400741260d4b8b1867c225dfc9fba1e3d9521e687f1f0d50e9a0f63"' : 'data-bs-target="#xs-components-links-module-FlashyreAssessment11Module-948807b5c9e617cdaf76ba37fb0a27316b9958e4b42415119def8637db18afaaeb8bbc8fe400741260d4b8b1867c225dfc9fba1e3d9521e687f1f0d50e9a0f63"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FlashyreAssessment11Module-948807b5c9e617cdaf76ba37fb0a27316b9958e4b42415119def8637db18afaaeb8bbc8fe400741260d4b8b1867c225dfc9fba1e3d9521e687f1f0d50e9a0f63"' :
                                            'id="xs-components-links-module-FlashyreAssessment11Module-948807b5c9e617cdaf76ba37fb0a27316b9958e4b42415119def8637db18afaaeb8bbc8fe400741260d4b8b1867c225dfc9fba1e3d9521e687f1f0d50e9a0f63"' }>
                                            <li class="link">
                                                <a href="components/FlashyreAssessment11.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreAssessment11</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FlashyreAssessment1Module.html" data-type="entity-link" >FlashyreAssessment1Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-FlashyreAssessment1Module-3bc62980049d56157dad0026b83362872b713618e1e7b702f35ba4a3eb2392c94908251ef9c8e3863e2ae75283be4d23e0b3e695592b92276f4e6d4e57bf7cc7"' : 'data-bs-target="#xs-components-links-module-FlashyreAssessment1Module-3bc62980049d56157dad0026b83362872b713618e1e7b702f35ba4a3eb2392c94908251ef9c8e3863e2ae75283be4d23e0b3e695592b92276f4e6d4e57bf7cc7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FlashyreAssessment1Module-3bc62980049d56157dad0026b83362872b713618e1e7b702f35ba4a3eb2392c94908251ef9c8e3863e2ae75283be4d23e0b3e695592b92276f4e6d4e57bf7cc7"' :
                                            'id="xs-components-links-module-FlashyreAssessment1Module-3bc62980049d56157dad0026b83362872b713618e1e7b702f35ba4a3eb2392c94908251ef9c8e3863e2ae75283be4d23e0b3e695592b92276f4e6d4e57bf7cc7"' }>
                                            <li class="link">
                                                <a href="components/FlashyreAssessment1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreAssessment1</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FlashyreAssessmentRulesCardModule.html" data-type="entity-link" >FlashyreAssessmentRulesCardModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-FlashyreAssessmentRulesCardModule-cfca492a1469b9b59f713e9878eeb8a998d985dfb00bd957c42a03bbd03cdb4913f89d0ca60f3da5762550797081ae5c951b28c3379840de8fa609063fd02790"' : 'data-bs-target="#xs-components-links-module-FlashyreAssessmentRulesCardModule-cfca492a1469b9b59f713e9878eeb8a998d985dfb00bd957c42a03bbd03cdb4913f89d0ca60f3da5762550797081ae5c951b28c3379840de8fa609063fd02790"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FlashyreAssessmentRulesCardModule-cfca492a1469b9b59f713e9878eeb8a998d985dfb00bd957c42a03bbd03cdb4913f89d0ca60f3da5762550797081ae5c951b28c3379840de8fa609063fd02790"' :
                                            'id="xs-components-links-module-FlashyreAssessmentRulesCardModule-cfca492a1469b9b59f713e9878eeb8a998d985dfb00bd957c42a03bbd03cdb4913f89d0ca60f3da5762550797081ae5c951b28c3379840de8fa609063fd02790"' }>
                                            <li class="link">
                                                <a href="components/FlashyreAssessmentRulesCard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreAssessmentRulesCard</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FlashyreAssessmentsModule.html" data-type="entity-link" >FlashyreAssessmentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-FlashyreAssessmentsModule-878ff90ebbd2a41eb07a8f429d784bbf2d948663e58e34e12892873dbf08324feaa5d100d412cbfaff4c3906e82b088800702a087188fcc805a2f24daa2f41c2"' : 'data-bs-target="#xs-components-links-module-FlashyreAssessmentsModule-878ff90ebbd2a41eb07a8f429d784bbf2d948663e58e34e12892873dbf08324feaa5d100d412cbfaff4c3906e82b088800702a087188fcc805a2f24daa2f41c2"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FlashyreAssessmentsModule-878ff90ebbd2a41eb07a8f429d784bbf2d948663e58e34e12892873dbf08324feaa5d100d412cbfaff4c3906e82b088800702a087188fcc805a2f24daa2f41c2"' :
                                            'id="xs-components-links-module-FlashyreAssessmentsModule-878ff90ebbd2a41eb07a8f429d784bbf2d948663e58e34e12892873dbf08324feaa5d100d412cbfaff4c3906e82b088800702a087188fcc805a2f24daa2f41c2"' }>
                                            <li class="link">
                                                <a href="components/FlashyreAssessments.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FlashyreAssessments</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/HomeModule.html" data-type="entity-link" >HomeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-HomeModule-dac9353264d23b3280b0a214ce96fc7f6461631b294510ef3a8d15d23819b025712aaa78c0118435df6663c9d08a502bdedb51ee97a4bf386a680a7c91b3aff8"' : 'data-bs-target="#xs-components-links-module-HomeModule-dac9353264d23b3280b0a214ce96fc7f6461631b294510ef3a8d15d23819b025712aaa78c0118435df6663c9d08a502bdedb51ee97a4bf386a680a7c91b3aff8"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-HomeModule-dac9353264d23b3280b0a214ce96fc7f6461631b294510ef3a8d15d23819b025712aaa78c0118435df6663c9d08a502bdedb51ee97a4bf386a680a7c91b3aff8"' :
                                            'id="xs-components-links-module-HomeModule-dac9353264d23b3280b0a214ce96fc7f6461631b294510ef3a8d15d23819b025712aaa78c0118435df6663c9d08a502bdedb51ee97a4bf386a680a7c91b3aff8"' }>
                                            <li class="link">
                                                <a href="components/Home.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Home</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/IndexModule.html" data-type="entity-link" >IndexModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-IndexModule-fd709f3f5e14cccea97b7fb87fe65ffd968156b2dbddd911f7825dfb30bd633750b742a9f83b0884b2eda2901618d27c1e1b506464fc54b2cadc177f7b3eecf4"' : 'data-bs-target="#xs-components-links-module-IndexModule-fd709f3f5e14cccea97b7fb87fe65ffd968156b2dbddd911f7825dfb30bd633750b742a9f83b0884b2eda2901618d27c1e1b506464fc54b2cadc177f7b3eecf4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-IndexModule-fd709f3f5e14cccea97b7fb87fe65ffd968156b2dbddd911f7825dfb30bd633750b742a9f83b0884b2eda2901618d27c1e1b506464fc54b2cadc177f7b3eecf4"' :
                                            'id="xs-components-links-module-IndexModule-fd709f3f5e14cccea97b7fb87fe65ffd968156b2dbddd911f7825dfb30bd633750b742a9f83b0884b2eda2901618d27c1e1b506464fc54b2cadc177f7b3eecf4"' }>
                                            <li class="link">
                                                <a href="components/Index.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Index</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginCandidateModule.html" data-type="entity-link" >LoginCandidateModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LoginCandidateModule-4e0aa5e2b1493896fff8244f2e75a3ef2bde91f2a410f9556d26bae89906e7937d95583d48992561574f8fd7c49604a53da1b5a5328abb7ccc99d4740d1bbf1e"' : 'data-bs-target="#xs-components-links-module-LoginCandidateModule-4e0aa5e2b1493896fff8244f2e75a3ef2bde91f2a410f9556d26bae89906e7937d95583d48992561574f8fd7c49604a53da1b5a5328abb7ccc99d4740d1bbf1e"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginCandidateModule-4e0aa5e2b1493896fff8244f2e75a3ef2bde91f2a410f9556d26bae89906e7937d95583d48992561574f8fd7c49604a53da1b5a5328abb7ccc99d4740d1bbf1e"' :
                                            'id="xs-components-links-module-LoginCandidateModule-4e0aa5e2b1493896fff8244f2e75a3ef2bde91f2a410f9556d26bae89906e7937d95583d48992561574f8fd7c49604a53da1b5a5328abb7ccc99d4740d1bbf1e"' }>
                                            <li class="link">
                                                <a href="components/LoginCandidate.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginCandidate</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginCollegeModule.html" data-type="entity-link" >LoginCollegeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LoginCollegeModule-28f21fe71f2415d071302eeda4021e3261f246069332b198ff9dfd112692305f485665a7e647d327e9ae71b45b1f6121f7d7f25752e16fae7ce01dd18bc6effc"' : 'data-bs-target="#xs-components-links-module-LoginCollegeModule-28f21fe71f2415d071302eeda4021e3261f246069332b198ff9dfd112692305f485665a7e647d327e9ae71b45b1f6121f7d7f25752e16fae7ce01dd18bc6effc"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginCollegeModule-28f21fe71f2415d071302eeda4021e3261f246069332b198ff9dfd112692305f485665a7e647d327e9ae71b45b1f6121f7d7f25752e16fae7ce01dd18bc6effc"' :
                                            'id="xs-components-links-module-LoginCollegeModule-28f21fe71f2415d071302eeda4021e3261f246069332b198ff9dfd112692305f485665a7e647d327e9ae71b45b1f6121f7d7f25752e16fae7ce01dd18bc6effc"' }>
                                            <li class="link">
                                                <a href="components/LoginCollege.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginCollege</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginCorporateModule.html" data-type="entity-link" >LoginCorporateModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LoginCorporateModule-9b941bbb067a9902e0b71a0ee90f373af343c876913359a44bc6bb25645197d2301e53dfa60d63fc2400b833ed03db71c87935482e373d7c255c098929e633f7"' : 'data-bs-target="#xs-components-links-module-LoginCorporateModule-9b941bbb067a9902e0b71a0ee90f373af343c876913359a44bc6bb25645197d2301e53dfa60d63fc2400b833ed03db71c87935482e373d7c255c098929e633f7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginCorporateModule-9b941bbb067a9902e0b71a0ee90f373af343c876913359a44bc6bb25645197d2301e53dfa60d63fc2400b833ed03db71c87935482e373d7c255c098929e633f7"' :
                                            'id="xs-components-links-module-LoginCorporateModule-9b941bbb067a9902e0b71a0ee90f373af343c876913359a44bc6bb25645197d2301e53dfa60d63fc2400b833ed03db71c87935482e373d7c255c098929e633f7"' }>
                                            <li class="link">
                                                <a href="components/LoginCorporate.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginCorporate</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginForgotPasswordModule.html" data-type="entity-link" >LoginForgotPasswordModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LoginForgotPasswordModule-06f0ef78b12dfced8a4369e49106d2dc49a1825dbd2c94809fe415ff5926c20507f7bf9d0349e4c4b5eb86c8ccf1043f633bb2d5566141cc828f49d13b1a262b"' : 'data-bs-target="#xs-components-links-module-LoginForgotPasswordModule-06f0ef78b12dfced8a4369e49106d2dc49a1825dbd2c94809fe415ff5926c20507f7bf9d0349e4c4b5eb86c8ccf1043f633bb2d5566141cc828f49d13b1a262b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginForgotPasswordModule-06f0ef78b12dfced8a4369e49106d2dc49a1825dbd2c94809fe415ff5926c20507f7bf9d0349e4c4b5eb86c8ccf1043f633bb2d5566141cc828f49d13b1a262b"' :
                                            'id="xs-components-links-module-LoginForgotPasswordModule-06f0ef78b12dfced8a4369e49106d2dc49a1825dbd2c94809fe415ff5926c20507f7bf9d0349e4c4b5eb86c8ccf1043f633bb2d5566141cc828f49d13b1a262b"' }>
                                            <li class="link">
                                                <a href="components/ForgotPasswordComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ForgotPasswordComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginResetPasswordModule.html" data-type="entity-link" >LoginResetPasswordModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LoginResetPasswordModule-5ad0f7dea25356c5f6ebfe9e4d6c13428ff007d648790fdc6574319efe844fc49f6048a5fa71e213e4aeca63cbb96fa1cbf4ed3668920384d77a27300eed61c8"' : 'data-bs-target="#xs-components-links-module-LoginResetPasswordModule-5ad0f7dea25356c5f6ebfe9e4d6c13428ff007d648790fdc6574319efe844fc49f6048a5fa71e213e4aeca63cbb96fa1cbf4ed3668920384d77a27300eed61c8"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginResetPasswordModule-5ad0f7dea25356c5f6ebfe9e4d6c13428ff007d648790fdc6574319efe844fc49f6048a5fa71e213e4aeca63cbb96fa1cbf4ed3668920384d77a27300eed61c8"' :
                                            'id="xs-components-links-module-LoginResetPasswordModule-5ad0f7dea25356c5f6ebfe9e4d6c13428ff007d648790fdc6574319efe844fc49f6048a5fa71e213e4aeca63cbb96fa1cbf4ed3668920384d77a27300eed61c8"' }>
                                            <li class="link">
                                                <a href="components/LoginResetPasswordComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginResetPasswordComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotFoundModule.html" data-type="entity-link" >NotFoundModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-NotFoundModule-ab935603e9c648f9152191ca09f76d23ad12b324f6bb4c6e2e4450b53c5ff728876633a0282f0ddf729d8c084bbfb180b683a4f3073faacaa89a9fb6326c2334"' : 'data-bs-target="#xs-components-links-module-NotFoundModule-ab935603e9c648f9152191ca09f76d23ad12b324f6bb4c6e2e4450b53c5ff728876633a0282f0ddf729d8c084bbfb180b683a4f3073faacaa89a9fb6326c2334"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-NotFoundModule-ab935603e9c648f9152191ca09f76d23ad12b324f6bb4c6e2e4450b53c5ff728876633a0282f0ddf729d8c084bbfb180b683a4f3073faacaa89a9fb6326c2334"' :
                                            'id="xs-components-links-module-NotFoundModule-ab935603e9c648f9152191ca09f76d23ad12b324f6bb4c6e2e4450b53c5ff728876633a0282f0ddf729d8c084bbfb180b683a4f3073faacaa89a9fb6326c2334"' }>
                                            <li class="link">
                                                <a href="components/NotFound.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotFound</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileBasicInformationModule.html" data-type="entity-link" >ProfileBasicInformationModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileBasicInformationModule-a3f18c9b41cc214d957bbda0bf13e9a450195c0ad6be8c837918e2db571e8f66b92b87a493ac533978e56040518e8ca3ab76ee347343068b6ac971dae9220ed8"' : 'data-bs-target="#xs-components-links-module-ProfileBasicInformationModule-a3f18c9b41cc214d957bbda0bf13e9a450195c0ad6be8c837918e2db571e8f66b92b87a493ac533978e56040518e8ca3ab76ee347343068b6ac971dae9220ed8"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileBasicInformationModule-a3f18c9b41cc214d957bbda0bf13e9a450195c0ad6be8c837918e2db571e8f66b92b87a493ac533978e56040518e8ca3ab76ee347343068b6ac971dae9220ed8"' :
                                            'id="xs-components-links-module-ProfileBasicInformationModule-a3f18c9b41cc214d957bbda0bf13e9a450195c0ad6be8c837918e2db571e8f66b92b87a493ac533978e56040518e8ca3ab76ee347343068b6ac971dae9220ed8"' }>
                                            <li class="link">
                                                <a href="components/ProfileBasicInformation.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileBasicInformation</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileCertificationPageModule.html" data-type="entity-link" >ProfileCertificationPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileCertificationPageModule-7ec57fd29411766383064041840f1b8b1b473aab605683b974ba282300b048c3d66d21a9477bf04753e90d13db7f265cdd50e022eb33b953bbdd9fa9138bc422"' : 'data-bs-target="#xs-components-links-module-ProfileCertificationPageModule-7ec57fd29411766383064041840f1b8b1b473aab605683b974ba282300b048c3d66d21a9477bf04753e90d13db7f265cdd50e022eb33b953bbdd9fa9138bc422"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileCertificationPageModule-7ec57fd29411766383064041840f1b8b1b473aab605683b974ba282300b048c3d66d21a9477bf04753e90d13db7f265cdd50e022eb33b953bbdd9fa9138bc422"' :
                                            'id="xs-components-links-module-ProfileCertificationPageModule-7ec57fd29411766383064041840f1b8b1b473aab605683b974ba282300b048c3d66d21a9477bf04753e90d13db7f265cdd50e022eb33b953bbdd9fa9138bc422"' }>
                                            <li class="link">
                                                <a href="components/ProfileCertificationPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileCertificationPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileEducationPageDuplicateModule.html" data-type="entity-link" >ProfileEducationPageDuplicateModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileEducationPageDuplicateModule-44d08a425079bc6b3d5dcbdc8bd086a72f42a6526acdd8cda64dfaa5f47eca55d4c437934f7d73d6564d8c404620ffd2b3a0cc836a075769889081225eb1fd93"' : 'data-bs-target="#xs-components-links-module-ProfileEducationPageDuplicateModule-44d08a425079bc6b3d5dcbdc8bd086a72f42a6526acdd8cda64dfaa5f47eca55d4c437934f7d73d6564d8c404620ffd2b3a0cc836a075769889081225eb1fd93"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileEducationPageDuplicateModule-44d08a425079bc6b3d5dcbdc8bd086a72f42a6526acdd8cda64dfaa5f47eca55d4c437934f7d73d6564d8c404620ffd2b3a0cc836a075769889081225eb1fd93"' :
                                            'id="xs-components-links-module-ProfileEducationPageDuplicateModule-44d08a425079bc6b3d5dcbdc8bd086a72f42a6526acdd8cda64dfaa5f47eca55d4c437934f7d73d6564d8c404620ffd2b3a0cc836a075769889081225eb1fd93"' }>
                                            <li class="link">
                                                <a href="components/ProfileEducationPageDuplicate.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileEducationPageDuplicate</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileEducationPageModule.html" data-type="entity-link" >ProfileEducationPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileEducationPageModule-ae6035650015411e6196aeaaa5a35a1456b600531decb5f8429fec3c0f66c0c610cfb97a9a06ab83f1362c4655dd9dee4809915e494a7033f519204b8c1dc664"' : 'data-bs-target="#xs-components-links-module-ProfileEducationPageModule-ae6035650015411e6196aeaaa5a35a1456b600531decb5f8429fec3c0f66c0c610cfb97a9a06ab83f1362c4655dd9dee4809915e494a7033f519204b8c1dc664"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileEducationPageModule-ae6035650015411e6196aeaaa5a35a1456b600531decb5f8429fec3c0f66c0c610cfb97a9a06ab83f1362c4655dd9dee4809915e494a7033f519204b8c1dc664"' :
                                            'id="xs-components-links-module-ProfileEducationPageModule-ae6035650015411e6196aeaaa5a35a1456b600531decb5f8429fec3c0f66c0c610cfb97a9a06ab83f1362c4655dd9dee4809915e494a7033f519204b8c1dc664"' }>
                                            <li class="link">
                                                <a href="components/ProfileEducationPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileEducationPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileEmploymentPageModule.html" data-type="entity-link" >ProfileEmploymentPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileEmploymentPageModule-bd95283731cfde3ca08523ac0fce53d80a35c0d3431be0741ef4cb0737433b1430b447e9f7cd0bad6d561a0efd3cba35d04771b130c39b0e54359416444094e7"' : 'data-bs-target="#xs-components-links-module-ProfileEmploymentPageModule-bd95283731cfde3ca08523ac0fce53d80a35c0d3431be0741ef4cb0737433b1430b447e9f7cd0bad6d561a0efd3cba35d04771b130c39b0e54359416444094e7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileEmploymentPageModule-bd95283731cfde3ca08523ac0fce53d80a35c0d3431be0741ef4cb0737433b1430b447e9f7cd0bad6d561a0efd3cba35d04771b130c39b0e54359416444094e7"' :
                                            'id="xs-components-links-module-ProfileEmploymentPageModule-bd95283731cfde3ca08523ac0fce53d80a35c0d3431be0741ef4cb0737433b1430b447e9f7cd0bad6d561a0efd3cba35d04771b130c39b0e54359416444094e7"' }>
                                            <li class="link">
                                                <a href="components/ProfileEmploymentPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileEmploymentPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileLastPage1Module.html" data-type="entity-link" >ProfileLastPage1Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileLastPage1Module-ce442d56fd9e506b96069dc7db78f87787853d593d99301a6c27dbb95977cbca03b892784f11fa118d6764e26936ec6c36a0d8023a415ee2b3c252f6385c4bba"' : 'data-bs-target="#xs-components-links-module-ProfileLastPage1Module-ce442d56fd9e506b96069dc7db78f87787853d593d99301a6c27dbb95977cbca03b892784f11fa118d6764e26936ec6c36a0d8023a415ee2b3c252f6385c4bba"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileLastPage1Module-ce442d56fd9e506b96069dc7db78f87787853d593d99301a6c27dbb95977cbca03b892784f11fa118d6764e26936ec6c36a0d8023a415ee2b3c252f6385c4bba"' :
                                            'id="xs-components-links-module-ProfileLastPage1Module-ce442d56fd9e506b96069dc7db78f87787853d593d99301a6c27dbb95977cbca03b892784f11fa118d6764e26936ec6c36a0d8023a415ee2b3c252f6385c4bba"' }>
                                            <li class="link">
                                                <a href="components/ProfileLastPage1.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileLastPage1</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileOverviewPageModule.html" data-type="entity-link" >ProfileOverviewPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfileOverviewPageModule-327f918aea77000a4b803a5deba172e5f02daf81777dbc9dac6f69f2c4d6e24b5c73bc1ce31fe52292d258ed87ce9e7e23cae4ae9359974a1562e1ca2fe11cb1"' : 'data-bs-target="#xs-components-links-module-ProfileOverviewPageModule-327f918aea77000a4b803a5deba172e5f02daf81777dbc9dac6f69f2c4d6e24b5c73bc1ce31fe52292d258ed87ce9e7e23cae4ae9359974a1562e1ca2fe11cb1"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfileOverviewPageModule-327f918aea77000a4b803a5deba172e5f02daf81777dbc9dac6f69f2c4d6e24b5c73bc1ce31fe52292d258ed87ce9e7e23cae4ae9359974a1562e1ca2fe11cb1"' :
                                            'id="xs-components-links-module-ProfileOverviewPageModule-327f918aea77000a4b803a5deba172e5f02daf81777dbc9dac6f69f2c4d6e24b5c73bc1ce31fe52292d258ed87ce9e7e23cae4ae9359974a1562e1ca2fe11cb1"' }>
                                            <li class="link">
                                                <a href="components/ProfileOverviewPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileOverviewPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RecruiterView3rdPageModule.html" data-type="entity-link" >RecruiterView3rdPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-RecruiterView3rdPageModule-8b70d1fbd307c86d38216bb39d8fc65d8277ad9fb72ede927b759b23a121e42f662028ed17785c7ea5203b76a539f2951966b888f9b4c1451a67b2dd46852491"' : 'data-bs-target="#xs-components-links-module-RecruiterView3rdPageModule-8b70d1fbd307c86d38216bb39d8fc65d8277ad9fb72ede927b759b23a121e42f662028ed17785c7ea5203b76a539f2951966b888f9b4c1451a67b2dd46852491"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-RecruiterView3rdPageModule-8b70d1fbd307c86d38216bb39d8fc65d8277ad9fb72ede927b759b23a121e42f662028ed17785c7ea5203b76a539f2951966b888f9b4c1451a67b2dd46852491"' :
                                            'id="xs-components-links-module-RecruiterView3rdPageModule-8b70d1fbd307c86d38216bb39d8fc65d8277ad9fb72ede927b759b23a121e42f662028ed17785c7ea5203b76a539f2951966b888f9b4c1451a67b2dd46852491"' }>
                                            <li class="link">
                                                <a href="components/RecruiterView3rdPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterView3rdPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RecruiterView4thPageModule.html" data-type="entity-link" >RecruiterView4thPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-RecruiterView4thPageModule-1e768f376e5809ac51150e9c9b551af7d809647635e4594b8c73c6291c89c50a7af2e0c24cf995b5a3736fc509606d6db79155555b88fcbefba507931e197a24"' : 'data-bs-target="#xs-components-links-module-RecruiterView4thPageModule-1e768f376e5809ac51150e9c9b551af7d809647635e4594b8c73c6291c89c50a7af2e0c24cf995b5a3736fc509606d6db79155555b88fcbefba507931e197a24"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-RecruiterView4thPageModule-1e768f376e5809ac51150e9c9b551af7d809647635e4594b8c73c6291c89c50a7af2e0c24cf995b5a3736fc509606d6db79155555b88fcbefba507931e197a24"' :
                                            'id="xs-components-links-module-RecruiterView4thPageModule-1e768f376e5809ac51150e9c9b551af7d809647635e4594b8c73c6291c89c50a7af2e0c24cf995b5a3736fc509606d6db79155555b88fcbefba507931e197a24"' }>
                                            <li class="link">
                                                <a href="components/RecruiterView4thPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterView4thPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RecruiterView5thPageModule.html" data-type="entity-link" >RecruiterView5thPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-RecruiterView5thPageModule-944394d02662008a3136fe394d8dc6ebc29df9c6056f2ec4e8c4248fa10b899199bfbe6929888afc536297942c12cd32a6e36a0f335ceb5ea36ad9d31e02e58e"' : 'data-bs-target="#xs-components-links-module-RecruiterView5thPageModule-944394d02662008a3136fe394d8dc6ebc29df9c6056f2ec4e8c4248fa10b899199bfbe6929888afc536297942c12cd32a6e36a0f335ceb5ea36ad9d31e02e58e"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-RecruiterView5thPageModule-944394d02662008a3136fe394d8dc6ebc29df9c6056f2ec4e8c4248fa10b899199bfbe6929888afc536297942c12cd32a6e36a0f335ceb5ea36ad9d31e02e58e"' :
                                            'id="xs-components-links-module-RecruiterView5thPageModule-944394d02662008a3136fe394d8dc6ebc29df9c6056f2ec4e8c4248fa10b899199bfbe6929888afc536297942c12cd32a6e36a0f335ceb5ea36ad9d31e02e58e"' }>
                                            <li class="link">
                                                <a href="components/RecruiterView5thPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecruiterView5thPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SharedPipesModule.html" data-type="entity-link" >SharedPipesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#pipes-links-module-SharedPipesModule-e6c7499cd2771f4b2b43731f554e9c80caae77efcbb341a1495217bced375ed6a84505e3b2ff3d254b82f079ff2042761b0e75a754082d7513560032e48848df"' : 'data-bs-target="#xs-pipes-links-module-SharedPipesModule-e6c7499cd2771f4b2b43731f554e9c80caae77efcbb341a1495217bced375ed6a84505e3b2ff3d254b82f079ff2042761b0e75a754082d7513560032e48848df"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-SharedPipesModule-e6c7499cd2771f4b2b43731f554e9c80caae77efcbb341a1495217bced375ed6a84505e3b2ff3d254b82f079ff2042761b0e75a754082d7513560032e48848df"' :
                                            'id="xs-pipes-links-module-SharedPipesModule-e6c7499cd2771f4b2b43731f554e9c80caae77efcbb341a1495217bced375ed6a84505e3b2ff3d254b82f079ff2042761b0e75a754082d7513560032e48848df"' }>
                                            <li class="link">
                                                <a href="pipes/TimerFormatPipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TimerFormatPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SignupCandidateModule.html" data-type="entity-link" >SignupCandidateModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SignupCandidateModule-325b2ae6396e2c99ad9c8a35c1b49a4657d01a0e953fb760984828205d5a54e27c45f391236e29efd087603469d3c9459751567992906ba7c9be06cca5d43dfa"' : 'data-bs-target="#xs-components-links-module-SignupCandidateModule-325b2ae6396e2c99ad9c8a35c1b49a4657d01a0e953fb760984828205d5a54e27c45f391236e29efd087603469d3c9459751567992906ba7c9be06cca5d43dfa"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SignupCandidateModule-325b2ae6396e2c99ad9c8a35c1b49a4657d01a0e953fb760984828205d5a54e27c45f391236e29efd087603469d3c9459751567992906ba7c9be06cca5d43dfa"' :
                                            'id="xs-components-links-module-SignupCandidateModule-325b2ae6396e2c99ad9c8a35c1b49a4657d01a0e953fb760984828205d5a54e27c45f391236e29efd087603469d3c9459751567992906ba7c9be06cca5d43dfa"' }>
                                            <li class="link">
                                                <a href="components/SignupCandidate.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupCandidate</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SignupCollegeModule.html" data-type="entity-link" >SignupCollegeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SignupCollegeModule-bb2d8b4d8b3d232e0fc7154eaa78f2c66cb2b128bfca5b9fe8a06efcff7717b0caacfa3639948c88baaa844314e00fec12fc81247bc16ec8213d09c40c6b3de4"' : 'data-bs-target="#xs-components-links-module-SignupCollegeModule-bb2d8b4d8b3d232e0fc7154eaa78f2c66cb2b128bfca5b9fe8a06efcff7717b0caacfa3639948c88baaa844314e00fec12fc81247bc16ec8213d09c40c6b3de4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SignupCollegeModule-bb2d8b4d8b3d232e0fc7154eaa78f2c66cb2b128bfca5b9fe8a06efcff7717b0caacfa3639948c88baaa844314e00fec12fc81247bc16ec8213d09c40c6b3de4"' :
                                            'id="xs-components-links-module-SignupCollegeModule-bb2d8b4d8b3d232e0fc7154eaa78f2c66cb2b128bfca5b9fe8a06efcff7717b0caacfa3639948c88baaa844314e00fec12fc81247bc16ec8213d09c40c6b3de4"' }>
                                            <li class="link">
                                                <a href="components/SignupCollege.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupCollege</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SignupCorporateModule.html" data-type="entity-link" >SignupCorporateModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SignupCorporateModule-9f51e0d14f8355048b66d9cf5e3a22d68282c63d1b265b1e71c62cb33d018ff2049c734d6fe5900edece7a3ee5ed44b312dff32faa65d7f0820757b47afc4062"' : 'data-bs-target="#xs-components-links-module-SignupCorporateModule-9f51e0d14f8355048b66d9cf5e3a22d68282c63d1b265b1e71c62cb33d018ff2049c734d6fe5900edece7a3ee5ed44b312dff32faa65d7f0820757b47afc4062"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SignupCorporateModule-9f51e0d14f8355048b66d9cf5e3a22d68282c63d1b265b1e71c62cb33d018ff2049c734d6fe5900edece7a3ee5ed44b312dff32faa65d7f0820757b47afc4062"' :
                                            'id="xs-components-links-module-SignupCorporateModule-9f51e0d14f8355048b66d9cf5e3a22d68282c63d1b265b1e71c62cb33d018ff2049c734d6fe5900edece7a3ee5ed44b312dff32faa65d7f0820757b47afc4062"' }>
                                            <li class="link">
                                                <a href="components/SignupCorporate.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupCorporate</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AppComponent-1.html" data-type="entity-link" >AppComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AIProcessingService.html" data-type="entity-link" >AIProcessingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AssessmentService.html" data-type="entity-link" >AssessmentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AssessmentTakenService.html" data-type="entity-link" >AssessmentTakenService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BufferOverlayService.html" data-type="entity-link" >BufferOverlayService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BufferService.html" data-type="entity-link" >BufferService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CertificationService.html" data-type="entity-link" >CertificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CorporateAuthService.html" data-type="entity-link" >CorporateAuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EducationService.html" data-type="entity-link" >EducationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EmploymentService.html" data-type="entity-link" >EmploymentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileUploadService.html" data-type="entity-link" >FileUploadService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JobDescriptionService.html" data-type="entity-link" >JobDescriptionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JobsService.html" data-type="entity-link" >JobsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProctoringService.html" data-type="entity-link" >ProctoringService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfileService.html" data-type="entity-link" >ProfileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfileService-1.html" data-type="entity-link" >ProfileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ResetService.html" data-type="entity-link" >ResetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SessionService.html" data-type="entity-link" >SessionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemRequirementService.html" data-type="entity-link" >SystemRequirementService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TrialAssessmentService.html" data-type="entity-link" >TrialAssessmentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserProfileService.html" data-type="entity-link" >UserProfileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoRecorderService.html" data-type="entity-link" >VideoRecorderService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interceptors-links"' :
                            'data-bs-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/BufferInterceptor.html" data-type="entity-link" >BufferInterceptor</a>
                            </li>
                            <li class="link">
                                <a href="interceptors/JwtInterceptor.html" data-type="entity-link" >JwtInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AuthGuard.html" data-type="entity-link" >AuthGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AIJobResponse.html" data-type="entity-link" >AIJobResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AssessmentResponse.html" data-type="entity-link" >AssessmentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthResponse.html" data-type="entity-link" >AuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CorporateSignupData.html" data-type="entity-link" >CorporateSignupData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DropdownItem.html" data-type="entity-link" >DropdownItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JobDetails.html" data-type="entity-link" >JobDetails</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedJobPostResponse.html" data-type="entity-link" >PaginatedJobPostResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReferenceData.html" data-type="entity-link" >ReferenceData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectedAnswer.html" data-type="entity-link" >SelectedAnswer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectedAnswer-1.html" data-type="entity-link" >SelectedAnswer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Skill.html" data-type="entity-link" >Skill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TrialAssessmentResponse.html" data-type="entity-link" >TrialAssessmentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserProfile.html" data-type="entity-link" >UserProfile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserProfile-1.html" data-type="entity-link" >UserProfile</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});