import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { signal, WritableSignal, NO_ERRORS_SCHEMA } from '@angular/core';

import { CodeCompare } from './code-compare'; // removed .ts extension
import { CodeCompareState } from './services/code-compare-state.service';
import { CodeInput } from './components/code-input/code-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';

describe('CodeCompare Component', () => {
    let component: CodeCompare;
    let fixture: ComponentFixture<CodeCompare>;

    let mockLeftFile: WritableSignal<any>;
    let mockRightFile: WritableSignal<any>;

    beforeEach(async () => {
        mockLeftFile = signal(null);
        mockRightFile = signal(null);

        const mockState = {
            leftFile: mockLeftFile,
            rightFile: mockRightFile,
            reset: jasmine.createSpy('reset')
        };

        await TestBed.configureTestingModule({
            imports: [CodeCompare],
            providers: [{ provide: CodeCompareState, useValue: mockState }],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CodeCompare);
        component = fixture.componentInstance;
        // Don't call fixture.detectChanges() immediately if you want to test ngOnInit separately
    });

    it('should create the component', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should reset state on init', () => {
        fixture.detectChanges();
        expect((component as any).state.reset).toHaveBeenCalled();
    });

    describe('computed properties', () => {
        const dummyFile1 = { content: 'line1\nline2\nline3' };
        const dummyFile2 = { content: 'line1' };

        it('hasAnyFile should compute correctly', () => {
            fixture.detectChanges();
            expect(component.hasAnyFile()).toBeFalse();

            mockLeftFile.set(dummyFile1);
            fixture.detectChanges();
            expect(component.hasAnyFile()).toBeTrue();

            mockLeftFile.set(null);
            mockRightFile.set(dummyFile2);
            fixture.detectChanges();
            expect(component.hasAnyFile()).toBeTrue();
        });

        it('hasBothFiles should compute correctly', () => {
            fixture.detectChanges();
            expect(component.hasBothFiles()).toBeFalse();

            mockLeftFile.set(dummyFile1);
            fixture.detectChanges();
            expect(component.hasBothFiles()).toBeFalse();

            mockRightFile.set(dummyFile2);
            fixture.detectChanges();
            expect(component.hasBothFiles()).toBeTrue();
        });

        it('should compute left and right line counts', () => {
            fixture.detectChanges();
            expect(component.leftLineCount()).toBe(0);
            expect(component.rightLineCount()).toBe(0);

            mockLeftFile.set(dummyFile1);
            mockRightFile.set(dummyFile2);
            fixture.detectChanges();

            expect(component.leftLineCount()).toBe(3);
            expect(component.rightLineCount()).toBe(1);
        });
    });

    describe('inputCollapsed logic', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should expand (set to false) when it does not have both files', () => {
            // Let's set it to true first manually to verify
            component.inputCollapsed.set(true);

            // Provide only one file
            mockLeftFile.set({ content: '1' });
            mockRightFile.set(null);

            // Manually trigger effect propagation
            TestBed.flushEffects();

            expect(component.inputCollapsed()).toBeFalse();
        });

        it('onInputPanelBlur should collapse input if it has both files and blur moves outside container', () => {
            // Mock both files
            mockLeftFile.set({ content: '1' });
            mockRightFile.set({ content: '2' });
            TestBed.flushEffects();

            // Ensure it starts expanded
            component.inputCollapsed.set(false);

            const mockContainer = document.createElement('div');
            const mockRelatedTarget = document.createElement('button'); // Element completely outside container

            const blurEvent = {
                currentTarget: mockContainer,
                relatedTarget: mockRelatedTarget
            } as unknown as FocusEvent;

            component.onInputPanelBlur(blurEvent);
            expect(component.inputCollapsed()).toBeTrue();
        });

        it('onInputPanelBlur should NOT collapse if blur moves INSIDE the container', () => {
            mockLeftFile.set({ content: '1' });
            mockRightFile.set({ content: '2' });
            TestBed.flushEffects();

            component.inputCollapsed.set(false);

            const mockContainer = document.createElement('div');
            const mockRelatedTarget = document.createElement('button');
            mockContainer.appendChild(mockRelatedTarget); // Rendered inside container

            // Overriding contains mechanism for pure JS node check
            spyOn(mockContainer, 'contains').and.returnValue(true);

            const blurEvent = {
                currentTarget: mockContainer,
                relatedTarget: mockRelatedTarget
            } as unknown as FocusEvent;

            component.onInputPanelBlur(blurEvent);
            expect(component.inputCollapsed()).toBeFalse();
        });
    });
});
