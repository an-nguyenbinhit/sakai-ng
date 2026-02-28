import { Component, computed, inject, HostListener, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { ExportService } from '../../services/export.service';
import { DiffViewer } from '../diff-viewer/diff-viewer';
import { ViewMode } from '../../models/diff.models';

@Component({
    selector: 'p-diff-toolbar',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, SelectButtonModule, CheckboxModule,
        InputTextModule, TooltipModule, DividerModule,
        IconFieldModule, InputIconModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './diff-toolbar.html',
    styleUrl: './diff-toolbar.scss'
})
export class DiffToolbar {
    state = inject(CodeCompareState);
    private exportService = inject(ExportService);
    private messageService = inject(MessageService);

    imageStatus = signal<'idle' | 'exporting' | 'done'>('idle');
    imageLabel = computed(() => (this.imageStatus() === 'done' ? 'Saved!' : 'Export Image'));

    diffViewer = input<DiffViewer | null>(null);

    readonly viewOptions = [
        { label: 'Side by Side', value: 'side-by-side' as ViewMode },
        { label: 'Inline', value: 'inline' as ViewMode }
    ];

    viewMode = computed(() => this.state.viewMode());
    options = computed(() => this.state.options());
    searchState = computed(() => this.state.searchState());
    searchQuery = computed(() => this.state.searchState().query);
    diffResult = computed(() => this.state.diffResult());

    private currentDiffIdx = 0;
    private diffBlockIndices: number[] = [];

    currentDiffIndex = computed(() => {
        this.updateDiffBlocks();
        return this.currentDiffIdx;
    });

    totalDiffBlocks = computed(() => {
        this.updateDiffBlocks();
        return this.diffBlockIndices.length;
    });

    private updateDiffBlocks(): void {
        const result = this.state.diffResult();
        if (!result) { this.diffBlockIndices = []; return; }
        this.diffBlockIndices = result.inlineRows
            .map((line, idx) => ({ type: line.type, idx }))
            .filter(({ type }) => type !== 'unchanged' && type !== 'fold')
            .map(({ idx }) => idx);
    }

    onViewModeChange(mode: ViewMode): void {
        this.state.setViewMode(mode);
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.state.setSearch(query);
    }

    nextDiff(): void {
        this.updateDiffBlocks();
        if (this.diffBlockIndices.length === 0) return;
        this.currentDiffIdx = (this.currentDiffIdx + 1) % this.diffBlockIndices.length;
    }

    prevDiff(): void {
        this.updateDiffBlocks();
        if (this.diffBlockIndices.length === 0) return;
        this.currentDiffIdx = (this.currentDiffIdx - 1 + this.diffBlockIndices.length) % this.diffBlockIndices.length;
    }

    onExportHtml(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.exportService.exportHtml(result, leftFile, rightFile);
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'HTML diff file downloaded', life: 2000 });
    }

    onExportPdf(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.exportService.exportPdf(result, leftFile, rightFile);
        this.messageService.add({ severity: 'info', summary: 'Print dialog opened', detail: 'Save as PDF from the print dialog', life: 3000 });
    }

    onExportImage(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.imageStatus.set('exporting');
        try {
            this.exportService.exportImage(result, leftFile, rightFile);
            this.imageStatus.set('done');
            this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Diff image downloaded as PNG', life: 2000 });
            setTimeout(() => this.imageStatus.set('idle'), 2000);
        } catch {
            this.imageStatus.set('idle');
            this.messageService.add({ severity: 'error', summary: 'Export failed', detail: 'Could not generate image', life: 3000 });
        }
    }

    @HostListener('window:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            this.nextDiff();
        }
        if (event.altKey && event.key === 'ArrowUp') {
            event.preventDefault();
            this.prevDiff();
        }
        if (event.ctrlKey && event.key === 'f') {
            // Focus search — let browser handle focus naturally
        }
    }
}
