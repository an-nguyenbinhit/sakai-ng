import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { CodeCompareState } from './services/code-compare-state.service';
import { CodeInput } from './components/code-input/code-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';
import { ExportPanel } from './components/export-panel/export-panel';

@Component({
    selector: 'p-code-compare',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule, DividerModule, CardModule,
        CodeInput, DiffToolbar, DiffSummary,
        DiffViewer, DiffMinimap, ExportPanel
    ],
    templateUrl: './code-compare.html',
    styleUrl: './code-compare.scss'
})
export class CodeCompare {
    state = inject(CodeCompareState);

    hasAnyFile = computed(() => !!(this.state.leftFile() || this.state.rightFile()));
    hasBothFiles = computed(() => !!(this.state.leftFile() && this.state.rightFile()));
}
