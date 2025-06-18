import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalRequestsDetailComponent } from './approval-requests-detail.component';

describe('ApprovalRequestsDetailComponent', () => {
  let component: ApprovalRequestsDetailComponent;
  let fixture: ComponentFixture<ApprovalRequestsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalRequestsDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApprovalRequestsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
