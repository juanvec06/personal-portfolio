import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleTitleComponent } from './role-title.component';

describe('RoleTitleComponent', () => {
  let component: RoleTitleComponent;
  let fixture: ComponentFixture<RoleTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleTitleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RoleTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
