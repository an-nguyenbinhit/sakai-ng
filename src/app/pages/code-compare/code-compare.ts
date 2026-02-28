import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { CodeCompareState } from './services/code-compare-state.service';
import { CodeInput } from './components/code-input/code-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';
@Component({
    selector: 'p-code-compare',
    standalone: true,
    imports: [
        CommonModule, TooltipModule,
        CodeInput, DiffToolbar, DiffSummary,
        DiffViewer, DiffMinimap
    ],
    templateUrl: './code-compare.html',
    styleUrl: './code-compare.scss'
})
export class CodeCompare {
    state = inject(CodeCompareState);

    hasAnyFile = computed(() => !!(this.state.leftFile() || this.state.rightFile()));
    hasBothFiles = computed(() => !!(this.state.leftFile() && this.state.rightFile()));
}
