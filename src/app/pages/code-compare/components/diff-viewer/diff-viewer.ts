import { Component, computed, inject, viewChild, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { SideBySideView } from './side-by-side-view';
import { InlineView } from './inline-view';

@Component({
    selector: 'p-diff-viewer',
    standalone: true,
    imports: [CommonModule, SideBySideView, InlineView],
    templateUrl: './diff-viewer.html',
    styleUrl: './diff-viewer.scss'
})
export class DiffViewer {
    private state = inject(CodeCompareState);

    sideBySide = viewChild<SideBySideView>('sideBySide');
    inline = viewChild<InlineView>('inline');

    viewMode = computed(() => this.state.viewMode());

    constructor() {
        effect(() => {
            const ss = this.state.searchState();
            if (ss.matchIndices.length === 0) return;
            const inlineIdx = ss.matchIndices[ss.currentMatchIndex];
            untracked(() => {
                this.inline()?.scrollToIndex(inlineIdx);
                const sbIdx = this.inlineToSideBySideIdx(inlineIdx);
                this.sideBySide()?.scrollToIndex(sbIdx);
            });
        });
    }

    // Convert an inlineRows index to its corresponding sideBySideRows index.
    // modified rows = 2 inline rows but 1 side-by-side row.
    private inlineToSideBySideIdx(inlineIdx: number): number {
        const rows = this.state.diffResult()?.sideBySideRows ?? [];
        let offset = 0;
        for (let i = 0; i < rows.length; i++) {
            const count = rows[i].left.type === 'modified' ? 2 : 1;
            if (inlineIdx < offset + count) return i;
            offset += count;
        }
        return Math.max(0, rows.length - 1);
    }

    scrollToIndex(index: number): void {
        this.sideBySide()?.scrollToIndex(index);
        this.inline()?.scrollToIndex(index);
    }
}
