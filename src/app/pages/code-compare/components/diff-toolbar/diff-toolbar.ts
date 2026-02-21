import { Component, computed, inject, HostListener, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { DiffViewer } from '../diff-viewer/diff-viewer';
import { ViewMode } from '../../models/diff.models';

@Component({
    selector: 'p-diff-toolbar',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, SelectButtonModule, CheckboxModule,
        InputTextModule, TooltipModule, DividerModule,
        IconFieldModule, InputIconModule
    ],
    templateUrl: './diff-toolbar.html',
    styleUrl: './diff-toolbar.scss'
})
export class DiffToolbar {
    state = inject(CodeCompareState);

    diffViewer = input<DiffViewer | null>(null);

    readonly viewOptions = [
        { label: 'Side by Side', value: 'side-by-side' as ViewMode },
        { label: 'Inline', value: 'inline' as ViewMode }
    ];

    viewMode = computed(() => this.state.viewMode());
    options = computed(() => this.state.options());
    searchState = computed(() => this.state.searchState());
    searchQuery = computed(() => this.state.searchState().query);
    diffResult = computed(() => this.state.diffResult());

    private currentDiffIdx = 0;
    private diffBlockIndices: number[] = [];

    currentDiffIndex = computed(() => {
        this.updateDiffBlocks();
        return this.currentDiffIdx;
    });

    totalDiffBlocks = computed(() => {
        this.updateDiffBlocks();
        return this.diffBlockIndices.length;
    });

    private updateDiffBlocks(): void {
        const result = this.state.diffResult();
        if (!result) { this.diffBlockIndices = []; return; }
        this.diffBlockIndices = result.inlineRows
            .map((line, idx) => ({ type: line.type, idx }))
            .filter(({ type }) => type !== 'unchanged' && type !== 'fold')
            .map(({ idx }) => idx);
    }

    onViewModeChange(mode: ViewMode): void {
        this.state.setViewMode(mode);
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.state.setSearch(query);
    }

    nextDiff(): void {
        this.updateDiffBlocks();
        if (this.diffBlockIndices.length === 0) return;
        this.currentDiffIdx = (this.currentDiffIdx + 1) % this.diffBlockIndices.length;
    }

    prevDiff(): void {
        this.updateDiffBlocks();
        if (this.diffBlockIndices.length === 0) return;
        this.currentDiffIdx = (this.currentDiffIdx - 1 + this.diffBlockIndices.length) % this.diffBlockIndices.length;
    }

    @HostListener('window:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            this.nextDiff();
        }
        if (event.altKey && event.key === 'ArrowUp') {
            event.preventDefault();
            this.prevDiff();
        }
        if (event.ctrlKey && event.key === 'f') {
            // Focus search — let browser handle focus naturally
        }
    }
}
