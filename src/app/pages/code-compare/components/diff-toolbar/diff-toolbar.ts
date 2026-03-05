import { Component, computed, inject, HostListener, input, signal, effect, untracked } from '@angular/core';
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
import { PopoverModule } from 'primeng/popover';
import { MenuModule } from 'primeng/menu';
import { MessageService, MenuItem } from 'primeng/api';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { ExportService } from '../../services/export.service';
import { DiffViewer } from '../diff-viewer/diff-viewer';
import { ViewMode } from '../../models/diff.models';

@Component({
    selector: 'p-diff-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectButtonModule, CheckboxModule, InputTextModule, TooltipModule, DividerModule, IconFieldModule, InputIconModule, ToastModule, PopoverModule, MenuModule],
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

    exportMenuItems: MenuItem[] = [
        {
            label: 'Export as HTML',
            icon: 'pi pi-file-export',
            command: () => this.onExportHtml()
        },
        {
            label: 'Export as Image',
            icon: 'pi pi-image',
            command: () => this.onExportImage()
        }
    ];

    diffViewer = input<DiffViewer | null>(null);

    readonly viewOptions = [
        { label: 'Side by Side', value: 'side-by-side' as ViewMode },
        { label: 'Inline', value: 'inline' as ViewMode }
    ];

    viewMode = computed(() => this.state.viewMode());
    options = computed(() => this.state.options());
    showAllUnchanged = computed(() => this.state.showAllUnchanged());
    searchState = computed(() => this.state.searchState());
    searchQuery = computed(() => this.state.searchState().query);
    diffResult = computed(() => this.state.diffResult());

    currentDiffIdx = signal(0);

    // Compute block starts as { sbIdx, inlineIdx } pairs.
    // modified rows = 1 side-by-side row but 2 inline rows, so indices diverge.
    private diffBlocks = computed<{ sbIdx: number; inlineIdx: number }[]>(() => {
        const result = this.state.diffResult();
        if (!result) return [];
        const blocks: { sbIdx: number; inlineIdx: number }[] = [];
        let prevChanged = false;
        let inlineOffset = 0;
        result.sideBySideRows.forEach((row, sbIdx) => {
            const isChanged = row.left.type === 'removed' || row.left.type === 'modified' || row.right.type === 'added';
            if (isChanged && !prevChanged) {
                blocks.push({ sbIdx, inlineIdx: inlineOffset });
            }
            inlineOffset += row.left.type === 'modified' ? 2 : 1;
            prevChanged = isChanged;
        });
        return blocks;
    });

    totalDiffBlocks = computed(() => this.diffBlocks().length);
    currentDiffIndex = computed(() => this.currentDiffIdx());

    constructor() {
        // Reset navigation index when diff changes
        effect(() => {
            this.diffBlocks();
            untracked(() => this.currentDiffIdx.set(0));
        });
    }

    onViewModeChange(mode: ViewMode): void {
        this.state.setViewMode(mode);
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.state.setSearch(query);
    }

    nextDiff(): void {
        const blocks = this.diffBlocks();
        if (blocks.length === 0) return;
        const next = (this.currentDiffIdx() + 1) % blocks.length;
        this.currentDiffIdx.set(next);
        this.scrollToBlock(blocks[next]);
    }

    prevDiff(): void {
        const blocks = this.diffBlocks();
        if (blocks.length === 0) return;
        const prev = (this.currentDiffIdx() - 1 + blocks.length) % blocks.length;
        this.currentDiffIdx.set(prev);
        this.scrollToBlock(blocks[prev]);
    }

    private scrollToBlock(block: { sbIdx: number; inlineIdx: number }): void {
        const idx = this.state.viewMode() === 'side-by-side' ? block.sbIdx : block.inlineIdx;
        this.diffViewer()?.scrollToIndex(idx);
    }

    onExportHtml(): void {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.exportService.exportHtml(result, leftFile, rightFile, this.state.viewMode(), this.state.options(), this.state.fontSize());
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'HTML diff file downloaded', life: 2000 });
    }

    async onExportImage(): Promise<void> {
        const result = this.state.diffResult();
        const leftFile = this.state.leftFile();
        const rightFile = this.state.rightFile();
        if (!result || !leftFile || !rightFile) return;

        this.imageStatus.set('exporting');
        try {
            await this.exportService.exportImage(result, leftFile, rightFile, this.state.viewMode(), this.state.options(), this.state.fontSize());
            this.imageStatus.set('done');
            this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Diff image downloaded as PNG', life: 2000 });
            setTimeout(() => this.imageStatus.set('idle'), 2000);
        } catch (err) {
            this.imageStatus.set('idle');
            const detail = err instanceof Error ? err.message : 'Could not generate image';
            this.messageService.add({ severity: 'error', summary: 'Export failed', detail, life: 4000 });
        }
    }

    @HostListener('window:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            this.nextDiff();
        } else if (event.altKey && event.key === 'ArrowUp') {
            event.preventDefault();
            this.prevDiff();
        }
    }
}
