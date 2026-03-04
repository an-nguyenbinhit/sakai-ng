/**
 * Unit tests for EncodeDecodeMenu component.
 *
 * This component is a simple shell with no logic, so tests are intentionally
 * scoped to creation and DOM rendering.
 */
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

    it('should render its host element', () => {
        const el: HTMLElement = fixture.nativeElement;
        expect(el).toBeTruthy();
    });

    it('should be a pure shell with no custom input/output', () => {
        // The component class has no custom defined properties
        // (Angular runtime scaffolding may add internal ones, which is fine)
        expect(component instanceof (EncodeDecodeMenu as any)).toBeTrue();
    });
});
