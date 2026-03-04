/**
 * Unit tests for CodeFormatter.
 *
 * Approach:
 *  - TestBed.runInInjectionContext() to instantiate without Monaco Editor.
 *  - jasmine.clock() for debounce/setTimeout tests.
 *  - done() callbacks for all Promise-based tests (copyCode, formatCode).
 *  - navigator.clipboard polyfilled once with a controllable spy object.
 */
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CodeFormatter } from './code-formatter';
import { LayoutService } from '@/app/layout/service/layout.service';

// ─────────────────────────────────────────────────────────────────────────────
// Clipboard polyfill — installed once, spy is reset each test in beforeEach.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Clipboard polyfill
// ─────────────────────────────────────────────────────────────────────────────
if (!navigator.clipboard) {
    (navigator as any).clipboard = { writeText: () => Promise.resolve() };
}


// ─────────────────────────────────────────────────────────────────────────────
function build() {
    const msgSvc = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    const layoutSvc = { isDarkTheme: signal(false) };
    TestBed.configureTestingModule({});
    const comp = TestBed.runInInjectionContext(() => new CodeFormatter(msgSvc, layoutSvc as any));
    return { comp, msgSvc, layoutSvc };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('CodeFormatter', () => {
    let component: CodeFormatter;
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
        it('should have selectedLanguage = html', () => expect(component.selectedLanguage()).toBe('html'));
        it('should have autoUpdate = false', () => expect(component.autoUpdate()).toBe(false));
        it('should have tabWidth = 4', () => expect(component.tabWidth()).toBe(4));
        it('should have printWidth = 80', () => expect(component.printWidth()).toBe(80));
        it('should have singleQuote = true', () => expect(component.singleQuote()).toBe(true));
        it('should have empty inputCode', () => expect(component.inputCode()).toBe(''));
        it('should have empty outputCode', () => expect(component.outputCode()).toBe(''));
        it('should expose 7 languages', () => expect(component.languages.length).toBe(7));
        it('should have isDragging = false', () => expect(component.isDragging()).toBe(false));
        it('should have inputSize = 0', () => expect(component.inputSize()).toBe(0));
        it('should have outputSize = 0', () => expect(component.outputSize()).toBe(0));
        it('should have displaySettings = false', () => expect(component.displaySettings()).toBe(false));
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. getLanguageLabel()
    // ─────────────────────────────────────────────────────────────────────────
    describe('getLanguageLabel()', () => {
        const cases: [string, string][] = [
            ['typescript', 'JavaScript / TypeScript'],
            ['json', 'JSON'],
            ['html', 'HTML'],
            ['css', 'CSS'],
            ['markdown', 'Markdown'],
            ['xml', 'XML'],
            ['sql', 'SQL']
        ];
        for (const [code, label] of cases) {
            it(`'${code}' → '${label}'`, () => {
                component.selectedLanguage.set(code);
                expect(component.getLanguageLabel()).toBe(label);
            });
        }
        it('returns "Data" for unknown code', () => {
            component.selectedLanguage.set('cobol');
            expect(component.getLanguageLabel()).toBe('Data');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. onLanguageChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onLanguageChange()', () => {
        it('updates inputEditorOptions.language', () => {
            component.selectedLanguage.set('css');
            component.onLanguageChange();
            expect(component.inputEditorOptions().language).toBe('css');
        });
        it('updates outputEditorOptions.language', () => {
            component.selectedLanguage.set('json');
            component.onLanguageChange();
            expect(component.outputEditorOptions().language).toBe('json');
        });
        it('calls formatCode() when autoUpdate=true', () => {
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onLanguageChange();
            expect(component.formatCode).toHaveBeenCalled();
        });
        it('does NOT call formatCode() when autoUpdate=false', () => {
            spyOn(component, 'formatCode');
            component.autoUpdate.set(false);
            component.onLanguageChange();
            expect(component.formatCode).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. onFormatConfigChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onFormatConfigChange()', () => {
        it('calls formatCode() when autoUpdate=true', () => {
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onFormatConfigChange();
            expect(component.formatCode).toHaveBeenCalled();
        });
        it('does NOT call formatCode() when autoUpdate=false', () => {
            spyOn(component, 'formatCode');
            component.autoUpdate.set(false);
            component.onFormatConfigChange();
            expect(component.formatCode).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. onAutoUpdateChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onAutoUpdateChange()', () => {
        it('calls formatCode() when autoUpdate=true', () => {
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onAutoUpdateChange();
            expect(component.formatCode).toHaveBeenCalled();
        });
        it('does NOT call formatCode() when autoUpdate=false', () => {
            spyOn(component, 'formatCode');
            component.autoUpdate.set(false);
            component.onAutoUpdateChange();
            expect(component.formatCode).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. onInputChange()
    // ─────────────────────────────────────────────────────────────────────────
    describe('onInputChange()', () => {
        afterEach(() => jasmine.clock().uninstall());

        it('updates inputCode', () => {
            component.onInputChange('hello');
            expect(component.inputCode()).toBe('hello');
        });
        it('updates inputSize', () => {
            component.onInputChange('abc');
            expect(component.inputSize()).toBe(3);
        });
        it('schedules formatCode() after 500ms when autoUpdate=true', () => {
            jasmine.clock().install();
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onInputChange('code');
            expect(component.formatCode).not.toHaveBeenCalled();
            jasmine.clock().tick(500);
            expect(component.formatCode).toHaveBeenCalledTimes(1);
        });
        it('debounces rapid input calls', () => {
            jasmine.clock().install();
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.onInputChange('a');
            jasmine.clock().tick(200);
            component.onInputChange('ab');
            jasmine.clock().tick(200);
            component.onInputChange('abc');
            jasmine.clock().tick(500);
            expect(component.formatCode).toHaveBeenCalledTimes(1);
        });
        it('does NOT schedule formatCode() when autoUpdate=false', () => {
            jasmine.clock().install();
            spyOn(component, 'formatCode');
            component.autoUpdate.set(false);
            component.onInputChange('code');
            jasmine.clock().tick(600);
            expect(component.formatCode).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Font size
    // ─────────────────────────────────────────────────────────────────────────
    describe('increaseFontSize()', () => {
        it('increases both fontSizes by 1', () => {
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
        it('decreases both fontSizes by 1', () => {
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
    // 8. clearInput() / clearOutput()
    // ─────────────────────────────────────────────────────────────────────────
    describe('clearInput()', () => {
        it('resets inputCode and inputSize', () => {
            component.inputCode.set('hello');
            component.inputSize.set(5);
            component.clearInput();
            expect(component.inputCode()).toBe('');
            expect(component.inputSize()).toBe(0);
        });
        it('calls formatCode() when autoUpdate=true', () => {
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            component.autoUpdate.set(true);
            component.clearInput();
            expect(component.formatCode).toHaveBeenCalled();
        });
        it('does NOT call formatCode() when autoUpdate=false', () => {
            spyOn(component, 'formatCode');
            component.autoUpdate.set(false);
            component.clearInput();
            expect(component.formatCode).not.toHaveBeenCalled();
        });
    });
    describe('clearOutput()', () => {
        it('resets outputCode and outputSize', () => {
            component.outputCode.set('formatted');
            component.outputSize.set(9);
            component.clearOutput();
            expect(component.outputCode()).toBe('');
            expect(component.outputSize()).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. copyCode() — uses done() callback for Promise resolution
    // ─────────────────────────────────────────────────────────────────────────
    describe('copyCode()', () => {
        let clipboardSpy: jasmine.Spy;
        beforeEach(() => {
            clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);
        });

        it('copies inputCode when isInput=true', (done) => {
            component.inputCode.set('input content');
            component.copyCode(true);
            Promise.resolve().then(() => {
                expect(clipboardSpy).toHaveBeenCalledWith('input content');
                done();
            });
        });
        it('copies outputCode when isInput=false', (done) => {
            component.outputCode.set('output content');
            component.copyCode(false);
            Promise.resolve().then(() => {
                expect(clipboardSpy).toHaveBeenCalledWith('output content');
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
            component.outputCode.set('code');
            component.copyCode(false);
            // Wait 2 microtasks: clipboard writeText resolves, then .then() callback runs
            Promise.resolve().then(() => Promise.resolve()).then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'success', summary: 'Success' })
                );
                done();
            });
        });
        it('shows error toast when clipboard fails', (done) => {
            clipboardSpy.and.returnValue(Promise.reject('denied'));
            component.outputCode.set('code');
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
    // 10. formatCode() — empty input guard
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatCode() — empty input', () => {
        it('sets outputCode="" and outputSize=0', (done) => {
            component.inputCode.set('   ');
            component.outputCode.set('old');
            component.outputSize.set(99);
            component.formatCode().then(() => {
                expect(component.outputCode()).toBe('');
                expect(component.outputSize()).toBe(0);
                done();
            });
        });
        it('does NOT call messageService', (done) => {
            component.inputCode.set('');
            component.formatCode().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 11. formatCode() — SQL path
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatCode() — SQL path', () => {
        beforeEach(() => {
            component.selectedLanguage.set('sql');
            component.inputCode.set('select * from t');
        });
        it('produces formatted SQL', (done) => {
            component.formatCode().then(() => {
                expect(component.outputCode().toUpperCase()).toContain('SELECT');
                done();
            });
        });
        it('sets outputSize > 0', (done) => {
            component.formatCode().then(() => {
                expect(component.outputSize()).toBeGreaterThan(0);
                done();
            });
        });
        it('shows success toast when autoUpdate=false', (done) => {
            component.autoUpdate.set(false);
            component.formatCode().then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
                done();
            });
        });
        it('does NOT show toast when autoUpdate=true', (done) => {
            component.autoUpdate.set(true);
            component.formatCode().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 12. formatCode() — Prettier path (mocked)
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatCode() — Prettier path', () => {
        let prettierSpy: jasmine.Spy;
        beforeEach(() => {
            prettierSpy = spyOn(component as any, 'callPrettierFormat').and.returnValue(Promise.resolve('// ok\n'));
        });

        const parserCases: [string, string, string][] = [
            ['typescript', 'const x=1', 'babel-ts'],
            ['javascript', 'var x=1', 'babel-ts'],
            ['json', '{"a":1}', 'json'],
            ['html', '<div></div>', 'html'],
            ['css', 'body{margin:0}', 'css'],
            ['markdown', '# h', 'markdown'],
            ['xml', '<r/>', 'xml']
        ];

        for (const [lang, code, parser] of parserCases) {
            it(`calls prettier with parser='${parser}' for '${lang}'`, (done) => {
                component.selectedLanguage.set(lang);
                component.inputCode.set(code);
                component.formatCode().then(() => {
                    expect(prettierSpy).toHaveBeenCalledWith(code, jasmine.objectContaining({ parser }));
                    done();
                });
            });
        }

        it('sets outputCode to formatted result', (done) => {
            component.selectedLanguage.set('typescript');
            component.inputCode.set('const x=1');
            component.formatCode().then(() => {
                expect(component.outputCode()).toBe('// ok\n');
                done();
            });
        });

        it('sets outputSize > 0', (done) => {
            component.selectedLanguage.set('typescript');
            component.inputCode.set('const x=1');
            component.formatCode().then(() => {
                expect(component.outputSize()).toBeGreaterThan(0);
                done();
            });
        });

        it('shows success toast when autoUpdate=false', (done) => {
            component.selectedLanguage.set('typescript');
            component.inputCode.set('const x=1');
            component.autoUpdate.set(false);
            component.formatCode().then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'success', detail: 'Code formatted!' })
                );
                done();
            });
        });

        it('does NOT show toast when autoUpdate=true', (done) => {
            component.selectedLanguage.set('typescript');
            component.inputCode.set('const x=1');
            component.autoUpdate.set(true);
            component.formatCode().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });

        it('passes tabWidth, printWidth, useTabs, singleQuote to prettier', (done) => {
            component.selectedLanguage.set('typescript');
            component.inputCode.set('let a=1');
            component.tabWidth.set(2);
            component.printWidth.set(120);
            component.useTabs.set(true);
            component.singleQuote.set(false);
            component.formatCode().then(() => {
                expect(prettierSpy).toHaveBeenCalledWith(
                    jasmine.any(String),
                    jasmine.objectContaining({ tabWidth: 2, printWidth: 120, useTabs: true, singleQuote: false })
                );
                done();
            });
        });

        it('passes multiple plugins for html when formatCssJs=true', (done) => {
            component.selectedLanguage.set('html');
            component.inputCode.set('<div></div>');
            component.formatCssJs.set(true);
            component.formatCode().then(() => {
                const args = prettierSpy.calls.mostRecent().args[1];
                expect(args.plugins.length).toBeGreaterThan(1);
                done();
            });
        });

        it('passes only htmlPlugin when formatCssJs=false', (done) => {
            component.selectedLanguage.set('html');
            component.inputCode.set('<div></div>');
            component.formatCssJs.set(false);
            component.formatCode().then(() => {
                const args = prettierSpy.calls.mostRecent().args[1];
                expect(args.plugins.length).toBe(1);
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 13. formatCode() — error path
    // ─────────────────────────────────────────────────────────────────────────
    describe('formatCode() — error path', () => {
        it('shows error toast when prettier throws (autoUpdate=false)', (done) => {
            spyOn(component as any, 'callPrettierFormat').and.returnValue(Promise.reject(new Error('Syntax error')));
            component.selectedLanguage.set('typescript');
            component.inputCode.set('invalid!!!');
            component.autoUpdate.set(false);
            component.formatCode().then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'error', summary: 'Formatting Error' })
                );
                done();
            });
        });

        it('does NOT show error when autoUpdate=true', (done) => {
            spyOn(component as any, 'callPrettierFormat').and.returnValue(Promise.reject(new Error('oops')));
            component.selectedLanguage.set('typescript');
            component.inputCode.set('bad!!!');
            component.autoUpdate.set(true);
            component.formatCode().then(() => {
                expect(mockMessageService.add).not.toHaveBeenCalled();
                done();
            });
        });

        it('shows error toast for unsupported language', (done) => {
            component.selectedLanguage.set('unknown-lang');
            component.inputCode.set('some code');
            component.autoUpdate.set(false);
            component.formatCode().then(() => {
                expect(mockMessageService.add).toHaveBeenCalledWith(
                    jasmine.objectContaining({ severity: 'error', summary: 'Formatting Error' })
                );
                done();
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 14. detectLanguageFromFile()
    // ─────────────────────────────────────────────────────────────────────────
    describe('detectLanguageFromFile()', () => {
        const cases: [string, string][] = [
            ['app.ts', 'typescript'],
            ['app.js', 'typescript'],
            ['app.jsx', 'typescript'],
            ['app.tsx', 'typescript'],
            ['data.json', 'json'],
            ['index.html', 'html'],
            ['index.htm', 'html'],
            ['styles.css', 'css'],
            ['styles.scss', 'css'],
            ['styles.less', 'css'],
            ['README.md', 'markdown'],
            ['config.xml', 'xml'],
            ['query.sql', 'sql']
        ];

        for (const [filename, lang] of cases) {
            it(`'${filename}' → '${lang}'`, () => {
                spyOn(component, 'onLanguageChange');
                component.detectLanguageFromFile(filename);
                expect(component.selectedLanguage()).toBe(lang);
                expect(component.onLanguageChange).toHaveBeenCalled();
            });
        }

        it('still calls onLanguageChange() for unknown extension', () => {
            spyOn(component, 'onLanguageChange');
            component.detectLanguageFromFile('archive.zip');
            expect(component.onLanguageChange).toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 15. downloadCode()
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

        it('shows warn toast when output is empty', () => {
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
            component.outputCode.set('code');
            component.selectedLanguage.set('typescript');
            component.downloadCode(false);
            expect(anchorMock.click).toHaveBeenCalled();
        });
        it('revokes object URL after download', () => {
            component.outputCode.set('code');
            component.selectedLanguage.set('typescript');
            component.downloadCode(false);
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
        });
        it('shows success toast after download', () => {
            component.outputCode.set('content');
            component.selectedLanguage.set('html');
            component.downloadCode(false);
            expect(mockMessageService.add).toHaveBeenCalledWith(
                jasmine.objectContaining({ severity: 'success', detail: 'File downloaded successfully!' })
            );
        });
        it('uses raw-code prefix when isInput=true', () => {
            component.inputCode.set('raw code');
            component.selectedLanguage.set('css');
            component.downloadCode(true);
            expect(anchorMock.download).toContain('raw-code');
        });
        it('uses formatted-code prefix when isInput=false', () => {
            component.outputCode.set('formatted');
            component.selectedLanguage.set('css');
            component.downloadCode(false);
            expect(anchorMock.download).toContain('formatted-code');
        });

        const extCases: [string, string][] = [
            ['typescript', '.ts'], ['json', '.json'], ['html', '.html'],
            ['css', '.css'], ['markdown', '.md'], ['xml', '.xml'], ['sql', '.sql']
        ];
        for (const [lang, ext] of extCases) {
            it(`uses '${ext}' for '${lang}'`, () => {
                component.outputCode.set('x');
                component.selectedLanguage.set(lang);
                component.downloadCode(false);
                expect(anchorMock.download).toContain(ext);
            });
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 16. loadSample()
    // ─────────────────────────────────────────────────────────────────────────
    describe('loadSample()', () => {
        beforeEach(() => {
            spyOn(component, 'formatCode').and.returnValue(Promise.resolve());
            spyOn(component, 'onLanguageChange');
        });

        it('sets selectedLanguage to typescript', () => {
            component.loadSample();
            expect(component.selectedLanguage()).toBe('typescript');
        });
        it('sets non-empty inputCode', () => {
            component.loadSample();
            expect(component.inputCode().length).toBeGreaterThan(0);
        });
        it('updates inputSize', () => {
            component.loadSample();
            expect(component.inputSize()).toBeGreaterThan(0);
        });
        it('closes settings drawer', () => {
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
        it('calls formatCode() when autoUpdate=true', () => {
            component.autoUpdate.set(true);
            component.loadSample();
            expect(component.formatCode).toHaveBeenCalled();
        });
        it('does NOT call formatCode() when autoUpdate=false', () => {
            component.autoUpdate.set(false);
            component.loadSample();
            expect(component.formatCode).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 17. Drag & Drop
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
            const file = new File(['x'], 'test.ts');
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
            const file = new File(['content'], 'script.js');
            const target = { files: [file], value: 'path' };
            component.onFileSelected({ target });
            expect(component.handleFile).toHaveBeenCalledWith(file);
            expect(target.value).toBe('');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 18. Dark theme effect
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
    // Editor cursor callbacks
    // ─────────────────────────────────────────────────────────────────────────
    describe('Editor cursor callbacks', () => {
        it('onInputEditorInit updates inputCursor', () => {
            const ed = { onDidChangeCursorPosition: jasmine.createSpy().and.callFake((cb: Function) => cb({ position: { lineNumber: 3, column: 7 } })) };
            component.onInputEditorInit(ed);
            expect(component.inputCursor()).toEqual({ line: 3, col: 7 });
        });
        it('onOutputEditorInit updates outputCursor', () => {
            const ed = { onDidChangeCursorPosition: jasmine.createSpy().and.callFake((cb: Function) => cb({ position: { lineNumber: 5, column: 2 } })) };
            component.onOutputEditorInit(ed);
            expect(component.outputCursor()).toEqual({ line: 5, col: 2 });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // undoInput()
    // ─────────────────────────────────────────────────────────────────────────
    describe('undoInput()', () => {
        it('calls trigger(undo) on editor instance', () => {
            const ed = { trigger: jasmine.createSpy(), onDidChangeCursorPosition: jasmine.createSpy() };
            component.onInputEditorInit(ed as any);
            component.undoInput();
            expect(ed.trigger).toHaveBeenCalledWith('keyboard', 'undo', null);
        });
        it('does not throw when no editor is set', () => {
            expect(() => component.undoInput()).not.toThrow();
        });
    });
});
