import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentNumberComponent } from './document-number.component';

describe('DocumentNumberComponent', () => {
  let component: DocumentNumberComponent;
  let fixture: ComponentFixture<DocumentNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentNumberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
