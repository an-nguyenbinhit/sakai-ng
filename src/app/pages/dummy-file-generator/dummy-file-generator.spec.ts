import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DummyFileGeneratorComponent } from './dummy-file-generator';

describe('DummyFileGeneratorComponent', () => {
    let component: DummyFileGeneratorComponent;
    let fixture: ComponentFixture<DummyFileGeneratorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DummyFileGeneratorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DummyFileGeneratorComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
