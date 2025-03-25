import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDoctypeComponent } from './master-doctype.component';

describe('MasterDoctypeComponent', () => {
  let component: MasterDoctypeComponent;
  let fixture: ComponentFixture<MasterDoctypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDoctypeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterDoctypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
