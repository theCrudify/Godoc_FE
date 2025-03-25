import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterSupportDocComponent } from './master-support-doc.component';

describe('MasterSupportDocComponent', () => {
  let component: MasterSupportDocComponent;
  let fixture: ComponentFixture<MasterSupportDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterSupportDocComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterSupportDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
