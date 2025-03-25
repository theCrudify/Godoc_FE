import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDevelopmentComponent } from './master-development.component';

describe('MasterDevelopmentComponent', () => {
  let component: MasterDevelopmentComponent;
  let fixture: ComponentFixture<MasterDevelopmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDevelopmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterDevelopmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
