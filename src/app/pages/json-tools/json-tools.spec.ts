/**
 * Unit tests for JsonTools.
 *
 * Approach:
 *  - TestBed.runInInjectionContext() to instantiate without Monaco Editor DOM.
 *  - jasmine.clock() for debounce/setTimeout tests.
 *  - done() callbacks for all Promise-based tests (copyCode, formatJson).
 *  - navigator.clipboard polyfilled once with a controllable spy object.
 *  - callPrettierFormat() protected wrapper is spied on to avoid touching sealed Prettier ESM.
 */
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { JsonTools } from './json-tools';
import { LayoutService } from '@/app/layout/service/layout.service';

// ─────────────────────────────────────────────────────────────────────────────
// Clipboard polyfill
// ─────────────────────────────────────────────────────────────────────────────
if (!navigator.clipboard) {
    (navigator as any).clipboard = { writeText: () => Promise.resolve() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suppress console.error — error-path tests intentionally trigger component
// error handlers which call console.error internally. Silencing keeps the
// Karma output clean and avoids a non-zero exit code.
// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
    spyOn(console, 'error');
});

// ─────────────────────────────────────────────────────────────────────────────
function build() {
    const msgSvc = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    const layoutSvc = { isDarkTheme: signal(false) };
    TestBed.configureTestingModule({});
    const comp = TestBed.runInInjectionContext(() => new JsonTools(msgSvc, layoutSvc as any));
    return { comp, msgSvc, layoutSvc };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('JsonTools', () => {
    let component: JsonTools;
    let mockMessageService: jasmine.SpyObj<MessageService>;
    let mockLayoutService: { isDarkTheme: ReturnType<typeof signal<boolean>> };

    beforeEach(() => {
        const ctx = build();
        component = ctx.comp;
        mockMessageService = ctx.msgSvc as any;
        mockLayoutService = ctx.layoutSvc;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Initialisation
    // ─────────────────────────────────────────────────────────────────────────
    describe('Initialisation', () => {
        it('should have empty inputCode', () => expect(component.inputCode()).toBe(''));
        it('should have empty outputCode', () => expect(component.outputCode()).toBe(''));
        it('should have autoUpdate = false', () => expect(component.autoUpdate()).toBe(false));
        it('should have displaySettings = false', () => expect(component.displaySettings()).toBe(false));
        it('should have displayTransformSettings = false', () => expect(component.displayTransformSettings()).toBe(false));
        it('should have tabWidth = 4', () => expect(component.tabWidth()).toBe(4));
        it('should have useTabs = false', () => expect(component.useTabs()).toBe(false));
        it('should have isDragging = false', () => expect(component.isDragging()).toBe(false));
        it('should have inputSize = 0', () => expect(component.inputSize()).toBe(0));
        it('should have outputSize = 0', () => expect(component.outputSize()).toBe(0));
        it('should have transformFn = "return data;"', () => expect(component.transformFn()).toBe('return data;'));
        it('should expose 3 tabSizeOptions', () => expect(component.tabSizeOptions.length).toBe(3));
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. onFormatConfigChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onFormatConfigChange()', () => {
        it('calls formatJson() when autoUpdate=true', () => {
            spyOn(component, 'formatJson').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onFormatConfigChange();
            expect(component.formatJson).toHaveBeenCalled();
        });
        it('does NOT call formatJson() when autoUpdate=false', () => {
            spyOn(component, 'formatJson');
            component.autoUpdate.set(false);
            component.onFormatConfigChange();
            expect(component.formatJson).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. onAutoUpdateChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onAutoUpdateChange()', () => {
        it('calls formatJson() when autoUpdate=true', () => {
            spyOn(component, 'formatJson').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onAutoUpdateChange();
            expect(component.formatJson).toHaveBeenCalled();
        });
        it('does NOT call formatJson() when autoUpdate=false', () => {
            spyOn(component, 'formatJson');
            component.autoUpdate.set(false);
            component.onAutoUpdateChange();
            expect(component.formatJson).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. onInputChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onInputChange()', () => {
        afterEach(() => jasmine.clock().uninstall());

        it('updates inputCode', () => {
            component.onInputChange('{"a":1}');
            expect(component.inputCode()).toBe('{"a":1}');
        });
        it('updates inputSize based on byte length', () => {
            component.onInputChange('abc');
            expect(component.inputSize()).toBe(3);
        });
        it('schedules formatJson() after 500ms when autoUpdate=true', () => {
            jasmine.clock().install();
            spyOn(component, 'formatJson').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onInputChange('{"x":1}');
            expect(component.formatJson).not.toHaveBeenCalled();
            jasmine.clock().tick(500);
            expect(component.formatJson).toHaveBeenCalledTimes(1);
        });
        it('debounces rapid input calls', () => {
            jasmine.clock().install();
            spyOn(component, 'formatJson').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onInputChange('a');
            jasmine.clock().tick(200);
            component.onInputChange('ab');
            jasmine.clock().tick(200);
            component.onInputChange('abc');
            jasmine.clock().tick(500);
            expect(component.formatJson).toHaveBeenCalledTimes(1);
        });
        it('does NOT schedule formatJson() when autoUpdate=false', () => {
            jasmine.clock().install();
            spyOn(component, 'formatJson');
            component.autoUpdate.set(false);
            component.onInputChange('code');
            jasmine.clock().tick(600);
            expect(component.formatJson).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. increaseFontSize() / decreaseFontSize()
    // ─────────────────────────────────────────────────────────────────────────
    describe('increaseFontSize()', () => {
        it('increases both editor fontSizes by 1', () => {
            const before = component.inputEditorOptions().fontSize;
            component.increaseFontSize();
            expect(component.inputEditorOptions().fontSize).toBe(before + 1);
            expect(component.outputEditorOptions().fontSize).toBe(before + 1);
        });
        it('does not exceed 30', () => {
            component.inputEditorOptions.set({ ...component.inputEditorOptions(), fontSize: 30 });
            component.outputEditorOptions.set({ ...component.outputEditorOptions(), fontSize: 30 });
            component.increaseFontSize();
            expect(component.inputEditorOptions().fontSize).toBe(30);
        });
    });

    describe('decreaseFontSize()', () => {
        it('decreases both editor fontSizes by 1', () => {
            const before = component.inputEditorOptions().fontSize;
            component.decreaseFontSize();
            expect(component.inputEditorOptions().fontSize).toBe(before - 1);
            expect(component.outputEditorOptions().fontSize).toBe(before - 1);
        });
        it('does not go below 8', () => {
            component.inputEditorOptions.set({ ...component.inputEditorOptions(), fontSize: 8 });
            component.outputEditorOptions.set({ ...component.outputEditorOptions(), fontSize: 8 });
            component.decreaseFontSize();
            expect(component.inputEditorOptions().fontSize).toBe(8);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. clearInput() / clearOutput()
    // ─────────────────────────────────────────────────────────────────────────
    describe('clearInput()', () => {
        it('resets inputCode and inputSize', () => {
            component.inputCode.set('{"a":1}');
            component.inputSize.set(7);
            component.clearInput();
            expect(component.inputCode()).toBe('');
            expect(component.inputSize()).toBe(0);
        });
        it('calls formatJson() when autoUpdate=true', () => {
            spyOn(component, 'formatJson').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.clearInput();
            expect(component.formatJson).toHaveBeenCalled();
        });
        it('does NOT call formatJson() when autoUpdate=false', () => {
            spyOn(component, 'formatJson');
            component.autoUpdate.set(false);
            component.clearInput();
            expect(component.formatJson).not.toHaveBeenCalled();
        });
    });

    describe('clearOutput()', () => {
        it('resets outputCode and outputSize', () => {
            component.outputCode.set('{"formatted":true}');
            component.outputSize.set(18);
            component.clearOutput();
            expect(component.outputCode()).toBe('');
            expect(component.outputSize()).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. copyCode() — Promise-based, uses done() callbacks
    // ─────────────────────────────────────────────────────────────────────────
    describe('copyCode()', () => {
        let clipboardSpy: jasmine.Spy;
        beforeEach(() => {
            clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);
        });

        it('copies inputCode when isInput=true', (done) => {
            component.inputCode.set('{"input":true}');
            component.copyCode(true);
            Promise.resolve().then(() => {
                expect(clipboardSpy).toHaveBeenCalledWith('{"input":true}');
                done();
            });
        });
        it('copies outputCode when isInput=false', (done) => {
            component.outputCode.set('{"output":true}');
            component.copyCode(false);
            Promise.resolve().then(() => {
                expect(clipboardSpy).toHaveBeenCalledWith('{"output":true}');
                done();
            });
        });
        it('does NOT call clipboard API when content is empty', (done) => {
            component.inputCode.set('');
            component.copyCode(true);
            Promise.resolve().then(() => {
                expect(clipboardSpy).not.toHaveBeenCalled();
                done();
            });
        });
        it('shows success toast after copy', (done) => {
            component.outputCode.set('{"data":1}');
            component.copyCode(false);
            Promise.resolve().then(() => Promise.resolve()).then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'success', summary: 'Success' })
                );
                done();
            });
        });
        it('shows error toast when clipboard fails', (done) => {
            clipboardSpy.and.returnValue(Promise.reject('denied'));
            component.outputCode.set('{"x":1}');
            component.copyCode(false);
            Promise.resolve().then(() => Promise.resolve()).then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'error', summary: 'Error' })
                );
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. validateJson()
    // ─────────────────────────────────────────────────────────────────────────
    describe('validateJson()', () => {
        it('returns false and clears output for blank input', () => {
            component.inputCode.set('   ');
            component.outputCode.set('old');
            component.outputSize.set(99);
            const result = component.validateJson();
            expect(result).toBe(false);
            expect(component.outputCode()).toBe('');
            expect(component.outputSize()).toBe(0);
        });
        it('returns true for valid JSON', () => {
            component.inputCode.set('{"a":1}');
            expect(component.validateJson()).toBe(true);
        });
        it('shows success toast for valid JSON when autoUpdate=false', () => {
            component.inputCode.set('[1,2,3]');
            component.autoUpdate.set(false);
            component.validateJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'success', summary: 'Valid JSON' })
            );
        });
        it('returns false for invalid JSON', () => {
            component.inputCode.set('{bad json}');
            expect(component.validateJson()).toBe(false);
        });
        it('shows error toast for invalid JSON when autoUpdate=false', () => {
            component.inputCode.set('{bad json}');
            component.autoUpdate.set(false);
            component.validateJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'error', summary: 'Invalid JSON' })
            );
        });
        it('does NOT show toast when autoUpdate=true (valid or invalid)', () => {
            component.inputCode.set('{bad}');
            component.autoUpdate.set(true);
            component.validateJson();
            expect(mockMessageService.add).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. formatJson() — empty input guard
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatJson() — empty input', () => {
        it('clears output for blank input', (done) => {
            component.inputCode.set('   ');
            component.outputCode.set('old');
            component.outputSize.set(99);
            component.formatJson().then(() => {
                expect(component.outputCode()).toBe('');
                expect(component.outputSize()).toBe(0);
                done();
            });
        });
        it('does NOT call messageService for blank input', (done) => {
            component.inputCode.set('');
            component.formatJson().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 10. formatJson() — Prettier path (mocked via wrapper)
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatJson() — Prettier path', () => {
        let prettierSpy: jasmine.Spy;

        beforeEach(() => {
            prettierSpy = spyOn(component as any, 'callPrettierFormat').and.returnValue(Promise.resolve('{\n  "a": 1\n}\n'));
        });

        it('calls callPrettierFormat with parser=json', (done) => {
            component.inputCode.set('{"a":1}');
            component.formatJson().then(() => {
                expect(prettierSpy).toHaveBeenCalledWith('{"a":1}', jasmine.objectContaining({ parser: 'json' }));
                done();
            });
        });

        it('passes tabWidth to prettier', (done) => {
            component.inputCode.set('{"a":1}');
            component.tabWidth.set(2);
            component.formatJson().then(() => {
                expect(prettierSpy).toHaveBeenCalledWith(jasmine.any(String), jasmine.objectContaining({ tabWidth: 2 }));
                done();
            });
        });

        it('passes useTabs to prettier', (done) => {
            component.inputCode.set('{"a":1}');
            component.useTabs.set(true);
            component.formatJson().then(() => {
                expect(prettierSpy).toHaveBeenCalledWith(jasmine.any(String), jasmine.objectContaining({ useTabs: true }));
                done();
            });
        });

        it('sets outputCode from Prettier result', (done) => {
            component.inputCode.set('{"a":1}');
            component.formatJson().then(() => {
                expect(component.outputCode()).toBe('{\n  "a": 1\n}\n');
                done();
            });
        });

        it('sets outputSize > 0', (done) => {
            component.inputCode.set('{"a":1}');
            component.formatJson().then(() => {
                expect(component.outputSize()).toBeGreaterThan(0);
                done();
            });
        });

        it('shows success toast when autoUpdate=false', (done) => {
            component.inputCode.set('{"a":1}');
            component.autoUpdate.set(false);
            component.formatJson().then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'success', detail: 'JSON formatted!' })
                );
                done();
            });
        });

        it('does NOT show toast when autoUpdate=true', (done) => {
            component.inputCode.set('{"a":1}');
            component.autoUpdate.set(true);
            component.formatJson().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 11. formatJson() — error path
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatJson() — error path', () => {
        it('shows error toast when Prettier throws (autoUpdate=false)', (done) => {
            spyOn(component as any, 'callPrettierFormat').and.returnValue(Promise.reject(new Error('Syntax error')));
            component.inputCode.set('{bad json}');
            component.autoUpdate.set(false);
            component.formatJson().then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'error', summary: 'Formatting Error' })
                );
                done();
            });
        });

        it('does NOT show error when autoUpdate=true', (done) => {
            spyOn(component as any, 'callPrettierFormat').and.returnValue(Promise.reject(new Error('oops')));
            component.inputCode.set('{bad}');
            component.autoUpdate.set(true);
            component.formatJson().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 12. minifyJson()
    // ─────────────────────────────────────────────────────────────────────────
    describe('minifyJson()', () => {
        it('clears output for blank input', () => {
            component.inputCode.set('  ');
            component.outputCode.set('old');
            component.minifyJson();
            expect(component.outputCode()).toBe('');
            expect(component.outputSize()).toBe(0);
        });
        it('minifies formatted JSON to single line', () => {
            component.inputCode.set('{\n  "a": 1,\n  "b": 2\n}');
            component.minifyJson();
            expect(component.outputCode()).toBe('{"a":1,"b":2}');
        });
        it('sets outputSize > 0 for valid input', () => {
            component.inputCode.set('{"a":1}');
            component.minifyJson();
            expect(component.outputSize()).toBeGreaterThan(0);
        });
        it('shows success toast when autoUpdate=false', () => {
            component.inputCode.set('{"a":1}');
            component.autoUpdate.set(false);
            component.minifyJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'success', detail: 'JSON minified!' })
            );
        });
        it('does NOT show toast when autoUpdate=true', () => {
            component.inputCode.set('{"a":1}');
            component.autoUpdate.set(true);
            component.minifyJson();
            expect(mockMessageService.add).not.toHaveBeenCalled();
        });
        it('shows error toast for invalid JSON when autoUpdate=false', () => {
            component.inputCode.set('{bad json}');
            component.autoUpdate.set(false);
            component.minifyJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'error', summary: 'Minification Error' })
            );
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 13. transformJson()
    // ─────────────────────────────────────────────────────────────────────────
    describe('transformJson()', () => {
        it('clears output for blank input', () => {
            component.inputCode.set('  ');
            component.outputCode.set('old');
            component.transformJson();
            expect(component.outputCode()).toBe('');
            expect(component.outputSize()).toBe(0);
        });
        it('applies the transform function to parsed JSON', () => {
            component.inputCode.set('{"name":"Alice","age":30}');
            component.transformFn.set('return { greeting: "Hello " + data.name }');
            component.transformJson();
            expect(component.outputCode()).toContain('"greeting"');
            expect(component.outputCode()).toContain('Hello Alice');
        });
        it('sets outputSize > 0 after successful transform', () => {
            component.inputCode.set('{"a":1}');
            component.transformFn.set('return data');
            component.transformJson();
            expect(component.outputSize()).toBeGreaterThan(0);
        });
        it('shows success toast when autoUpdate=false', () => {
            component.inputCode.set('{"a":1}');
            component.transformFn.set('return data');
            component.autoUpdate.set(false);
            component.transformJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'success', detail: 'JSON transformed!' })
            );
        });
        it('closes the transform drawer after success', () => {
            component.inputCode.set('{"a":1}');
            component.transformFn.set('return data');
            component.displayTransformSettings.set(true);
            component.transformJson();
            expect(component.displayTransformSettings()).toBe(false);
        });
        it('shows error toast for invalid JSON input', () => {
            component.inputCode.set('{bad json}');
            component.autoUpdate.set(false);
            component.transformJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'error', summary: 'Transform Error' })
            );
        });
        it('shows error toast for invalid transform function', () => {
            component.inputCode.set('{"a":1}');
            component.transformFn.set('this is not valid JS');
            component.autoUpdate.set(false);
            component.transformJson();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'error', summary: 'Transform Error' })
            );
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 14. loadSample()
    // ─────────────────────────────────────────────────────────────────────────
    describe('loadSample()', () => {
        beforeEach(() => {
            spyOn(component, 'formatJson').and.returnValue(Promise.resolve());
        });

        it('sets non-empty inputCode with valid JSON', () => {
            component.loadSample();
            expect(() => JSON.parse(component.inputCode())).not.toThrow();
        });
        it('updates inputSize', () => {
            component.loadSample();
            expect(component.inputSize()).toBeGreaterThan(0);
        });
        it('closes the settings drawer', () => {
            component.displaySettings.set(true);
            component.loadSample();
            expect(component.displaySettings()).toBe(false);
        });
        it('shows info toast', () => {
            component.loadSample();
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'info', summary: 'Sample Loaded' })
            );
        });
        it('calls formatJson() when autoUpdate=true', () => {
            component.autoUpdate.set(true);
            component.loadSample();
            expect(component.formatJson).toHaveBeenCalled();
        });
        it('does NOT call formatJson() when autoUpdate=false', () => {
            component.autoUpdate.set(false);
            component.loadSample();
            expect(component.formatJson).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 15. Drag & Drop
    // ─────────────────────────────────────────────────────────────────────────
    describe('Drag & Drop', () => {
        it('onDragOver calls preventDefault and stopPropagation', () => {
            const e = new DragEvent('dragover');
            spyOn(e, 'preventDefault');
            spyOn(e, 'stopPropagation');
            component.onDragOver(e);
            expect(e.preventDefault).toHaveBeenCalled();
            expect(e.stopPropagation).toHaveBeenCalled();
        });

        it('onDragEnter sets isDragging = true', () => {
            const e = new DragEvent('dragenter');
            spyOn(e, 'preventDefault');
            spyOn(e, 'stopPropagation');
            component.onDragEnter(e);
            expect(component.isDragging()).toBe(true);
        });

        it('onDragLeave outside bounds sets isDragging = false', () => {
            component.isDragging.set(true);
            const div = document.createElement('div');
            spyOn(div, 'getBoundingClientRect').and.returnValue({ left: 0, right: 100, top: 0, bottom: 100 } as DOMRect);
            const e = new DragEvent('dragleave', { clientX: 200, clientY: 200 });
            spyOn(e, 'preventDefault');
            spyOn(e, 'stopPropagation');
            Object.defineProperty(e, 'currentTarget', { value: div });
            component.onDragLeave(e);
            expect(component.isDragging()).toBe(false);
        });

        it('onDragLeave inside bounds keeps isDragging = true', () => {
            component.isDragging.set(true);
            const div = document.createElement('div');
            spyOn(div, 'getBoundingClientRect').and.returnValue({ left: 0, right: 200, top: 0, bottom: 200 } as DOMRect);
            const e = new DragEvent('dragleave', { clientX: 100, clientY: 100 });
            spyOn(e, 'preventDefault');
            spyOn(e, 'stopPropagation');
            Object.defineProperty(e, 'currentTarget', { value: div });
            component.onDragLeave(e);
            expect(component.isDragging()).toBe(true);
        });

        it('onFileDrop resets isDragging and calls handleFile', () => {
            spyOn(component, 'handleFile');
            const file = new File(['{"a":1}'], 'test.json', { type: 'application/json' });
            const dt = new DataTransfer();
            dt.items.add(file);
            const e = new DragEvent('drop', { dataTransfer: dt });
            spyOn(e, 'preventDefault');
            spyOn(e, 'stopPropagation');
            component.isDragging.set(true);
            component.onFileDrop(e);
            expect(component.isDragging()).toBe(false);
            expect(component.handleFile).toHaveBeenCalledWith(file);
        });

        it('onFileDrop with no files does NOT call handleFile', () => {
            spyOn(component, 'handleFile');
            const e = new DragEvent('drop', { dataTransfer: new DataTransfer() });
            spyOn(e, 'preventDefault');
            spyOn(e, 'stopPropagation');
            component.onFileDrop(e);
            expect(component.handleFile).not.toHaveBeenCalled();
        });

        it('onFileSelected calls handleFile and resets input value', () => {
            spyOn(component, 'handleFile');
            const file = new File(['{"a":1}'], 'data.json');
            const target = { files: [file], value: 'fakepath' };
            component.onFileSelected({ target });
            expect(component.handleFile).toHaveBeenCalledWith(file);
            expect(target.value).toBe('');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 16. downloadCode()
    // ─────────────────────────────────────────────────────────────────────────
    describe('downloadCode()', () => {
        let anchorMock: { href: string; download: string; click: jasmine.Spy };

        beforeEach(() => {
            anchorMock = { href: '', download: '', click: jasmine.createSpy('click') };
            spyOn(document, 'createElement').and.returnValue(anchorMock as any);
            spyOn(document.body, 'appendChild');
            spyOn(document.body, 'removeChild');
            spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
            spyOn(window.URL, 'revokeObjectURL');
        });

        it('shows warn toast when content is empty', () => {
            component.outputCode.set('');
            component.downloadCode(false);
            expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
        });

        it('warns when input is empty (isInput=true)', () => {
            component.inputCode.set('');
            component.downloadCode(true);
            expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
        });

        it('clicks the anchor for non-empty output', () => {
            component.outputCode.set('{"a":1}');
            component.downloadCode(false);
            expect(anchorMock.click).toHaveBeenCalled();
        });

        it('revokes object URL after download', () => {
            component.outputCode.set('{"a":1}');
            component.downloadCode(false);
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
        });

        it('shows success toast after download', () => {
            component.outputCode.set('{"a":1}');
            component.downloadCode(false);
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'success', detail: 'File downloaded successfully!' })
            );
        });

        it('uses "raw-json" prefix when isInput=true', () => {
            component.inputCode.set('{"raw":true}');
            component.downloadCode(true);
            expect(anchorMock.download).toContain('raw-json');
        });

        it('uses "processed-json" prefix when isInput=false', () => {
            component.outputCode.set('{"processed":true}');
            component.downloadCode(false);
            expect(anchorMock.download).toContain('processed-json');
        });

        it('download filename ends with .json', () => {
            component.outputCode.set('{"a":1}');
            component.downloadCode(false);
            expect(anchorMock.download).toMatch(/\.json$/);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 17. Dark theme effect
    // ─────────────────────────────────────────────────────────────────────────
    describe('LayoutService dark theme effect', () => {
        it('sets vs-dark when isDarkTheme()=true', () => {
            mockLayoutService.isDarkTheme.set(true);
            TestBed.flushEffects();
            expect(component.inputEditorOptions().theme).toBe('vs-dark');
            expect(component.outputEditorOptions().theme).toBe('vs-dark');
        });
        it('sets vs-light when isDarkTheme()=false', () => {
            mockLayoutService.isDarkTheme.set(false);
            TestBed.flushEffects();
            expect(component.inputEditorOptions().theme).toBe('vs-light');
            expect(component.outputEditorOptions().theme).toBe('vs-light');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 18. Editor cursor callbacks
    // ─────────────────────────────────────────────────────────────────────────
    describe('Editor cursor callbacks', () => {
        it('onInputEditorInit updates inputCursor on cursor change', () => {
            const ed = {
                onDidChangeCursorPosition: jasmine.createSpy().and.callFake((cb: Function) => cb({ position: { lineNumber: 5, column: 12 } }))
            };
            component.onInputEditorInit(ed);
            expect(component.inputCursor()).toEqual({ line: 5, col: 12 });
        });
        it('onOutputEditorInit updates outputCursor on cursor change', () => {
            const ed = {
                onDidChangeCursorPosition: jasmine.createSpy().and.callFake((cb: Function) => cb({ position: { lineNumber: 3, column: 4 } }))
            };
            component.onOutputEditorInit(ed);
            expect(component.outputCursor()).toEqual({ line: 3, col: 4 });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 19. undoInput()
    // ─────────────────────────────────────────────────────────────────────────
    describe('undoInput()', () => {
        it('calls trigger(undo) on editor instance', () => {
            const ed = { trigger: jasmine.createSpy(), onDidChangeCursorPosition: jasmine.createSpy() };
            component.onInputEditorInit(ed as any);
            component.undoInput();
            expect(ed.trigger).toHaveBeenCalledWith('keyboard', 'undo', null);
        });
        it('does not throw when no editor is initialised', () => {
            expect(() => component.undoInput()).not.toThrow();
        });
    });
});
