import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
    FileContent,
    DiffOptions,
    DiffResult,
    SearchState,
    ViewMode,
    CodeCompareSession,
    DEFAULT_OPTIONS
} from '../models/diff.models';
import { DiffEngine } from './diff-engine.service';
import { SyntaxHighlight } from './syntax-highlight.service';

const SESSION_KEY = 'code-compare-session';

const SAMPLE_LEFT = `function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    let temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

// Calculate first 10 fibonacci numbers
const results = [];
for (let i = 0; i < 10; i++) {
  results.push(fibonacci(i));
}
console.log(results);
`;

const SAMPLE_RIGHT = `function fibonacci(n: number): number {
  if (n < 0) throw new Error('n must be non-negative');
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

// Calculate first 15 fibonacci numbers
const results: number[] = [];
for (let i = 0; i < 15; i++) {
  results.push(fibonacci(i));
}
console.log('Fibonacci:', results);
`;

@Injectable({ providedIn: 'root' })
export class CodeCompareState {
    private diffEngine = inject(DiffEngine);
    private syntaxHighlight = inject(SyntaxHighlight);

    // Primary inputs
    leftFile = signal<FileContent | null>(null);
    rightFile = signal<FileContent | null>(null);

    // Options
    options = signal<DiffOptions>({ ...DEFAULT_OPTIONS });

    // View state
    viewMode = signal<ViewMode>('side-by-side');
    searchState = signal<SearchState>({ query: '', matchIndices: [], currentMatchIndex: 0 });
    scrollRatio = signal<number>(0);

    // Computed diff result
    diffResult = computed<DiffResult | null>(() => {
        const left = this.leftFile();
        const right = this.rightFile();
        if (!left || !right) return null;
        return this.diffEngine.compute(left.content, right.content, this.options());
    });

    constructor() {
        this.loadFromSession();
        effect(() => {
            this.persistToSession();
        });
        // Load syntax highlighting after diff
        effect(() => {
            const left = this.leftFile();
            const right = this.rightFile();
            if (left) this.syntaxHighlight.loadLanguage(left.language);
            if (right) this.syntaxHighlight.loadLanguage(right.language);
        });
    }

    setFile(side: 'left' | 'right', file: FileContent): void {
        if (side === 'left') {
            this.leftFile.set(file);
        } else {
            this.rightFile.set(file);
        }
    }

    clearFile(side: 'left' | 'right'): void {
        if (side === 'left') {
            this.leftFile.set(null);
        } else {
            this.rightFile.set(null);
        }
    }

    clearAll(): void {
        this.leftFile.set(null);
        this.rightFile.set(null);
        this.searchState.set({ query: '', matchIndices: [], currentMatchIndex: 0 });
    }

    swapFiles(): void {
        const left = this.leftFile();
        const right = this.rightFile();
        this.leftFile.set(right);
        this.rightFile.set(left);
    }

    updateOptions(patch: Partial<DiffOptions>): void {
        this.options.update(opts => ({ ...opts, ...patch }));
    }

    setViewMode(mode: ViewMode): void {
        this.viewMode.set(mode);
    }

    setSearch(query: string): void {
        if (!query) {
            this.searchState.set({ query: '', matchIndices: [], currentMatchIndex: 0 });
            return;
        }
        const result = this.diffResult();
        if (!result) return;

        const matchIndices: number[] = [];
        const lowerQuery = query.toLowerCase();
        result.inlineRows.forEach((line, idx) => {
            if (line.raw.toLowerCase().includes(lowerQuery)) {
                matchIndices.push(idx);
            }
        });
        this.searchState.set({ query, matchIndices, currentMatchIndex: 0 });
    }

    nextMatch(): void {
        this.searchState.update(s => {
            if (s.matchIndices.length === 0) return s;
            const next = (s.currentMatchIndex + 1) % s.matchIndices.length;
            return { ...s, currentMatchIndex: next };
        });
    }

    prevMatch(): void {
        this.searchState.update(s => {
            if (s.matchIndices.length === 0) return s;
            const prev = (s.currentMatchIndex - 1 + s.matchIndices.length) % s.matchIndices.length;
            return { ...s, currentMatchIndex: prev };
        });
    }

    loadSampleData(): void {
        this.leftFile.set({
            name: 'fibonacci.js',
            content: SAMPLE_LEFT,
            encoding: 'UTF-8',
            language: 'javascript',
            size: SAMPLE_LEFT.length
        });
        this.rightFile.set({
            name: 'fibonacci.ts',
            content: SAMPLE_RIGHT,
            encoding: 'UTF-8',
            language: 'typescript',
            size: SAMPLE_RIGHT.length
        });
    }

    setScrollRatio(ratio: number): void {
        this.scrollRatio.set(ratio);
    }

    private persistToSession(): void {
        try {
            const session: CodeCompareSession = {
                leftFile: this.leftFile(),
                rightFile: this.rightFile(),
                options: this.options(),
                viewMode: this.viewMode()
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch {
            // sessionStorage might be full or unavailable
        }
    }

    private loadFromSession(): void {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return;
            const session: CodeCompareSession = JSON.parse(raw);
            if (session.leftFile) this.leftFile.set(session.leftFile);
            if (session.rightFile) this.rightFile.set(session.rightFile);
            if (session.options) this.options.set(session.options);
            if (session.viewMode) this.viewMode.set(session.viewMode);
        } catch {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }
}
