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

    imageStatus = signal<'idle' | 'exporting' | 'done'>('idle');

    imageLabel = computed(() => (this.imageStatus() === 'done' ? 'Saved!' : 'Export Image'));

    onExportHtml(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.exportService.exportHtml(result, leftFile, rightFile, this.state.viewMode(), this.state.options());
        this.messageService.add({
            severity: 'success',
            summary: 'Exported',
            detail: 'HTML diff file downloaded',
            life: 2000
        });
    }

    async onExportImage(): Promise<void> {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.imageStatus.set('exporting');
        try {
            await this.exportService.exportImage(result, leftFile, rightFile, this.state.viewMode(), this.state.options());
            this.imageStatus.set('done');
            this.messageService.add({
                severity: 'success',
                summary: 'Exported',
                detail: 'Diff image downloaded as PNG',
                life: 2000
            });
            setTimeout(() => this.imageStatus.set('idle'), 2000);
        } catch (err) {
            this.imageStatus.set('idle');
            this.messageService.add({
                severity: 'error',
                summary: 'Export failed',
                detail: err instanceof Error ? err.message : 'Could not generate image',
                life: 4000
            });
        }
    }
}
