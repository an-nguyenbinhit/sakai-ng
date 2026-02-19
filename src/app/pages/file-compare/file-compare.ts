import { Component, inject, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { FileCompareState } from './services/file-compare-state.service';
import { FileInput } from './components/file-input/file-input';
import { DiffToolbar } from './components/diff-toolbar/diff-toolbar';
import { DiffSummary } from './components/diff-summary/diff-summary';
import { DiffViewer } from './components/diff-viewer/diff-viewer';
import { DiffMinimap } from './components/diff-minimap/diff-minimap';
import { ExportPanel } from './components/export-panel/export-panel';

@Component({
    selector: 'p-file-compare',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule, DividerModule, CardModule,
        FileInput, DiffToolbar, DiffSummary,
        DiffViewer, DiffMinimap, ExportPanel
    ],
    template: `
        <div class="flex flex-col gap-4 p-4">
            <!-- Page header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-surface-800 dark:text-surface-100">File Compare</h1>
                    <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                        Compare two files or text snippets — all processing happens locally in your browser.
                    </p>
                </div>
                <div class="flex items-center gap-2 text-xs text-surface-400">
                    <i class="pi pi-lock text-green-500"></i>
                    <span>Privacy-first · No data uploaded</span>
                </div>
            </div>

            @if (!hasBothFiles()) {
                <!-- Input zone: shown when not yet comparing -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-border">
                        <p-file-input side="left" />
                    </div>
                    <div class="p-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-border">
                        <p-file-input side="right" />
                    </div>
                </div>
            }

            @if (hasAnyFile() && !hasBothFiles()) {
                <!-- Only one file loaded -->
                <div class="flex items-center justify-center p-4 text-surface-400 border border-dashed border-surface-200 dark:border-surface-700 rounded-border">
                    <i class="pi pi-info-circle mr-2"></i>
                    <span>Please load the {{ state.leftFile() ? 'right' : 'left' }} file to start comparing.</span>
                </div>
            }

            @if (hasBothFiles()) {
                <!-- Controls: shown when comparing -->
                <div class="flex gap-2">
                    <p-button
                        icon="pi pi-arrow-left"
                        label="Change files"
                        severity="secondary"
                        [text]="true"
                        size="small"
                        (onClick)="state.clearAll()"
                    />
                </div>

                <p-diff-toolbar />
                <p-diff-summary />

                <!-- Diff viewer + minimap -->
                <div class="flex gap-3">
                    <div class="flex-1 min-w-0">
                        <p-diff-viewer #viewer />
                    </div>
                    <div class="w-14 shrink-0">
                        <p-diff-minimap />
                    </div>
                </div>

                <p-export-panel />
            }
        </div>
    `
})
export class FileCompare {
    state = inject(FileCompareState);

    hasAnyFile = computed(() => !!(this.state.leftFile() || this.state.rightFile()));
    hasBothFiles = computed(() => !!(this.state.leftFile() && this.state.rightFile()));
}
