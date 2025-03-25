import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterAreaComponent } from './master-area.component';

describe('MasterAreaComponent', () => {
  let component: MasterAreaComponent;
  let fixture: ComponentFixture<MasterAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterAreaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
