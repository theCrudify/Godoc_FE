import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDocumentNumberComponent } from './create-document-number.component';

describe('CreateDocumentNumberComponent', () => {
  let component: CreateDocumentNumberComponent;
  let fixture: ComponentFixture<CreateDocumentNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateDocumentNumberComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDocumentNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
