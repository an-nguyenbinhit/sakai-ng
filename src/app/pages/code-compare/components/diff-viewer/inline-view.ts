import { Component, computed, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { DiffLineComponent } from '../diff-line/diff-line';
import { DiffLine } from '../../models/diff.models';

@Component({
    selector: 'p-inline-view',
    standalone: true,
    imports: [CommonModule, ScrollingModule, DiffLineComponent],
    templateUrl: './inline-view.html',
    styleUrl: './inline-view.scss'
})
export class InlineView {
    state = inject(CodeCompareState);

    viewport = viewChild.required<CdkVirtualScrollViewport>('viewport');

    rows = computed<DiffLine[]>(() => this.state.diffResult()?.inlineRows ?? []);
    leftName = computed(() => this.state.leftFile()?.name ?? 'Code A');
    rightName = computed(() => this.state.rightFile()?.name ?? 'Code B');
    searchQuery = computed(() => this.state.searchState().query);

    onScroll(_index: number): void {
        const el = this.viewport().elementRef.nativeElement;
        const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
        this.state.setScrollRatio(ratio);
    }

    trackLine(index: number, _line: DiffLine): number {
        return index;
    }

    scrollToIndex(index: number): void {
        this.viewport().scrollToIndex(index, 'smooth');
    }
}
