import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegexTesterSpec } from './regex-tester.spec';

describe('RegexTesterSpec', () => {
    let component: RegexTesterSpec;
    let fixture: ComponentFixture<RegexTesterSpec>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegexTesterSpec]
        }).compileComponents();

        fixture = TestBed.createComponent(RegexTesterSpec);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
