import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FileCompareState } from '../../services/file-compare-state.service';
import { ExportService } from '../../services/export.service';

@Component({
    selector: 'p-export-panel',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast position="bottom-right" />

        <div class="flex flex-wrap items-center gap-2 px-4 py-2 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-border">
            <span class="text-sm font-medium text-surface-600 dark:text-surface-300 mr-2">Export:</span>

            <p-button
                icon="pi pi-copy"
                [label]="copyLabel()"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="onCopy()"
                [loading]="copyStatus() === 'copying'"
                pTooltip="Copy unified diff to clipboard"
                tooltipPosition="top"
                aria-label="Copy unified diff to clipboard"
            />

            <p-button
                icon="pi pi-file-export"
                label="Export HTML"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="onExportHtml()"
                pTooltip="Download diff as self-contained HTML file"
                tooltipPosition="top"
                aria-label="Export diff as HTML"
            />

            <p-button
                icon="pi pi-download"
                label="Download .diff"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="onExportPatch()"
                pTooltip="Download unified diff patch file (.diff)"
                tooltipPosition="top"
                aria-label="Download .diff patch file"
            />
        </div>
    `
})
export class ExportPanel {
    private state = inject(FileCompareState);
    private exportService = inject(ExportService);
    private messageService = inject(MessageService);

    copyStatus = signal<'idle' | 'copying' | 'copied' | 'error'>('idle');

    copyLabel = computed(() => {
        switch (this.copyStatus()) {
            case 'copied': return 'Copied!';
            case 'error': return 'Failed';
            default: return 'Copy Diff';
        }
    });

    async onCopy(): Promise<void> {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.copyStatus.set('copying');
        try {
            await this.exportService.copyUnifiedDiff(result, leftFile.name, rightFile.name);
            this.copyStatus.set('copied');
            this.messageService.add({
                severity: 'success',
                summary: 'Copied',
                detail: 'Unified diff copied to clipboard',
                life: 2000
            });
            setTimeout(() => this.copyStatus.set('idle'), 2000);
        } catch {
            this.copyStatus.set('error');
            this.messageService.add({
                severity: 'error',
                summary: 'Copy failed',
                detail: 'Could not access clipboard',
                life: 3000
            });
            setTimeout(() => this.copyStatus.set('idle'), 3000);
        }
    }

    onExportHtml(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.exportService.exportHtml(result, leftFile, rightFile);
        this.messageService.add({
            severity: 'success',
            summary: 'Exported',
            detail: 'HTML diff file downloaded',
            life: 2000
        });
    }

    onExportPatch(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.exportService.exportPatch(result, leftFile, rightFile);
        this.messageService.add({
            severity: 'success',
            summary: 'Downloaded',
            detail: '.diff patch file downloaded',
            life: 2000
        });
    }
}
