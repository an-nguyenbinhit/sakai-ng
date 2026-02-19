import { Component, computed, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileCompareState } from '../../services/file-compare-state.service';
import { SideBySideView } from './side-by-side-view';
import { InlineView } from './inline-view';

@Component({
    selector: 'p-diff-viewer',
    standalone: true,
    imports: [CommonModule, SideBySideView, InlineView],
    template: `
        <div class="h-[70vh] min-h-96">
            @if (viewMode() === 'side-by-side') {
                <p-side-by-side-view #sideBySide class="block h-full" />
            } @else {
                <p-inline-view #inline class="block h-full" />
            }
        </div>
    `
})
export class DiffViewer {
    private state = inject(FileCompareState);

    sideBySide = viewChild<SideBySideView>('sideBySide');
    inline = viewChild<InlineView>('inline');

    viewMode = computed(() => this.state.viewMode());

    scrollToIndex(index: number): void {
        this.sideBySide()?.scrollToIndex(index);
        this.inline()?.scrollToIndex(index);
    }
}
