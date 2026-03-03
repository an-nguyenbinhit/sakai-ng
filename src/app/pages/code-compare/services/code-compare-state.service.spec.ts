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
});
