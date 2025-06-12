import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterApproverProposedComponent } from './master-approver-proposed.component';

describe('MasterApproverProposedComponent', () => {
  let component: MasterApproverProposedComponent;
  let fixture: ComponentFixture<MasterApproverProposedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterApproverProposedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterApproverProposedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
