import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDocumentNumberComponent } from './list-document-number.component';

describe('ListDocumentNumberComponent', () => {
  let component: ListDocumentNumberComponent;
  let fixture: ComponentFixture<ListDocumentNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDocumentNumberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListDocumentNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
