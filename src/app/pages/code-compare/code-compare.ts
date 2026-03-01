import { Component, inject, computed, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeCompareState } from './services/code-compare-state.service';
import { CodeInput } from './components/code-input/code-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'p-code-compare',
    standalone: true,
    imports: [
        CommonModule,
        CodeInput, DiffToolbar, DiffSummary,
        DiffViewer, DiffMinimap,
        ButtonModule, TooltipModule
    ],
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
    private autoCollapseDone = false;

    constructor() {
        effect(() => {
            const hasBoth = this.hasBothFiles();
            if (hasBoth && !this.autoCollapseDone) {
                this.autoCollapseDone = true;
                setTimeout(() => this.inputCollapsed.set(true), 600);
            }
            if (!hasBoth) {
                this.autoCollapseDone = false;
                this.inputCollapsed.set(false);
            }
        });
    }

    ngOnInit(): void {
        this.state.reset();
    }
}
