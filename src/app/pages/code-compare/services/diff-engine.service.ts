import { Injectable } from '@angular/core';
import { diffLines, diffWords, diffChars, Change } from 'diff';
import { DiffLine, DiffLineType, DiffOptions, DiffResult, SideBySideRow, WordToken, EMPTY_DIFF_LINE } from '../models/diff.models';

interface PairedLine {
    type: DiffLineType;
    leftText: string | null;
    rightText: string | null;
    leftLineNum: number | null;
    rightLineNum: number | null;
}

@Injectable({ providedIn: 'root' })
export class DiffEngine {
    compute(leftContent: string, rightContent: string, opts: DiffOptions, expandedHunks: Set<number> = new Set()): DiffResult {
        const leftNorm = this.applyIgnoreOptions(leftContent, opts);
        const rightNorm = this.applyIgnoreOptions(rightContent, opts);

        const changes = diffLines(leftNorm, rightNorm, {
            ignoreWhitespace: opts.ignoreWhitespace
        });

        const paired = this.pairLines(changes);
        const hunks = this.buildHunks(paired, opts.contextLines, expandedHunks);

        const flatLeft: DiffLine[] = [];
        const flatRight: DiffLine[] = [];
        const sideBySideRows: SideBySideRow[] = [];
        const inlineRows: DiffLine[] = [];

        let totalAdded = 0;
        let totalRemoved = 0;
        let totalModified = 0;
        let totalUnchanged = 0;

        for (const hunk of hunks) {
            for (const row of hunk) {
                if (row.type === 'fold') {
                    const foldLeft: DiffLine = {
                        lineNumber: null,
                        type: 'fold',
                        raw: '',
                        tokens: null,
                        highlightedHtml: '',
                        foldedCount: (row as any).foldedCount,
                        hunkIndex: (row as any).hunkIndex
                    };
                    const foldRight = { ...foldLeft };
                    flatLeft.push(foldLeft);
                    flatRight.push(foldRight);
                    sideBySideRows.push({ left: foldLeft, right: foldRight, index: sideBySideRows.length });
                    inlineRows.push(foldLeft);
                    continue;
                }

                const leftText = row.leftText ?? '';
                const rightText = row.rightText ?? '';

                let wordTokensLeft: WordToken[] | null = null;
                let wordTokensRight: WordToken[] | null = null;

                if (row.type === 'modified' && (opts.wordDiff || opts.charDiff)) {
                    const { left, right } = this.computeWordDiff(leftText, rightText, opts.charDiff);
                    wordTokensLeft = left;
                    wordTokensRight = right;
                }

                const leftLine: DiffLine = {
                    lineNumber: row.leftLineNum,
                    type: row.type === 'added' ? 'unchanged' : row.type,
                    raw: this.escapeHtml(leftText),
                    tokens: wordTokensLeft,
                    highlightedHtml: this.escapeHtml(leftText)
                };

                const rightLine: DiffLine = {
                    lineNumber: row.rightLineNum,
                    type: row.type === 'removed' ? 'unchanged' : row.type,
                    raw: this.escapeHtml(rightText),
                    tokens: wordTokensRight,
                    highlightedHtml: this.escapeHtml(rightText)
                };

                // For side-by-side: left panel shows removed/modified/unchanged, right shows added/modified/unchanged
                if (row.type === 'added') {
                    leftLine.type = 'unchanged';
                    leftLine.lineNumber = null;
                    leftLine.raw = '';
                    leftLine.highlightedHtml = '';
                    rightLine.type = 'added';
                    totalAdded++;
                } else if (row.type === 'removed') {
                    leftLine.type = 'removed';
                    rightLine.type = 'unchanged';
                    rightLine.lineNumber = null;
                    rightLine.raw = '';
                    rightLine.highlightedHtml = '';
                    totalRemoved++;
                } else if (row.type === 'modified') {
                    leftLine.type = 'modified';
                    rightLine.type = 'modified';
                    totalModified++;
                } else {
                    leftLine.type = 'unchanged';
                    rightLine.type = 'unchanged';
                    totalUnchanged++;
                }

                flatLeft.push(leftLine);
                flatRight.push(rightLine);
                sideBySideRows.push({ left: leftLine, right: rightLine, index: sideBySideRows.length });

                // Inline: show removed then added
                if (row.type === 'added') {
                    inlineRows.push(rightLine);
                } else if (row.type === 'removed') {
                    inlineRows.push(leftLine);
                } else if (row.type === 'modified') {
                    inlineRows.push(leftLine);
                    inlineRows.push(rightLine);
                } else {
                    inlineRows.push(leftLine);
                }
            }
        }

        const totalLines = totalAdded + totalRemoved + totalModified + totalUnchanged;
        const similarityPercent = totalLines > 0
            ? Math.round((totalUnchanged / totalLines) * 100)
            : 100;

        return {
            flatLeft,
            flatRight,
            sideBySideRows,
            inlineRows,
            totalAdded,
            totalRemoved,
            totalModified,
            totalUnchanged,
            similarityPercent
        };
    }

    private applyIgnoreOptions(text: string, opts: DiffOptions): string {
        let lines = text.split(/\r?\n|\r/);

        if (opts.ignoreBlankLines) {
            lines = lines.filter(l => l.trim().length > 0);
        }

        if (opts.trimLines) {
            lines = lines.map(l => l.trim());
        } else if (opts.ignoreWhitespace) {
            lines = lines.map(l => l.trimEnd());
        }

        if (opts.ignoreComments) {
            lines = lines.filter(l => !this.isCommentLine(l));
        }

        return lines.join('\n');
    }

