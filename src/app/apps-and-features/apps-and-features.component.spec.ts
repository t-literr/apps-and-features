import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppsAndFeaturesComponent } from './apps-and-features.component';

describe('AppsAndFeaturesComponent', () => {
  let component: AppsAndFeaturesComponent;
  let fixture: ComponentFixture<AppsAndFeaturesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppsAndFeaturesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppsAndFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
