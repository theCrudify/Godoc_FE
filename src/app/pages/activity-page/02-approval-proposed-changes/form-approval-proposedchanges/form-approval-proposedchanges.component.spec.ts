import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormApprovalProposedchangesComponent } from './form-approval-proposedchanges.component';

describe('FormApprovalProposedchangesComponent', () => {
  let component: FormApprovalProposedchangesComponent;
  let fixture: ComponentFixture<FormApprovalProposedchangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormApprovalProposedchangesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormApprovalProposedchangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
