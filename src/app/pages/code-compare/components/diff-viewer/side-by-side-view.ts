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
    private leftScrollListener: (() => void) | null = null;
    private rightScrollListener: (() => void) | null = null;

    ngAfterViewInit(): void {
        const leftEl = this.leftViewport().elementRef.nativeElement;
        const rightEl = this.rightViewport().elementRef.nativeElement;

        this.leftScrollListener = () => {
            if (this.syncing) return;
            this.syncing = true;
            const ratio = leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight || 1);
            rightEl.scrollTop = ratio * (rightEl.scrollHeight - rightEl.clientHeight);
            this.state.setScrollRatio(ratio);
            this.syncing = false;
        };

        this.rightScrollListener = () => {
            if (this.syncing) return;
            this.syncing = true;
            const ratio = rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight || 1);
            leftEl.scrollTop = ratio * (leftEl.scrollHeight - leftEl.clientHeight);
            this.state.setScrollRatio(ratio);
            this.syncing = false;
        };

        leftEl.addEventListener('scroll', this.leftScrollListener);
        rightEl.addEventListener('scroll', this.rightScrollListener);
    }

    ngOnDestroy(): void {
        const leftEl = this.leftViewport().elementRef.nativeElement;
        const rightEl = this.rightViewport().elementRef.nativeElement;
        if (this.leftScrollListener) leftEl.removeEventListener('scroll', this.leftScrollListener);
        if (this.rightScrollListener) rightEl.removeEventListener('scroll', this.rightScrollListener);
    }

    trackRow(index: number, row: SideBySideRow): number {
        return row.index;
    }

    scrollToIndex(index: number): void {
        this.leftViewport().scrollToIndex(index, 'smooth');
        this.rightViewport().scrollToIndex(index, 'smooth');
    }
}
