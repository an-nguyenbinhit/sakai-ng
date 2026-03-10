import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DummyFileGenerator } from './dummy-file-generator';

describe('DummyFileGenerator', () => {
    let component: DummyFileGenerator;
    let fixture: ComponentFixture<DummyFileGenerator>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DummyFileGenerator]
        }).compileComponents();

        fixture = TestBed.createComponent(DummyFileGenerator);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