    private isCommentLine(line: string): boolean {
        const trimmed = line.trim();
        return trimmed.startsWith('//') ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('*') ||
            trimmed.startsWith('/*') ||
            trimmed.startsWith('--') ||
            trimmed.startsWith('<!--');
    }

    private pairLines(changes: Change[]): PairedLine[] {
        const result: PairedLine[] = [];
        let leftLineNum = 1;
        let rightLineNum = 1;

        // Collect raw segments
        const segments: { added: boolean; removed: boolean; lines: string[] }[] = [];
        for (const change of changes) {
            const lines = change.value.split('\n');
            if (lines[lines.length - 1] === '') lines.pop(); // trailing newline artifact
            segments.push({ added: change.added ?? false, removed: change.removed ?? false, lines });
        }

        // Pair consecutive removed+added as modified
        let i = 0;
        while (i < segments.length) {
            const seg = segments[i];
            if (seg.removed && i + 1 < segments.length && segments[i + 1].added) {
                const removedLines = seg.lines;
                const addedLines = segments[i + 1].lines;
                const maxLen = Math.max(removedLines.length, addedLines.length);

                for (let j = 0; j < maxLen; j++) {
                    const leftText = j < removedLines.length ? removedLines[j] : null;
                    const rightText = j < addedLines.length ? addedLines[j] : null;

                    if (leftText !== null && rightText !== null) {
                        result.push({
                            type: leftText === rightText ? 'unchanged' : 'modified',
                            leftText,
                            rightText,
                            leftLineNum: leftLineNum++,
                            rightLineNum: rightLineNum++
                        });
                    } else if (leftText !== null) {
                        result.push({ type: 'removed', leftText, rightText: null, leftLineNum: leftLineNum++, rightLineNum: null });
                    } else {
                        result.push({ type: 'added', leftText: null, rightText: rightText!, leftLineNum: null, rightLineNum: rightLineNum++ });
                    }
                }
                i += 2;
            } else if (seg.removed) {
                for (const line of seg.lines) {
                    result.push({ type: 'removed', leftText: line, rightText: null, leftLineNum: leftLineNum++, rightLineNum: null });
                }
                i++;
            } else if (seg.added) {
                for (const line of seg.lines) {
                    result.push({ type: 'added', leftText: null, rightText: line, leftLineNum: null, rightLineNum: rightLineNum++ });
                }
                i++;
            } else {
                for (const line of seg.lines) {
                    result.push({ type: 'unchanged', leftText: line, rightText: line, leftLineNum: leftLineNum++, rightLineNum: rightLineNum++ });
                }
                i++;
            }
        }

        return result;
    }

    private buildHunks(paired: PairedLine[], contextLines: number, expandedHunks: Set<number>): PairedLine[][] {
        // Find indices of non-unchanged lines
        const changedIndices = new Set<number>();
        paired.forEach((row, idx) => {
            if (row.type !== 'unchanged') {
                for (let c = Math.max(0, idx - contextLines); c <= Math.min(paired.length - 1, idx + contextLines); c++) {
                    changedIndices.add(c);
                }
            }
        });

        const result: PairedLine[][] = [];
        let currentHunk: PairedLine[] = [];
        let hunkIndex = 0;

        for (let i = 0; i < paired.length; i++) {
            if (changedIndices.has(i)) {
                currentHunk.push(paired[i]);
            } else {
                // Count consecutive unchanged to fold
                let j = i;
                while (j < paired.length && !changedIndices.has(j)) j++;
                const foldCount = j - i;

                if (foldCount > 0) {
                    if (currentHunk.length > 0) {
                        result.push(currentHunk);
                        currentHunk = [];
                    }
                    if (expandedHunks.has(hunkIndex)) {
                        // Expand: push actual unchanged lines
                        result.push(paired.slice(i, j));
                    } else {
                        // Fold: add placeholder
                        const foldPlaceholder: any = {
                            type: 'fold',
                            leftText: null,
                            rightText: null,
                            leftLineNum: null,
                            rightLineNum: null,
                            foldedCount: foldCount,
                            hunkIndex: hunkIndex
                        };
                        result.push([foldPlaceholder]);
                    }
                    hunkIndex++;
                    i = j - 1;
                }
            }
        }

        if (currentHunk.length > 0) {
            result.push(currentHunk);
        }

        return result;
    }

    private computeWordDiff(leftText: string, rightText: string, charLevel: boolean): { left: WordToken[]; right: WordToken[] } {
        const changes = charLevel ? diffChars(leftText, rightText) : diffWords(leftText, rightText);
        const leftTokens: WordToken[] = [];
        const rightTokens: WordToken[] = [];

        for (const change of changes) {
            if (change.added) {
                rightTokens.push({ text: this.escapeHtml(change.value), type: 'added' });
            } else if (change.removed) {
                leftTokens.push({ text: this.escapeHtml(change.value), type: 'removed' });
            } else {
                leftTokens.push({ text: this.escapeHtml(change.value), type: 'equal' });
                rightTokens.push({ text: this.escapeHtml(change.value), type: 'equal' });
            }
        }

        return { left: leftTokens, right: rightTokens };
    }

    escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
