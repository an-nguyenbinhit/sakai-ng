import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { ExportService } from '../../services/export.service';

@Component({
    selector: 'p-export-panel',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule, ToastModule],
    providers: [MessageService],
    templateUrl: './export-panel.html',
    styleUrl: './export-panel.scss'
})
export class ExportPanel {
    private state = inject(CodeCompareState);
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
