import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionDepartmentComponent } from './section-department.component';

describe('SectionDepartmentComponent', () => {
  let component: SectionDepartmentComponent;
  let fixture: ComponentFixture<SectionDepartmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionDepartmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectionDepartmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
