import { ChangeDetectionStrategy, Component, Signal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { LayoutService } from '@/app/layout/service/layout.service';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { calculateTextMetrics } from '@/app/shared/utils/text-metrics';
import { SqlMergeEngineService } from './sql-merge-engine.service';
import { SqlMergeExportService } from './sql-merge-export.service';
import { SqlMergeFileIntakeService } from './sql-merge-file-intake.service';
import { SqlDuplicatePolicy, SqlGoSeparatorPolicy, SqlMergeBlockMarker, SqlMergeFileItem, SqlMergeOptions, SqlMergeSampleDefinition, SqlNonSqlPolicy } from './sql-merge.models';
import { SQL_MERGE_DEFAULT_HEADER_TEMPLATE, SQL_MERGE_SAMPLES } from './sql-merge.samples';

const DEFAULT_OPTIONS: SqlMergeOptions = {
    includeHeaders: true,
    includeFileStats: true,
    separatorLines: 2,
    trimTrailingWhitespace: false,
    ensureTrailingNewline: true,
    includeGoSeparator: 'preserve',
    headerTemplate: SQL_MERGE_DEFAULT_HEADER_TEMPLATE,
    outputFileName: 'merged-output.sql',
    duplicatePolicy: 'skip',
    nonSqlPolicy: 'warn-and-allow'
};

@Component({
    selector: 'app-sql-merge',
    standalone: true,
    imports: [CommonModule, FormsModule, EditorComponent, ButtonModule, InputTextModule, SelectModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './sql-merge.html',
    styleUrl: './sql-merge.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlMerge {
    readonly samples = SQL_MERGE_SAMPLES;
    readonly duplicatePolicyOptions: Array<{ label: string; value: SqlDuplicatePolicy }> = [
        { label: 'Skip duplicates', value: 'skip' },
        { label: 'Keep both', value: 'keep-both' }
    ];
    readonly nonSqlPolicyOptions: Array<{ label: string; value: SqlNonSqlPolicy }> = [
        { label: 'Warn and allow', value: 'warn-and-allow' },
        { label: 'Block', value: 'block' }
    ];
    readonly goSeparatorOptions: Array<{ label: string; value: SqlGoSeparatorPolicy }> = [
        { label: 'Preserve source GO', value: 'preserve' },
        { label: 'Force between files', value: 'force-between-files' },
        { label: 'Strip standalone GO', value: 'off' }
    ];
    readonly items = signal<SqlMergeFileItem[]>([]);
    readonly options = signal<SqlMergeOptions>({ ...DEFAULT_OPTIONS });
    readonly searchTerm = signal('');
    readonly isDragging = signal(false);
    readonly isProcessing = signal(false);
    readonly isPreviewEditing = signal(false);
    readonly skippedDuplicates = signal(0);
    readonly lastActionMessage = signal('Drop SQL files here or use Add Files to start a merge job.');
    readonly draggedItemId = signal<string | null>(null);
    readonly lastGeneratedPreview = signal('');
    readonly editablePreview = signal('');
    readonly activePreviewBlockOrder = signal<number | null>(null);
    readonly filteredItems: Signal<SqlMergeFileItem[]>;
    readonly selectedCount: Signal<number>;
    readonly totalSize: Signal<number>;
    readonly mergeResult: Signal<ReturnType<SqlMergeEngineService['merge']>>;
    readonly previewText: Signal<string>;
    readonly previewMetrics: Signal<ReturnType<typeof calculateTextMetrics>>;
    readonly previewEditorOptions: Signal<Record<string, unknown>>;
    readonly canShowPreviewBlocks: Signal<boolean>;
    readonly previewBlocks: Signal<SqlMergeBlockMarker[]>;
    readonly shellStats: Signal<Array<{ icon: string; label: string }>>;
    readonly validationSummary: Signal<{ tone: 'warning' | 'ok'; text: string }>;
    readonly diagnostics: Signal<Array<{ tone: 'warn' | 'info'; text: string }>>;
    readonly hasDiagnostics: Signal<boolean>;
    private previewEditorInstance: any;
    private previewDecorations: string[] = [];

    constructor(
        private intakeService: SqlMergeFileIntakeService,
        private mergeEngine: SqlMergeEngineService,
        private exportService: SqlMergeExportService,
        private messageService: MessageService,
        private layoutService: LayoutService
    ) {
        this.filteredItems = computed(() => {
            const term = this.searchTerm().trim().toLowerCase();
            if (!term) {
                return this.items();
            }

            return this.items().filter((item) => item.name.toLowerCase().includes(term));
        });
        this.selectedCount = computed(() => this.items().filter((item) => item.selected).length);
        this.totalSize = computed(() => this.items().reduce((sum, item) => sum + item.size, 0));
        this.mergeResult = computed(() => this.mergeEngine.merge(this.items(), this.options(), this.skippedDuplicates()));
        this.previewText = computed(() => this.editablePreview());
        this.previewMetrics = computed(() => calculateTextMetrics(this.editablePreview()));
        this.previewEditorOptions = computed(() => ({
            theme: this.layoutService.isDarkTheme() ? 'vs-dark' : 'vs-light',
            language: 'sql',
            automaticLayout: true,
            readOnly: !this.isPreviewEditing(),
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            glyphMargin: true,
            lineDecorationsWidth: 12,
            lineNumbersMinChars: 3,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            padding: { top: 12, bottom: 12 },
            overviewRulerBorder: false
        }));
        this.canShowPreviewBlocks = computed(() => this.items().length > 0 && this.editablePreview() === this.lastGeneratedPreview() && this.mergeResult().blocks.length > 0);
        this.previewBlocks = computed(() => this.canShowPreviewBlocks() ? this.mergeResult().blocks : []);
        this.shellStats = computed(() => [
            { icon: 'pi pi-database', label: `${this.items().length} files queued` },
            { icon: 'pi pi-file', label: `${this.totalSize()} input bytes` },
            { icon: 'pi pi-download', label: `${this.previewMetrics().bytes} merged bytes` }
        ]);
        this.validationSummary = computed(() => {
            const warnings = this.mergeResult().warnings.length;
            const selected = this.selectedCount();
            const skipped = this.skippedDuplicates();
            return {
                tone: warnings > 0 ? 'warning' : 'ok',
                text: [
                    warnings > 0 ? `${warnings} warnings` : 'No validation warnings',
                    skipped > 0 ? `${skipped} duplicates skipped` : 'No duplicates skipped',
                    selected > 0 ? `${selected} selected for bulk actions` : 'Nothing selected',
                    this.isPreviewEditing() ? 'Manual edit mode enabled' : 'Generated preview in sync'
                ].join(' | ')
            };
        });
        this.diagnostics = computed(() => {
            const items = this.items();
            const result = this.mergeResult();
            const diagnostics: Array<{ tone: 'warn' | 'info'; text: string }> = [];
            const emptyFiles = items.filter((item) => item.issues.includes('File is empty.')).length;
            const nonSqlFiles = items.filter((item) => item.issues.some((issue) => issue.startsWith('Non-standard extension'))).length;
            const previewEdited = this.editablePreview() !== this.lastGeneratedPreview();

            if (result.skippedDuplicates > 0) {
                diagnostics.push({ tone: 'warn', text: `${result.skippedDuplicates} duplicate file(s) were skipped during intake.` });
            }

            if (emptyFiles > 0) {
                diagnostics.push({ tone: 'warn', text: `${emptyFiles} empty file(s) are included in the current merge.` });
            }

            if (nonSqlFiles > 0) {
                diagnostics.push({ tone: 'warn', text: `${nonSqlFiles} non-SQL file(s) were allowed into the queue.` });
            }

            if (result.forcedGoCount > 0) {
                diagnostics.push({ tone: 'info', text: `${result.forcedGoCount} GO separator(s) were injected between files.` });
            }

            if (previewEdited) {
                diagnostics.push({ tone: 'info', text: 'Preview has manual edits that differ from the generated merge output.' });
            }

            return diagnostics;
        });
        this.hasDiagnostics = computed(() => this.diagnostics().length > 0);

        this.syncPreviewWithGenerated();
    }

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        await this.addFiles(files);
        input.value = '';
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(true);
    }

    onDragEnter(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        const relatedTarget = event.relatedTarget as Node | null;
        if (!relatedTarget) {
            this.isDragging.set(false);
        }
    }

    async onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);
        const files = Array.from(event.dataTransfer?.files ?? []);
        await this.addFiles(files);
    }

    async loadSampleSet(sample: SqlMergeSampleDefinition) {
        const files = sample.files.map(
            (file, index) =>
                new File([file.content], file.name, {
                    type: file.type ?? 'text/sql',
                    lastModified: file.lastModified ?? Date.now() - (sample.files.length - index) * 1000
                })
        );

        await this.addFiles(files);
        this.messageService.add({
            severity: 'success',
            summary: 'Sample loaded',
            detail: `${sample.files.length} sample files added from "${sample.label}".`
        });
    }

    async addFiles(files: File[]) {
        if (!files.length || this.isProcessing()) {
            return;
        }

        this.isProcessing.set(true);
        try {
            const intake = await this.intakeService.intake(files, this.items(), this.options());
            if (intake.accepted.length) {
                this.items.update((current) => [...current, ...intake.accepted]);
                this.lastActionMessage.set(`Added ${intake.accepted.length} file(s) to the merge queue.`);
            }

            if (intake.skippedDuplicates) {
                this.skippedDuplicates.update((count) => count + intake.skippedDuplicates);
                this.messageService.add({
                    severity: 'info',
                    summary: 'Duplicates skipped',
                    detail: `${intake.skippedDuplicates} duplicate file(s) were skipped.`
                });
            }

            if (intake.rejected.length) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Some files were rejected',
                    detail: intake.rejected.map((item) => `${item.name}: ${item.reason}`).join(' | ')
                });
            }
            this.syncPreviewWithGenerated();
        } finally {
            this.isProcessing.set(false);
        }
    }

    toggleSelection(itemId: string, selected: boolean) {
        this.items.update((items) => items.map((item) => (item.id === itemId ? { ...item, selected } : item)));
    }

    toggleSelectAll(selected: boolean) {
        const visibleIds = new Set(this.filteredItems().map((item) => item.id));
        this.items.update((items) => items.map((item) => (visibleIds.has(item.id) ? { ...item, selected } : item)));
    }

    areAllVisibleSelected() {
        const visible = this.filteredItems();
        return visible.length > 0 && visible.every((item) => item.selected);
    }

    onToggleSelectAll(event: Event) {
        this.toggleSelectAll((event.target as HTMLInputElement).checked);
    }

    onToggleSelection(itemId: string, event: Event) {
        this.toggleSelection(itemId, (event.target as HTMLInputElement).checked);
    }

    removeSelected() {
        const selectedCount = this.selectedCount();
        if (!selectedCount) {
            return;
        }

        this.items.update((items) => items.filter((item) => !item.selected));
        this.lastActionMessage.set(`Removed ${selectedCount} selected file(s).`);
        this.syncPreviewWithGenerated();
        this.messageService.add({
            severity: 'success',
            summary: 'Removed',
            detail: `${selectedCount} selected file(s) removed from the queue.`
        });
    }

    clearAll() {
        if (!this.items().length) {
            return;
        }

        this.items.set([]);
        this.searchTerm.set('');
        this.skippedDuplicates.set(0);
        this.lastActionMessage.set('Merge queue cleared.');
        this.syncPreviewWithGenerated();
        this.messageService.add({
            severity: 'success',
            summary: 'Cleared',
            detail: 'All queued files were removed.'
        });
    }

    moveSelected(direction: 'top' | 'up' | 'down' | 'bottom') {
        const selectedIds = this.items()
            .filter((item) => item.selected)
            .map((item) => item.id);

        if (!selectedIds.length) {
            return;
        }

        this.items.update((items) => this.reorderSelected(items, selectedIds, direction));
        this.syncPreviewWithGenerated();
    }

    startDrag(itemId: string) {
        this.draggedItemId.set(itemId);
    }

    dropOnItem(targetId: string) {
        const sourceId = this.draggedItemId();
        this.draggedItemId.set(null);

        if (!sourceId || sourceId === targetId) {
            return;
        }

        this.items.update((items) => {
            const sourceIndex = items.findIndex((item) => item.id === sourceId);
            const targetIndex = items.findIndex((item) => item.id === targetId);
            if (sourceIndex < 0 || targetIndex < 0) {
                return items;
            }

            const next = [...items];
            const [moved] = next.splice(sourceIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        this.syncPreviewWithGenerated();
    }

    cancelDrag() {
        this.draggedItemId.set(null);
    }

    openFilePicker(fileInput: HTMLInputElement) {
        if (this.isProcessing()) {
            return;
        }

        fileInput.click();
    }

    updateOption<K extends keyof SqlMergeOptions>(key: K, value: SqlMergeOptions[K]) {
        this.options.update((options) => ({ ...options, [key]: value }));
        this.syncPreviewWithGenerated();
    }

    onOptionCheckboxChange<K extends keyof SqlMergeOptions>(key: K, event: Event) {
        this.updateOption(key, (event.target as HTMLInputElement).checked as SqlMergeOptions[K]);
    }

    resetHeaderTemplate() {
        this.updateOption('headerTemplate', SQL_MERGE_DEFAULT_HEADER_TEMPLATE);
    }

    togglePreviewEditing() {
        this.isPreviewEditing.update((value) => !value);
        this.applyPreviewDecorations();
    }

    onPreviewTextChange(value: string) {
        this.editablePreview.set(value);
        if (value !== this.lastGeneratedPreview()) {
            this.isPreviewEditing.set(true);
        }
        this.applyPreviewDecorations();
    }

    resetPreviewToGenerated() {
        this.editablePreview.set(this.lastGeneratedPreview());
        this.isPreviewEditing.set(false);
        this.syncPreviewBlockState();
        this.applyPreviewDecorations();
    }

    onPreviewEditorInit(editor: any) {
        this.previewEditorInstance = editor;
        editor.onDidChangeCursorPosition((event: { position: { lineNumber: number } }) => {
            this.updateActivePreviewBlock(event.position.lineNumber);
        });
        this.syncPreviewBlockState();
        this.applyPreviewDecorations();
    }

    focusPreviewBlock(block: SqlMergeBlockMarker) {
        this.activePreviewBlockOrder.set(block.order);

        if (!this.previewEditorInstance) {
            return;
        }

        this.previewEditorInstance.focus();
        this.previewEditorInstance.revealLineInCenter(block.startLine);
        this.previewEditorInstance.setPosition({ lineNumber: block.startLine, column: 1 });
    }

    downloadSql() {
        if (!this.items().length || this.isProcessing()) {
            return;
        }

        const ok = this.exportService.exportSql(this.options().outputFileName, this.editablePreview());
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Merged SQL file downloaded from the current preview.' : 'File download is unavailable in this context.'
        });
    }

    downloadManifest() {
        if (!this.items().length || this.isProcessing()) {
            return;
        }

        const baseName = this.options().outputFileName.replace(/\.sql$/i, '') || 'merged-output';
        const ok = this.exportService.exportManifest(`${baseName}.manifest.json`, this.mergeResult());
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Merge manifest downloaded.' : 'File download is unavailable in this context.'
        });
    }
    trackByItem(_: number, item: SqlMergeFileItem) {
        return item.id;
    }

    trackBySample(_: number, sample: SqlMergeSampleDefinition) {
        return sample.label;
    }

    trackByPreviewBlock(_: number, block: SqlMergeBlockMarker) {
        return `${block.order}-${block.name}`;
    }

    previewBlockToneClass(block: SqlMergeBlockMarker) {
        return `preview-blocks__chip--tone-${block.toneIndex}`;
    }

    private reorderSelected(items: SqlMergeFileItem[], selectedIds: string[], direction: 'top' | 'up' | 'down' | 'bottom') {
        const selectedSet = new Set(selectedIds);
        const next = [...items];

        if (direction === 'top') {
            const selected = next.filter((item) => selectedSet.has(item.id));
            const remaining = next.filter((item) => !selectedSet.has(item.id));
            return [...selected, ...remaining];
        }

        if (direction === 'bottom') {
            const selected = next.filter((item) => selectedSet.has(item.id));
            const remaining = next.filter((item) => !selectedSet.has(item.id));
            return [...remaining, ...selected];
        }

        if (direction === 'up') {
            for (let index = 1; index < next.length; index += 1) {
                if (selectedSet.has(next[index].id) && !selectedSet.has(next[index - 1].id)) {
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                }
            }
            return next;
        }

        for (let index = next.length - 2; index >= 0; index -= 1) {
            if (selectedSet.has(next[index].id) && !selectedSet.has(next[index + 1].id)) {
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
            }
        }

        return next;
    }

    private syncPreviewWithGenerated() {
        const generated = this.mergeResult().content;
        const previousGenerated = this.lastGeneratedPreview();
        const currentEditable = this.editablePreview();

        this.lastGeneratedPreview.set(generated);

        if (!currentEditable || currentEditable === previousGenerated || !this.isPreviewEditing()) {
            this.editablePreview.set(generated);
        }

        this.syncPreviewBlockState();
        this.applyPreviewDecorations();
    }

    private syncPreviewBlockState() {
        const blocks = this.previewBlocks();
        this.activePreviewBlockOrder.set(blocks[0]?.order ?? null);
    }

    private updateActivePreviewBlock(lineNumber: number) {
        const active = this.previewBlocks().find((block) => lineNumber >= block.startLine && lineNumber <= block.endLine);
        this.activePreviewBlockOrder.set(active?.order ?? null);
    }

    private applyPreviewDecorations() {
        if (!this.previewEditorInstance) {
            return;
        }

        const blocks = this.previewBlocks();
        if (!blocks.length) {
            this.previewDecorations = this.previewEditorInstance.deltaDecorations(this.previewDecorations, []);
            return;
        }

        const decorations = blocks.map((block) => ({
            range: {
                startLineNumber: block.startLine,
                startColumn: 1,
                endLineNumber: block.endLine,
                endColumn: 1
            },
            options: {
                isWholeLine: true,
                linesDecorationsClassName: `sql-preview-gutter--tone-${block.toneIndex}`,
                className: `sql-preview-line--tone-${block.toneIndex}`,
                stickiness: 1,
                overviewRuler: {
                    color: this.getToneColor(block.toneIndex),
                    position: 2
                },
                glyphMarginClassName: 'sql-preview-glyph'
            }
        }));

        this.previewDecorations = this.previewEditorInstance.deltaDecorations(this.previewDecorations, decorations);
    }

    private getToneColor(toneIndex: number) {
        const tones = ['#2563eb', '#0f766e', '#4f46e5', '#0891b2', '#7c3aed', '#475569'];
        return tones[toneIndex % tones.length];
    }
}
