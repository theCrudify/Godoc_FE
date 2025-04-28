import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationListApproverComponent } from './authorization-list-approver.component';

describe('AuthorizationListApproverComponent', () => {
  let component: AuthorizationListApproverComponent;
  let fixture: ComponentFixture<AuthorizationListApproverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizationListApproverComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthorizationListApproverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
