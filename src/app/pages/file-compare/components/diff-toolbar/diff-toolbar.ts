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
import { FileCompareState } from '../../services/file-compare-state.service';
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
    template: `
        <div class="flex flex-wrap items-center gap-3 px-4 py-2 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-border">

            <!-- View mode -->
            <p-selectbutton
                [options]="viewOptions"
                optionLabel="label"
                optionValue="value"
                [ngModel]="viewMode()"
                (ngModelChange)="onViewModeChange($event)"
                size="small"
            />

            <p-divider layout="vertical" styleClass="!m-0 !h-6" />

            <!-- Ignore options -->
            <div class="flex flex-wrap items-center gap-3 text-sm">
                <label class="flex items-center gap-1.5 cursor-pointer">
                    <p-checkbox
                        [binary]="true"
                        [ngModel]="options().ignoreWhitespace"
                        (ngModelChange)="state.updateOptions({ ignoreWhitespace: $event })"
                        inputId="ignoreWS"
                    />
                    <span>Ignore whitespace</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                    <p-checkbox
                        [binary]="true"
                        [ngModel]="options().ignoreCase"
                        (ngModelChange)="state.updateOptions({ ignoreCase: $event })"
                        inputId="ignoreCase"
                    />
                    <span>Ignore case</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                    <p-checkbox
                        [binary]="true"
                        [ngModel]="options().ignoreBlankLines"
                        (ngModelChange)="state.updateOptions({ ignoreBlankLines: $event })"
                        inputId="ignoreBlank"
                    />
                    <span>Ignore blank lines</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                    <p-checkbox
                        [binary]="true"
                        [ngModel]="options().wordDiff"
                        (ngModelChange)="state.updateOptions({ wordDiff: $event })"
                        inputId="wordDiff"
                    />
                    <span>Word diff</span>
                </label>
            </div>

            <p-divider layout="vertical" styleClass="!m-0 !h-6" />

            <!-- Navigation -->
            <div class="flex items-center gap-1">
                <p-button
                    icon="pi pi-angle-up"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    (onClick)="prevDiff()"
                    pTooltip="Previous diff (Alt+↑)"
                    tooltipPosition="top"
                    aria-label="Previous diff"
                />
                <p-button
                    icon="pi pi-angle-down"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    (onClick)="nextDiff()"
                    pTooltip="Next diff (Alt+↓)"
                    tooltipPosition="top"
                    aria-label="Next diff"
                />
                @if (diffResult()) {
                    <span class="text-xs text-surface-400 px-1">
                        {{ currentDiffIndex() + 1 }}/{{ totalDiffBlocks() }}
                    </span>
                }
            </div>

            <p-divider layout="vertical" styleClass="!m-0 !h-6" />

            <!-- Search -->
            <p-iconfield>
                <p-inputicon class="pi pi-search" />
                <input
                    pInputText
                    type="text"
                    size="small"
                    placeholder="Search... (Ctrl+F)"
                    [value]="searchQuery()"
                    (input)="onSearch($event)"
                    class="!text-sm"
                    style="width:180px"
                    aria-label="Search in diff"
                />
            </p-iconfield>

            @if (searchState().matchIndices.length > 0) {
                <span class="text-xs text-surface-500">
                    {{ searchState().currentMatchIndex + 1 }}/{{ searchState().matchIndices.length }}
                </span>
                <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" size="small" (onClick)="state.prevMatch()" />
                <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" size="small" (onClick)="state.nextMatch()" />
            }

            <div class="ml-auto flex items-center gap-1">
                <!-- Clear -->
                <p-button
                    icon="pi pi-times"
                    label="Clear all"
                    severity="secondary"
                    [outlined]="true"
                    size="small"
                    (onClick)="state.clearAll()"
                    pTooltip="Clear all files and start over"
                />
                <!-- Swap -->
                <p-button
                    icon="pi pi-arrows-h"
                    label="Swap"
                    severity="secondary"
                    [outlined]="true"
                    size="small"
                    (onClick)="state.swapFiles()"
                    pTooltip="Swap left and right files"
                />
            </div>
        </div>
    `
})
export class DiffToolbar {
    state = inject(FileCompareState);

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
