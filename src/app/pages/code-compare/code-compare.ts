import { Component, inject, computed, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeCompareState } from './services/code-compare-state.service';
import { CodeInput } from './components/code-input/code-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';

@Component({
    selector: 'p-code-compare',
    standalone: true,
    imports: [CommonModule, CodeInput, DiffToolbar, DiffSummary, DiffViewer, DiffMinimap],
    templateUrl: './code-compare.html',
    styleUrl: './code-compare.scss'
})
export class CodeCompare implements OnInit {
    state = inject(CodeCompareState);

    hasAnyFile = computed(() => !!(this.state.leftFile() || this.state.rightFile()));
    hasBothFiles = computed(() => !!(this.state.leftFile() && this.state.rightFile()));
    leftLineCount = computed(() => this.state.leftFile()?.content.split('\n').length ?? 0);
    rightLineCount = computed(() => this.state.rightFile()?.content.split('\n').length ?? 0);

    inputCollapsed = signal(false);

    constructor() {
        effect(() => {
            if (!this.hasBothFiles()) {
                this.inputCollapsed.set(false);
            }
        });
    }

    onInputPanelBlur(event: FocusEvent): void {
        const container = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (this.hasBothFiles() && (!relatedTarget || !container.contains(relatedTarget))) {
            this.inputCollapsed.set(true);
        }
    }

    ngOnInit(): void {
        this.state.reset();
    }
}
