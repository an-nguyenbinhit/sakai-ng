import { Component, computed, inject, viewChild } from '@angular/core';
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

    scrollToIndex(index: number): void {
        this.sideBySide()?.scrollToIndex(index);
        this.inline()?.scrollToIndex(index);
    }
}
