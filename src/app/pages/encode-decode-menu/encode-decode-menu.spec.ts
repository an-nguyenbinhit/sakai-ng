import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncodeDecodeMenu } from './encode-decode-menu';

describe('EncodeDecodeMenu', () => {
    let component: EncodeDecodeMenu;
    let fixture: ComponentFixture<EncodeDecodeMenu>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EncodeDecodeMenu]
        }).compileComponents();

        fixture = TestBed.createComponent(EncodeDecodeMenu);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
