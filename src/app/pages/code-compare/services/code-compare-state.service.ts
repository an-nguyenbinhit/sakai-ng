import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { FileContent, DiffOptions, DiffResult, SearchState, ViewMode, CodeCompareSession, DEFAULT_OPTIONS } from '../models/diff.models';
import { DiffEngine } from './diff-engine.service';
import { SyntaxHighlight } from './syntax-highlight.service';

const SESSION_KEY = 'code-compare-session';

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
    showAllUnchanged = signal<boolean>(false);
    fontSize = signal<number>(14);
    lineHeight = computed(() => this.fontSize() + 10);

    // Computed diff result
    diffResult = computed<DiffResult | null>(() => {
        const left = this.leftFile();
        const right = this.rightFile();
        if (!left || !right) return null;
        return this.diffEngine.compute(left.content, right.content, this.options(), this.showAllUnchanged());
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
        this.reset();
    }

    reset(): void {
        this.leftFile.set(null);
        this.rightFile.set(null);
        this.options.set({ ...DEFAULT_OPTIONS });
        this.viewMode.set('side-by-side');
        this.searchState.set({ query: '', matchIndices: [], currentMatchIndex: 0 });
        this.scrollRatio.set(0);
        this.showAllUnchanged.set(false);
        this.fontSize.set(14);
        this.getSessionStorage()?.removeItem(SESSION_KEY);
    }

    increaseFontSize(): void {
        this.fontSize.update((s) => Math.min(s + 2, 22));
    }

    decreaseFontSize(): void {
        this.fontSize.update((s) => Math.max(s - 2, 10));
    }

    toggleShowAllUnchanged(): void {
        this.showAllUnchanged.update((v) => !v);
    }

    swapFiles(): void {
        const left = this.leftFile();
        const right = this.rightFile();
        this.leftFile.set(right);
        this.rightFile.set(left);
    }

    updateOptions(patch: Partial<DiffOptions>): void {
        this.options.update((opts) => ({ ...opts, ...patch }));
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
        this.searchState.update((s) => {
            if (s.matchIndices.length === 0) return s;
            const next = (s.currentMatchIndex + 1) % s.matchIndices.length;
            return { ...s, currentMatchIndex: next };
        });
    }

    prevMatch(): void {
        this.searchState.update((s) => {
            if (s.matchIndices.length === 0) return s;
            const prev = (s.currentMatchIndex - 1 + s.matchIndices.length) % s.matchIndices.length;
            return { ...s, currentMatchIndex: prev };
        });
    }

    setScrollRatio(ratio: number): void {
        this.scrollRatio.set(ratio);
    }

    private persistToSession(): void {
        try {
            const storage = this.getSessionStorage();
            if (!storage) return;
            const session: CodeCompareSession = {
                leftFile: this.leftFile(),
                rightFile: this.rightFile(),
                options: this.options(),
                viewMode: this.viewMode(),
                fontSize: this.fontSize()
            };
            storage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch {
            // sessionStorage might be full or unavailable
        }
    }

    private loadFromSession(): void {
        try {
            const storage = this.getSessionStorage();
            if (!storage) return;
            const raw = storage.getItem(SESSION_KEY);
            if (!raw) return;
            const session: CodeCompareSession = JSON.parse(raw);
            if (session.leftFile) this.leftFile.set(session.leftFile);
            if (session.rightFile) this.rightFile.set(session.rightFile);
            if (session.options) this.options.set(session.options);
            if (session.viewMode) this.viewMode.set(session.viewMode);
            if (session.fontSize) this.fontSize.set(session.fontSize);
        } catch {
            this.getSessionStorage()?.removeItem(SESSION_KEY);
        }
    }

    private getSessionStorage(): Storage | null {
        return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    }
}
