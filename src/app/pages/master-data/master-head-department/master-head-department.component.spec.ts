import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterHeadDepartmentComponent } from './master-head-department.component';

describe('MasterHeadDepartmentComponent', () => {
  let component: MasterHeadDepartmentComponent;
  let fixture: ComponentFixture<MasterHeadDepartmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterHeadDepartmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterHeadDepartmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
