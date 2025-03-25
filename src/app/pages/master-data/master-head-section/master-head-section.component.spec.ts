import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterHeadSectionComponent } from './master-head-section.component';

describe('MasterHeadSectionComponent', () => {
  let component: MasterHeadSectionComponent;
  let fixture: ComponentFixture<MasterHeadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterHeadSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterHeadSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
