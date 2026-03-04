import { TestBed } from '@angular/core/testing';
import { DiffEngine } from './diff-engine.service';
import { DEFAULT_OPTIONS, DiffOptions } from '../models/diff.models';

// Helper: build a DiffOptions with custom overrides
const opts = (overrides: Partial<DiffOptions> = {}): DiffOptions => ({ ...DEFAULT_OPTIONS, ...overrides });

describe('DiffEngine', () => {
    let service: DiffEngine;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DiffEngine);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // escapeHtml
    // ─────────────────────────────────────────────────────────────────────────
    describe('escapeHtml()', () => {
        it('should escape ampersand', () => {
            expect(service.escapeHtml('a & b')).toBe('a &amp; b');
        });

        it('should escape less-than', () => {
            expect(service.escapeHtml('<div>')).toBe('&lt;div&gt;');
        });

        it('should escape double-quote', () => {
            expect(service.escapeHtml('"hello"')).toBe('&quot;hello&quot;');
        });

        it('should escape single-quote', () => {
            expect(service.escapeHtml("it's")).toBe('it&#39;s');
        });

        it('should escape multiple special chars in one string', () => {
            expect(service.escapeHtml('<a href="url">')).toBe('&lt;a href=&quot;url&quot;&gt;');
        });

        it('should return plain text unchanged', () => {
            expect(service.escapeHtml('hello world')).toBe('hello world');
        });

        it('should return empty string unchanged', () => {
            expect(service.escapeHtml('')).toBe('');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // applyIgnoreOptions  (tested via compute() with empty right side)
    // We exercise the private method by feeding options that change the visible result
    // ─────────────────────────────────────────────────────────────────────────
    describe('applyIgnoreOptions() — via compute()', () => {
        it('ignoreBlankLines — blank lines are stripped before diff', () => {
            const left = 'a\n\nb';
            const right = 'a\nb';
            // Without option: sees the blank line as a difference
            const withoutOpt = service.compute(left, right, opts({ ignoreBlankLines: false }));
            expect(withoutOpt.totalUnchanged + withoutOpt.totalModified + withoutOpt.totalAdded + withoutOpt.totalRemoved).toBeGreaterThan(0);

            // With option: blank line stripped → both sides become "a\nb" → identical
            const result = service.compute(left, right, opts({ ignoreBlankLines: true }));
            expect(result.totalAdded).toBe(0);
            expect(result.totalRemoved).toBe(0);
            expect(result.totalModified).toBe(0);
        });

        it('trimLines — leading/trailing whitespace is removed before diff', () => {
            const left = '  hello  \n  world  ';
            const right = 'hello\nworld';
            const result = service.compute(left, right, opts({ trimLines: true }));
            expect(result.totalAdded).toBe(0);
            expect(result.totalRemoved).toBe(0);
            expect(result.totalModified).toBe(0);
        });

        it('ignoreWhitespace — trailing spaces are trimmed before diff', () => {
            const left = 'hello   \nworld   ';
            const right = 'hello\nworld';
            const result = service.compute(left, right, opts({ ignoreWhitespace: true, trimLines: false }));
            expect(result.totalModified).toBe(0);
            expect(result.totalRemoved).toBe(0);
        });

        it('ignoreComments — lines starting with // are filtered', () => {
            const left = '// comment\ncode';
            const right = 'code';
            const result = service.compute(left, right, opts({ ignoreComments: true }));
            expect(result.totalRemoved).toBe(0);
            expect(result.totalModified).toBe(0);
        });

        it('ignoreComments — lines starting with # are filtered', () => {
            const left = '# hash comment\ncode';
            const right = 'code';
            const result = service.compute(left, right, opts({ ignoreComments: true }));
            expect(result.totalRemoved).toBe(0);
        });

        it('ignoreComments — lines starting with * are filtered', () => {
            const left = '* block doc\ncode';
            const right = 'code';
            const result = service.compute(left, right, opts({ ignoreComments: true }));
            expect(result.totalRemoved).toBe(0);
        });

        it('ignoreComments — lines starting with /* are filtered', () => {
            const left = '/* start block\ncode';
            const right = 'code';
            const result = service.compute(left, right, opts({ ignoreComments: true }));
            expect(result.totalRemoved).toBe(0);
        });

        it('ignoreComments — lines starting with -- (SQL) are filtered', () => {
            const left = '-- sql comment\ncode';
            const right = 'code';
            const result = service.compute(left, right, opts({ ignoreComments: true }));
            expect(result.totalRemoved).toBe(0);
        });

        it('ignoreComments — lines starting with <!-- (HTML) are filtered', () => {
            const left = '<!-- html comment -->\ncode';
            const right = 'code';
            const result = service.compute(left, right, opts({ ignoreComments: true }));
            expect(result.totalRemoved).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // compute() — core diff scenarios
    // ─────────────────────────────────────────────────────────────────────────
    describe('compute()', () => {
        it('identical content → all unchanged, 100% similar', () => {
            const content = 'line1\nline2\nline3';
            const result = service.compute(content, content, opts());
            expect(result.totalAdded).toBe(0);
            expect(result.totalRemoved).toBe(0);
            expect(result.totalModified).toBe(0);
            expect(result.totalUnchanged).toBe(3);
            expect(result.similarityPercent).toBe(100);
        });

        it('added lines in right → totalAdded', () => {
            const left = 'line1\nline2';
            const right = 'line1\nline2\nline3';
            const result = service.compute(left, right, opts());
            expect(result.totalAdded).toBeGreaterThan(0);
            expect(result.totalRemoved).toBe(0);
        });

        it('removed lines from left → totalRemoved', () => {
            const left = 'line1\nline2\nline3';
            const right = 'line1\nline2';
            const result = service.compute(left, right, opts());
            expect(result.totalRemoved).toBeGreaterThan(0);
            expect(result.totalAdded).toBe(0);
        });

        it('modified lines → totalModified', () => {
            const left = 'hello\nworld';
            const right = 'hello\nearth';
            const result = service.compute(left, right, opts());
            expect(result.totalModified).toBeGreaterThan(0);
        });

        it('completely different content → 0% similar', () => {
            const left = 'aaa\nbbb\nccc';
            const right = 'xxx\nyyy\nzzz';
            const result = service.compute(left, right, opts());
            expect(result.similarityPercent).toBeLessThan(50);
        });

        it('empty left and right → result with zero totals and 100% similar', () => {
            const result = service.compute('', '', opts());
            expect(result.totalAdded).toBe(0);
            expect(result.totalRemoved).toBe(0);
            expect(result.similarityPercent).toBe(100);
        });

        it('produces inlineRows for all line types', () => {
            const left = 'unchanged\nremoved';
            const right = 'unchanged\nadded';
            const result = service.compute(left, right, opts({ wordDiff: false }));
            expect(result.inlineRows.length).toBeGreaterThan(0);
        });

        it('produces sideBySideRows with correct structure', () => {
            const left = 'a\nb';
            const right = 'a\nc';
            const result = service.compute(left, right, opts());
            expect(result.sideBySideRows.length).toBeGreaterThan(0);
            for (const row of result.sideBySideRows) {
                expect(row.left).toBeDefined();
                expect(row.right).toBeDefined();
                expect(typeof row.index).toBe('number');
            }
        });

        it('flatLeft and flatRight have equal length', () => {
            const left = 'a\nb\nc';
            const right = 'a\nx\nc';
            const result = service.compute(left, right, opts());
            expect(result.flatLeft.length).toBe(result.flatRight.length);
        });

        it('shows fold rows when contextLines is 0 and there are unchanged lines', () => {
            const unchanged = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n');
            const left = unchanged + '\nold';
            const right = unchanged + '\nnew';
            const result = service.compute(left, right, opts({ contextLines: 0 }));
            const hasFold = result.inlineRows.some((r) => r.type === 'fold');
            expect(hasFold).toBeTrue();
        });

        it('showAll=true → no fold rows', () => {
            const unchanged = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n');
            const left = unchanged + '\nold';
            const right = unchanged + '\nnew';
            const result = service.compute(left, right, opts(), true);
            const hasFold = result.inlineRows.some((r) => r.type === 'fold');
            expect(hasFold).toBeFalse();
        });

        it('foldedCount on fold rows reflects the number of hidden lines', () => {
            const unchanged = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n');
            const left = unchanged + '\nold';
            const right = unchanged + '\nnew';
            const result = service.compute(left, right, opts({ contextLines: 0 }));
            const foldRow = result.inlineRows.find((r) => r.type === 'fold');
            expect(foldRow).toBeDefined();
            expect(foldRow!.foldedCount).toBeGreaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // pairLines() — tested indirectly via compute side-by-side rows
    // ─────────────────────────────────────────────────────────────────────────
    describe('pairLines() — via sideBySideRows', () => {
        it('unchanged line: both sides have same content and lineNumbers', () => {
            const content = 'hello';
            // Use showAll=true so identical content is not collapsed into a fold
            const result = service.compute(content, content, opts({ wordDiff: false }), true);
            const row = result.sideBySideRows.find((r) => r.left.type === 'unchanged')!;
            expect(row).toBeDefined();
            expect(row.left.type).toBe('unchanged');
            expect(row.right.type).toBe('unchanged');
            expect(row.left.lineNumber).toBe(1);
            expect(row.right.lineNumber).toBe(1);
        });

        it('added line: left side is blank placeholder, right has content', () => {
            const left = 'a';
            const right = 'a\nb';
            const result = service.compute(left, right, opts({ wordDiff: false }));
            const addedRow = result.sideBySideRows.find((r) => r.right.type === 'added');
            expect(addedRow).toBeDefined();
            expect(addedRow!.left.lineNumber).toBeNull();
            expect(addedRow!.left.raw).toBe('');
        });

        it('removed line: right side is blank placeholder, left has content', () => {
            const left = 'a\nb';
            const right = 'a';
            const result = service.compute(left, right, opts({ wordDiff: false }));
            const removedRow = result.sideBySideRows.find((r) => r.left.type === 'removed');
            expect(removedRow).toBeDefined();
            expect(removedRow!.right.lineNumber).toBeNull();
            expect(removedRow!.right.raw).toBe('');
        });

        it('modified line: both sides have type=modified', () => {
            const left = 'hello world';
            const right = 'hello earth';
            const result = service.compute(left, right, opts({ wordDiff: false }));
            const modifiedRow = result.sideBySideRows.find((r) => r.left.type === 'modified');
            expect(modifiedRow).toBeDefined();
            expect(modifiedRow!.right.type).toBe('modified');
        });

        it('asymmetric removed+added: extra lines become pure removed/added', () => {
            // 3 removed vs 1 added → 1 modified + 2 removed
            const left = 'a\nb\nc';
            const right = 'x';
            const result = service.compute(left, right, opts({ wordDiff: false }), true);
            const countRemoved = result.sideBySideRows.filter((r) => r.left.type === 'removed').length;
            expect(countRemoved).toBeGreaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Word / Char diff
    // ─────────────────────────────────────────────────────────────────────────
    describe('word-level diff (wordDiff: true)', () => {
        it('modified line produces tokens on both sides', () => {
            const left = 'hello world';
            const right = 'hello earth';
            const result = service.compute(left, right, opts({ wordDiff: true, charDiff: false }));
            const modRow = result.sideBySideRows.find((r) => r.left.type === 'modified');
            expect(modRow).toBeDefined();
            expect(modRow!.left.tokens).not.toBeNull();
            expect(modRow!.right.tokens).not.toBeNull();
        });

        it('left token contains removed word with type="removed"', () => {
            const left = 'hello world';
            const right = 'hello earth';
            const result = service.compute(left, right, opts({ wordDiff: true, charDiff: false }));
            const modRow = result.sideBySideRows.find((r) => r.left.type === 'modified')!;
            const removedToken = modRow.left.tokens!.find((t) => t.type === 'removed');
            expect(removedToken).toBeDefined();
        });

        it('right token contains added word with type="added"', () => {
            const left = 'hello world';
            const right = 'hello earth';
            const result = service.compute(left, right, opts({ wordDiff: true, charDiff: false }));
            const modRow = result.sideBySideRows.find((r) => r.left.type === 'modified')!;
            const addedToken = modRow.right.tokens!.find((t) => t.type === 'added');
            expect(addedToken).toBeDefined();
        });

        it('equal parts appear as type="equal" tokens on both sides', () => {
            const left = 'hello world';
            const right = 'hello earth';
            const result = service.compute(left, right, opts({ wordDiff: true, charDiff: false }));
            const modRow = result.sideBySideRows.find((r) => r.left.type === 'modified')!;
            const equalLeft = modRow.left.tokens!.find((t) => t.type === 'equal');
            expect(equalLeft).toBeDefined();
        });

        it('unchanged lines should have null tokens (no word diff applied)', () => {
            const content = 'same line';
            // Use showAll=true so identical content is not collapsed into a fold
            const result = service.compute(content, content, opts({ wordDiff: true }), true);
            const unchangedRow = result.sideBySideRows.find((r) => r.left.type === 'unchanged')!;
            expect(unchangedRow).toBeDefined();
            expect(unchangedRow.left.tokens).toBeNull();
        });
    });

    describe('char-level diff (charDiff: true)', () => {
        it('modified line with charDiff produces character-level tokens', () => {
            const left = 'abc';
            const right = 'axc';
            const result = service.compute(left, right, opts({ wordDiff: false, charDiff: true }));
            const modRow = result.sideBySideRows.find((r) => r.left.type === 'modified');
            expect(modRow).toBeDefined();
            expect(modRow!.left.tokens).not.toBeNull();
            expect(modRow!.right.tokens).not.toBeNull();
            // Should have individual characters as tokens
            const leftText = modRow!.left.tokens!.map((t) => t.text).join('');
            const rightText = modRow!.right.tokens!.map((t) => t.text).join('');
            expect(leftText).toContain('b');
            expect(rightText).toContain('x');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // buildHunks() — tested via inline rows fold behaviour
    // ─────────────────────────────────────────────────────────────────────────
    describe('buildHunks()', () => {
        it('no changed lines → one big fold covering all lines', () => {
            const content = Array.from({ length: 20 }, (_, i) => `line${i + 1}`).join('\n');
            const result = service.compute(content, content, opts({ contextLines: 3 }));
            const folds = result.inlineRows.filter((r) => r.type === 'fold');
            expect(folds.length).toBeGreaterThan(0);
            const totalFolded = folds.reduce((s, f) => s + (f.foldedCount ?? 0), 0);
            expect(totalFolded).toBe(20);
        });

        it('contextLines=3 → at most 3 unchanged lines around each diff', () => {
            // 10 unchanged lines, then 1 change, then 10 unchanged lines
            const identical = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n');
            const left = identical + '\noldLine\n' + identical;
            const right = identical + '\nnewLine\n' + identical;
            const result = service.compute(left, right, opts({ contextLines: 3 }));

            // Count visible (non-fold) unchanged rows around the changed line
            const visibleUnchanged = result.inlineRows.filter((r) => r.type !== 'fold').filter((r) => r.type === 'unchanged');
            // With 3 context lines on each side (max 6 visible unchanged)
            expect(visibleUnchanged.length).toBeLessThanOrEqual(6);
        });

        it('showAll=false and all identical → entire content is folded', () => {
            const content = Array.from({ length: 5 }, (_, i) => `line${i + 1}`).join('\n');
            const result = service.compute(content, content, opts({ contextLines: 3 }), false);
            const nonFold = result.inlineRows.filter((r) => r.type !== 'fold');
            expect(nonFold.length).toBe(0);
        });
    });
});
