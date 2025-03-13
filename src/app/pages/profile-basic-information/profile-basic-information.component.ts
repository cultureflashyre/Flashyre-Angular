import { Component, ViewChild, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

import { ProfileBasicinformationComponent } from '../../components/profile-basicinformation-component/profile-basicinformation-component.component';

@Component({
  selector: 'profile-basic-information',
  templateUrl: './profile-basic-information.component.html',
  styleUrls: ['./profile-basic-information.component.css'],
})
export class ProfileBasicInformation implements OnInit {
  //@ViewChild('profileComponent') profileComponent!: ProfileBasicinformationComponent;

  currentPage: string = 'basic';
  
  constructor(private title: Title, 
    private meta: Meta, 
    private router: Router,
    public navigationService: NavigationService) {

    this.title.setTitle('Profile-Basic-Information - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Basic-Information - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit(): void {
    this.navigationService.currentPage$.subscribe(page => {
      this.currentPage = page;
    });
  }

  handleSaveAndNext(data: any) {
    this.navigationService.saveData(this.currentPage, data);
    this.navigationService.nextPage();
  }

  handleSkip() {
    this.navigationService.nextPage();
  }

  handlePrevious() {
    this.navigationService.previousPage();
  }

  // Helper methods to check the current page
  isBasicPage(): boolean {
    return this.currentPage === 'basic';
  }

  isEmploymentPage(): boolean {
    return this.currentPage === 'employment';
  }

  isCertificationsPage(): boolean {
    return this.currentPage === 'certifications';
  }

  //skip() {
    //this.profileComponent.skip();
  //}

  //saveProfile() {
    //this.profileComponent.saveProfile();
  //}
}