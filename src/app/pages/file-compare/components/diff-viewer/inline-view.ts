import { Component, computed, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FileCompareState } from '../../services/file-compare-state.service';
import { DiffLineComponent } from '../diff-line/diff-line';
import { DiffLine } from '../../models/diff.models';

const LINE_HEIGHT = 24; // px

@Component({
    selector: 'p-inline-view',
    standalone: true,
    imports: [CommonModule, ScrollingModule, DiffLineComponent],
    template: `
        <div class="flex flex-col h-full border border-surface-200 dark:border-surface-700 rounded-border overflow-hidden">
            <!-- Header -->
            <div class="flex px-3 py-1.5 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 text-xs font-medium text-surface-600 dark:text-surface-300 gap-3">
                <span>{{ leftName() }}</span>
                <span class="text-surface-300 dark:text-surface-600">↔</span>
                <span>{{ rightName() }}</span>
            </div>

            <cdk-virtual-scroll-viewport
                #viewport
                [itemSize]="lineHeight"
                class="flex-1 overflow-auto"
                (scrolledIndexChange)="onScroll($event)"
            >
                <p-diff-line
                    *cdkVirtualFor="let line of rows(); trackBy: trackLine"
                    [line]="line"
                    [searchQuery]="searchQuery()"
                />
            </cdk-virtual-scroll-viewport>
        </div>
    `
})
export class InlineView {
    private state = inject(FileCompareState);

    viewport = viewChild.required<CdkVirtualScrollViewport>('viewport');

    readonly lineHeight = LINE_HEIGHT;

    rows = computed<DiffLine[]>(() => this.state.diffResult()?.inlineRows ?? []);
    leftName = computed(() => this.state.leftFile()?.name ?? 'File A');
    rightName = computed(() => this.state.rightFile()?.name ?? 'File B');
    searchQuery = computed(() => this.state.searchState().query);

    onScroll(index: number): void {
        const el = this.viewport().elementRef.nativeElement;
        const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
        this.state.setScrollRatio(ratio);
    }

    trackLine(index: number, line: DiffLine): number {
        return index;
    }

    scrollToIndex(index: number): void {
        this.viewport().scrollToIndex(index, 'smooth');
    }
}
