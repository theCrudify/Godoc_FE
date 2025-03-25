import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterSubdocumentComponent } from './master-subdocument.component';

describe('MasterSubdocumentComponent', () => {
  let component: MasterSubdocumentComponent;
  let fixture: ComponentFixture<MasterSubdocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterSubdocumentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterSubdocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
