import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniversityCollegeDashboardComponent } from './university-college-dashboard.component';

describe('UniversityCollegeDashboardComponent', () => {
  let component: UniversityCollegeDashboardComponent;
  let fixture: ComponentFixture<UniversityCollegeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UniversityCollegeDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UniversityCollegeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
