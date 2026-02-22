import { Component, computed, inject, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { DiffLineComponent } from '../diff-line/diff-line';
import { SideBySideRow } from '../../models/diff.models';

const LINE_HEIGHT = 24; // px

@Component({
    selector: 'p-side-by-side-view',
    standalone: true,
    imports: [CommonModule, ScrollingModule, DiffLineComponent],
    templateUrl: './side-by-side-view.html',
    styleUrl: './side-by-side-view.scss'
})
export class SideBySideView implements AfterViewInit, OnDestroy {
    private state = inject(CodeCompareState);

    leftViewport = viewChild.required<CdkVirtualScrollViewport>('leftViewport');
    rightViewport = viewChild.required<CdkVirtualScrollViewport>('rightViewport');

    readonly lineHeight = LINE_HEIGHT;

    rows = computed<SideBySideRow[]>(() => this.state.diffResult()?.sideBySideRows ?? []);
    leftName = computed(() => this.state.leftFile()?.name ?? 'Code A');
    rightName = computed(() => this.state.rightFile()?.name ?? 'Code B');
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
        const hunkIndex = row.left.hunkIndex ?? row.right.hunkIndex;
        if (hunkIndex !== undefined) {
            this.state.expandFold(hunkIndex);
        }
    }

    trackRow(index: number, row: SideBySideRow): number {
        return row.index;
    }

    scrollToIndex(index: number): void {
        this.leftViewport().scrollToIndex(index, 'smooth');
        this.rightViewport().scrollToIndex(index, 'smooth');
    }
}
