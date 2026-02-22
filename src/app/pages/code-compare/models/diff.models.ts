export type InputMode = 'upload' | 'paste';
export type DiffLineType = 'added' | 'removed' | 'modified' | 'unchanged' | 'fold';
export type ViewMode = 'side-by-side' | 'inline';

export interface FileContent {
    name: string;
    content: string;
    encoding: string;
    language: string;
    size: number;
}

export interface WordToken {
    text: string;
    type: 'added' | 'removed' | 'equal';
}

export interface DiffLine {
    lineNumber: number | null;
    type: DiffLineType;
    raw: string;
    tokens: WordToken[] | null;
    highlightedHtml: string;
    foldedCount?: number;
    hunkIndex?: number;
}

export interface SideBySideRow {
    left: DiffLine;
    right: DiffLine;
    index: number;
}

export interface DiffResult {
    flatLeft: DiffLine[];
    flatRight: DiffLine[];
    sideBySideRows: SideBySideRow[];
    inlineRows: DiffLine[];
    totalAdded: number;
    totalRemoved: number;
    totalModified: number;
    totalUnchanged: number;
    similarityPercent: number;
}

export interface DiffOptions {
    ignoreWhitespace: boolean;
    ignoreCase: boolean;
    ignoreBlankLines: boolean;
    ignoreComments: boolean;
    trimLines: boolean;
    wordDiff: boolean;
    charDiff: boolean;
    contextLines: number;
}

export interface SearchState {
    query: string;
    matchIndices: number[];
    currentMatchIndex: number;
}

export interface CodeCompareSession {
    leftFile: FileContent | null;
    rightFile: FileContent | null;
    options: DiffOptions;
    viewMode: ViewMode;
}

export const DEFAULT_OPTIONS: DiffOptions = {
    ignoreWhitespace: false,
    ignoreCase: false,
    ignoreBlankLines: false,
    ignoreComments: false,
    trimLines: false,
    wordDiff: true,
    charDiff: false,
    contextLines: 3
};

export const EMPTY_DIFF_LINE: DiffLine = {
    lineNumber: null,
    type: 'unchanged',
    raw: '',
    tokens: null,
    highlightedHtml: ''
};
