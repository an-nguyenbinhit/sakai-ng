import { Component, computed, inject, signal, viewChild, AfterViewInit, OnDestroy, output, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FileCompareState } from '../../services/file-compare-state.service';
import { DiffLineComponent } from '../diff-line/diff-line';
import { SideBySideRow } from '../../models/diff.models';

const LINE_HEIGHT = 24; // px

@Component({
    selector: 'p-side-by-side-view',
    standalone: true,
    imports: [CommonModule, ScrollingModule, DiffLineComponent],
    template: `
        <div class="flex h-full border border-surface-200 dark:border-surface-700 rounded-border overflow-hidden">
            <!-- Left panel -->
            <div class="flex-1 flex flex-col min-w-0 border-r border-surface-200 dark:border-surface-700">
                <div class="px-3 py-1.5 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 text-xs font-medium text-surface-600 dark:text-surface-300 truncate">
                    {{ leftName() }}
                </div>
                <cdk-virtual-scroll-viewport
                    #leftViewport
                    [itemSize]="lineHeight"
                    class="flex-1 overflow-auto"
                    (scrolledIndexChange)="onLeftScroll($event)"
                >
                    <p-diff-line
                        *cdkVirtualFor="let row of rows(); trackBy: trackRow"
                        [line]="row.left"
                        [searchQuery]="searchQuery()"
                        (click)="onFoldClick(row)"
                    />
                </cdk-virtual-scroll-viewport>
            </div>

            <!-- Right panel -->
            <div class="flex-1 flex flex-col min-w-0">
                <div class="px-3 py-1.5 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 text-xs font-medium text-surface-600 dark:text-surface-300 truncate">
                    {{ rightName() }}
                </div>
                <cdk-virtual-scroll-viewport
                    #rightViewport
                    [itemSize]="lineHeight"
                    class="flex-1 overflow-auto"
                >
                    <p-diff-line
                        *cdkVirtualFor="let row of rows(); trackBy: trackRow"
                        [line]="row.right"
                        [searchQuery]="searchQuery()"
                        (click)="onFoldClick(row)"
                    />
                </cdk-virtual-scroll-viewport>
            </div>
        </div>
    `
})
export class SideBySideView implements AfterViewInit, OnDestroy {
    private state = inject(FileCompareState);

    leftViewport = viewChild.required<CdkVirtualScrollViewport>('leftViewport');
    rightViewport = viewChild.required<CdkVirtualScrollViewport>('rightViewport');

    readonly lineHeight = LINE_HEIGHT;

    rows = computed<SideBySideRow[]>(() => this.state.diffResult()?.sideBySideRows ?? []);
    leftName = computed(() => this.state.leftFile()?.name ?? 'File A');
    rightName = computed(() => this.state.rightFile()?.name ?? 'File B');
    searchQuery = computed(() => this.state.searchState().query);

    private syncing = false;
    private scrollListener: (() => void) | null = null;

    ngAfterViewInit(): void {
        // Sync right viewport scroll offset (not just index) to left
        const rightEl = this.rightViewport().elementRef.nativeElement;
        this.scrollListener = () => {
            if (!this.syncing) {
                this.syncing = true;
                const ratio = rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight || 1);
                this.state.setScrollRatio(ratio);
                this.syncing = false;
            }
        };
        rightEl.addEventListener('scroll', this.scrollListener);
    }

    ngOnDestroy(): void {
        if (this.scrollListener) {
            const rightEl = this.rightViewport().elementRef.nativeElement;
            rightEl.removeEventListener('scroll', this.scrollListener);
        }
    }

    onLeftScroll(index: number): void {
        if (this.syncing) return;
        this.syncing = true;
        this.rightViewport().scrollToIndex(index, 'instant');
        const leftEl = this.leftViewport().elementRef.nativeElement;
        const ratio = leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight || 1);
        this.state.setScrollRatio(ratio);
        this.syncing = false;
    }

    onFoldClick(row: SideBySideRow): void {
        // Expand fold: no-op for now (fold expansion handled in state)
    }

    trackRow(index: number, row: SideBySideRow): number {
        return row.index;
    }

    scrollToIndex(index: number): void {
        this.leftViewport().scrollToIndex(index, 'smooth');
        this.rightViewport().scrollToIndex(index, 'smooth');
    }
}
