import { TestBed } from '@angular/core/testing';
import { CodeCompareState } from './code-compare-state.service';
import { DiffEngine } from './diff-engine.service';
import { SyntaxHighlight } from './syntax-highlight.service';
import { FileContent, DEFAULT_OPTIONS } from '../models/diff.models';

describe('CodeCompareState', () => {
    let service: CodeCompareState;
    let mockDiffEngine: jasmine.SpyObj<DiffEngine>;
    let mockSyntaxHighlight: jasmine.SpyObj<SyntaxHighlight>;

    beforeEach(() => {
        // Clear sessionStorage before each test
        sessionStorage.clear();

        mockDiffEngine = jasmine.createSpyObj('DiffEngine', ['compute']);
        mockSyntaxHighlight = jasmine.createSpyObj('SyntaxHighlight', ['loadLanguage', 'highlightLine', 'detectLanguage']);

        TestBed.configureTestingModule({
            providers: [
                CodeCompareState,
                { provide: DiffEngine, useValue: mockDiffEngine },
                { provide: SyntaxHighlight, useValue: mockSyntaxHighlight }
            ]
        });

        service = TestBed.inject(CodeCompareState);
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should initialize with default state', () => {
        expect(service.leftFile()).toBeNull();
        expect(service.rightFile()).toBeNull();
        expect(service.options()).toEqual(DEFAULT_OPTIONS);
        expect(service.viewMode()).toBe('side-by-side');
        expect(service.searchState().query).toBe('');
        expect(service.scrollRatio()).toBe(0);
        expect(service.showAllUnchanged()).toBe(false);
        expect(service.fontSize()).toBe(14);
        expect(service.lineHeight()).toBe(24);
    });

    describe('should load initial state from session storage if exists', () => {
        beforeEach(async () => {
            // Set session storage BEFORE TestBed initialises the service,
            // so that the constructor's loadFromSession() picks it up.
            sessionStorage.clear();
            sessionStorage.setItem('code-compare-session', JSON.stringify({
                viewMode: 'inline',
                fontSize: 18,
                options: { ...DEFAULT_OPTIONS, ignoreWhitespace: true }
            }));

            // Re-configure TestBed so CodeCompareState is freshly instantiated
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    CodeCompareState,
                    { provide: DiffEngine, useValue: mockDiffEngine },
                    { provide: SyntaxHighlight, useValue: mockSyntaxHighlight }
                ]
            });
            service = TestBed.inject(CodeCompareState);
        });

        it('reads viewMode, fontSize, and options from session storage', () => {
            expect(service.viewMode()).toBe('inline');
            expect(service.fontSize()).toBe(18);
            expect(service.options().ignoreWhitespace).toBeTrue();
        });
    });

    describe('setFile and clearFile', () => {
        const dummyFile: FileContent = { name: 'test.ts', content: 'test content', language: 'typescript', encoding: 'utf-8', size: 12 };

        it('should correctly set and clear left file', () => {
            service.setFile('left', dummyFile);
            expect(service.leftFile()).toEqual(dummyFile);

            service.clearFile('left');
            expect(service.leftFile()).toBeNull();
        });

        it('should correctly set and clear right file', () => {
            service.setFile('right', dummyFile);
            expect(service.rightFile()).toEqual(dummyFile);

            service.clearFile('right');
            expect(service.rightFile()).toBeNull();
        });
    });

    describe('state modifications', () => {
        it('should swap files correctly', () => {
            const file1: FileContent = { name: 'file1', content: '1', language: 'plaintext', encoding: 'utf-8', size: 1 };
            const file2: FileContent = { name: 'file2', content: '2', language: 'plaintext', encoding: 'utf-8', size: 1 };

            service.setFile('left', file1);
            service.setFile('right', file2);

            service.swapFiles();

            expect(service.leftFile()).toEqual(file2);
            expect(service.rightFile()).toEqual(file1);
        });

        it('should reset state completely on reset()', () => {
            service.setFile('left', { name: 'test', content: 'test', language: 'plaintext', encoding: 'utf-8', size: 4 });
            service.viewMode.set('inline');
            service.fontSize.set(20);

            service.reset();

            expect(service.leftFile()).toBeNull();
            expect(service.viewMode()).toBe('side-by-side');
            expect(service.fontSize()).toBe(14);
            expect(sessionStorage.getItem('code-compare-session')).toBeNull();
        });

        it('should increase/decrease font size within bounds', () => {
            expect(service.fontSize()).toBe(14);

            service.increaseFontSize();
            expect(service.fontSize()).toBe(16);

            // Should not exceed 22
            service.fontSize.set(22);
            service.increaseFontSize();
            expect(service.fontSize()).toBe(22);

            // Should not go below 10
            service.fontSize.set(10);
            service.decreaseFontSize();
            expect(service.fontSize()).toBe(10);
        });

        it('should toggle showAllUnchanged', () => {
            expect(service.showAllUnchanged()).toBeFalse();
            service.toggleShowAllUnchanged();
            expect(service.showAllUnchanged()).toBeTrue();
        });

        it('should update options partially', () => {
            service.updateOptions({ ignoreComments: true });
            expect(service.options().ignoreComments).toBeTrue();
            expect(service.options().ignoreWhitespace).toBe(DEFAULT_OPTIONS.ignoreWhitespace);
        });

        it('should set search correctly', () => {
            const dummyFile: FileContent = { name: 'test', content: 'a\nb\nc', language: 'plaintext', encoding: 'utf-8', size: 5 };
            service.setFile('left', dummyFile);
            service.setFile('right', dummyFile);

            mockDiffEngine.compute.and.returnValue({
                inlineRows: [
                    { raw: 'hello', type: 'unchanged', highlightedHtml: 'hello', lineNumber: 1, tokens: null },
                    { raw: 'world', type: 'unchanged', highlightedHtml: 'world', lineNumber: 2, tokens: null },
                    { raw: 'hello again', type: 'unchanged', highlightedHtml: 'hello again', lineNumber: 3, tokens: null }
                ],
                flatLeft: [], flatRight: [], sideBySideRows: [],
                totalAdded: 0, totalRemoved: 0, totalModified: 0, totalUnchanged: 3, similarityPercent: 100
            });

            // Trigger computed evaluation
            service.diffResult();

            service.setSearch('hello');
            const searchState = service.searchState();
            expect(searchState.query).toBe('hello');
            expect(searchState.matchIndices).toEqual([0, 2]); // Lines 0 and 2 match 'hello'
            expect(searchState.currentMatchIndex).toBe(0);

            service.nextMatch();
            expect(service.searchState().currentMatchIndex).toBe(1);

            service.nextMatch();
            expect(service.searchState().currentMatchIndex).toBe(0);

            service.prevMatch();
            expect(service.searchState().currentMatchIndex).toBe(1);
        });
    });

    describe('effects', () => {
        it('should trigger SyntaxHighlight.loadLanguage when files are set', () => {
            const dummyFile: FileContent = { name: 'test.ts', content: 'test', language: 'typescript', encoding: 'utf-8', size: 4 };
            service.setFile('left', dummyFile);

            // force effects to run
            TestBed.flushEffects();

            expect(mockSyntaxHighlight.loadLanguage).toHaveBeenCalledWith('typescript');
        });
    });

    // ─── Missing cases ────────────────────────────────────────────────────────

    describe('clearAll()', () => {
        it('should delegate to reset() and clear all state', () => {
            const dummyFile: FileContent = { name: 'f', content: 'x', language: 'plaintext', encoding: 'utf-8', size: 1 };
            service.setFile('left', dummyFile);
            service.viewMode.set('inline');

            service.clearAll();

            expect(service.leftFile()).toBeNull();
            expect(service.viewMode()).toBe('side-by-side');
            expect(sessionStorage.getItem('code-compare-session')).toBeNull();
        });
    });

    describe('setViewMode()', () => {
        it('should update viewMode signal', () => {
            expect(service.viewMode()).toBe('side-by-side');
            service.setViewMode('inline');
            expect(service.viewMode()).toBe('inline');
        });

        it('should switch back to side-by-side', () => {
            service.setViewMode('inline');
            service.setViewMode('side-by-side');
            expect(service.viewMode()).toBe('side-by-side');
        });
    });

    describe('setScrollRatio()', () => {
        it('should update scrollRatio signal', () => {
            expect(service.scrollRatio()).toBe(0);
            service.setScrollRatio(0.75);
            expect(service.scrollRatio()).toBe(0.75);
        });

        it('should update to 0 and 1 boundaries', () => {
            service.setScrollRatio(0);
            expect(service.scrollRatio()).toBe(0);
            service.setScrollRatio(1);
            expect(service.scrollRatio()).toBe(1);
        });
    });

    describe('lineHeight computed', () => {
        it('should equal fontSize + 10', () => {
            expect(service.lineHeight()).toBe(service.fontSize() + 10);
        });

        it('should update reactively with fontSize', () => {
            service.fontSize.set(18);
            expect(service.lineHeight()).toBe(28);
        });
    });

    describe('decreaseFontSize() — normal case', () => {
        it('should decrease fontSize by 2 from default', () => {
            expect(service.fontSize()).toBe(14);
            service.decreaseFontSize();
            expect(service.fontSize()).toBe(12);
        });
    });

    describe('setSearch() — edge cases', () => {
        it('setSearch("") should reset search state to empty', () => {
            // First set a real search
            service.searchState.set({ query: 'old', matchIndices: [1, 2], currentMatchIndex: 1 });

            service.setSearch('');

            const state = service.searchState();
            expect(state.query).toBe('');
            expect(state.matchIndices).toEqual([]);
            expect(state.currentMatchIndex).toBe(0);
        });

        it('setSearch() with non-empty query but no diffResult → does nothing', () => {
            // No files set → diffResult() is null
            service.setSearch('hello');
            // Should remain unset
            expect(service.searchState().query).toBe('');
        });
    });

    describe('nextMatch() / prevMatch() — guard when empty', () => {
        it('nextMatch() does nothing when matchIndices is empty', () => {
            service.searchState.set({ query: '', matchIndices: [], currentMatchIndex: 0 });
            service.nextMatch();
            expect(service.searchState().currentMatchIndex).toBe(0);
        });

        it('prevMatch() does nothing when matchIndices is empty', () => {
            service.searchState.set({ query: '', matchIndices: [], currentMatchIndex: 0 });
            service.prevMatch();
            expect(service.searchState().currentMatchIndex).toBe(0);
        });
    });

    describe('persistToSession effect', () => {
        it('should persist state to sessionStorage when a file is set', () => {
            const dummyFile: FileContent = { name: 'persist.ts', content: 'code', language: 'typescript', encoding: 'utf-8', size: 4 };
            service.setFile('left', dummyFile);

            // Flush all pending effects
            TestBed.flushEffects();

            const raw = sessionStorage.getItem('code-compare-session');
            expect(raw).not.toBeNull();
            const session = JSON.parse(raw!);
            expect(session.leftFile).toBeTruthy();
            expect(session.leftFile.name).toBe('persist.ts');
        });

        it('should persist viewMode changes to sessionStorage', () => {
            service.setViewMode('inline');
            TestBed.flushEffects();

            const raw = sessionStorage.getItem('code-compare-session');
            expect(raw).not.toBeNull();
            const session = JSON.parse(raw!);
            expect(session.viewMode).toBe('inline');
        });
    });

    describe('loadFromSession() — leftFile / rightFile restore', () => {
        beforeEach(async () => {
            sessionStorage.clear();
            const leftFile: FileContent = { name: 'left.ts', content: 'left content', language: 'typescript', encoding: 'utf-8', size: 12 };
            const rightFile: FileContent = { name: 'right.ts', content: 'right content', language: 'javascript', encoding: 'utf-8', size: 13 };
            sessionStorage.setItem('code-compare-session', JSON.stringify({
                leftFile,
                rightFile,
                viewMode: 'inline',
                fontSize: 16,
                options: { ignoreWhitespace: false, ignoreCase: false, ignoreBlankLines: false, ignoreComments: false, trimLines: false, wordDiff: true, charDiff: false, contextLines: 3 }
            }));

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    { provide: 'CodeCompareState', useClass: undefined },
                    { provide: DiffEngine, useValue: mockDiffEngine },
                    { provide: SyntaxHighlight, useValue: mockSyntaxHighlight }
                ]
            });
            // Re-import the actual service
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    CodeCompareState,
                    { provide: DiffEngine, useValue: mockDiffEngine },
                    { provide: SyntaxHighlight, useValue: mockSyntaxHighlight }
                ]
            });
            service = TestBed.inject(CodeCompareState);
        });

        it('should restore leftFile from session storage', () => {
            expect(service.leftFile()).toBeTruthy();
            expect(service.leftFile()!.name).toBe('left.ts');
        });

        it('should restore rightFile from session storage', () => {
            expect(service.rightFile()).toBeTruthy();
            expect(service.rightFile()!.name).toBe('right.ts');
        });
    });

    describe('loadFromSession() — bad JSON', () => {
        beforeEach(async () => {
            sessionStorage.clear();
            sessionStorage.setItem('code-compare-session', 'INVALID JSON {{{{');

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    CodeCompareState,
                    { provide: DiffEngine, useValue: mockDiffEngine },
                    { provide: SyntaxHighlight, useValue: mockSyntaxHighlight }
                ]
            });
            service = TestBed.inject(CodeCompareState);
        });

        it('should clear corrupted session and initialize with defaults', () => {
            // Bad JSON → catch block removes the item
            expect(sessionStorage.getItem('code-compare-session')).toBeNull();
            expect(service.leftFile()).toBeNull();
            expect(service.rightFile()).toBeNull();
        });
    });
});
