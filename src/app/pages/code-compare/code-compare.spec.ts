import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Component, signal, WritableSignal, NO_ERRORS_SCHEMA } from '@angular/core';

import { CodeCompare } from './code-compare';
import { CodeCompareState } from './services/code-compare-state.service';
import { CodeInput } from './components/code-input/code-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';

// ── Stub child components ────────────────────────────────────────────────────
// CodeCompare is standalone and directly imports these. We replace them with
// empty stubs so that CodeInput's required inputs / effects / setTimeout don't
// interfere with the host-component tests.

@Component({ selector: 'p-code-input', standalone: true, template: '' })
class CodeInputStub {}

@Component({ selector: 'p-diff-toolbar', standalone: true, template: '' })
class DiffToolbarStub {}

@Component({ selector: 'p-diff-summary', standalone: true, template: '' })
class DiffSummaryStub {}

@Component({ selector: 'p-diff-viewer', standalone: true, template: '' })
class DiffViewerStub {}

@Component({ selector: 'p-diff-minimap', standalone: true, template: '' })
class DiffMinimapStub {}

// ─────────────────────────────────────────────────────────────────────────────

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
        })
            .overrideComponent(CodeCompare, {
                // Replace the real child-component imports with lightweight stubs.
                // Also add NO_ERRORS_SCHEMA here — for standalone components, schemas
                // must be declared on the component itself, not on the TestBed module.
                set: {
                    imports: [CommonModule, CodeInputStub, DiffToolbarStub, DiffSummaryStub, DiffViewerStub, DiffMinimapStub],
                    schemas: [NO_ERRORS_SCHEMA]
                }
            })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CodeCompare);
        component = fixture.componentInstance;
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
            // First, set BOTH files so hasBothFiles() becomes true, then manually collapse
            mockLeftFile.set({ content: '1' });
            mockRightFile.set({ content: '2' });
            TestBed.flushEffects();
            component.inputCollapsed.set(true);

            // Now remove one file — hasBothFiles() changes true → false, triggering the effect
            mockRightFile.set(null);
            TestBed.flushEffects();

            // Effect should have reset inputCollapsed to false
            expect(component.inputCollapsed()).toBeFalse();
        });

        it('onInputPanelBlur should collapse input if it has both files and blur moves outside container', () => {
            // Set both files so hasBothFiles() = true
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
            // Set both files so hasBothFiles() = true
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
