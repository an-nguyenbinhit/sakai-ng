import { Component, input, signal, inject, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FileCompareState } from '../../services/file-compare-state.service';
import { SyntaxHighlight } from '../../services/syntax-highlight.service';
import { FileContent } from '../../models/diff.models';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUPPORTED_EXTENSIONS = [
    '.txt', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb', '.php',
    '.cs', '.cpp', '.c', '.h', '.json', '.yaml', '.yml', '.xml', '.html', '.css',
    '.scss', '.md', '.sql', '.sh', '.bat', '.env', '.log', '.csv', '.rs', '.swift',
    '.kt', '.dart', '.toml', '.graphql', '.r', '.lua', '.dockerfile', '.mjs'
];

@Component({
    selector: 'p-file-input',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, MessageModule, TagModule, TooltipModule],
    template: `
        <div class="flex flex-col gap-3 h-full">
            <!-- Panel header -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-surface-700 dark:text-surface-200">
                        {{ side() === 'left' ? 'File A (Original)' : 'File B (Modified)' }}
                    </span>
                    @if (state.leftFile() && side() === 'left' || state.rightFile() && side() === 'right') {
                        <p-tag [value]="currentFile()?.language ?? ''" severity="secondary" styleClass="text-xs" />
                        <p-tag [value]="currentFile()?.encoding ?? ''" severity="secondary" styleClass="text-xs" />
                    }
                </div>
                @if (currentFile()) {
                    <p-button
                        icon="pi pi-times"
                        severity="secondary"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        (onClick)="clearFile()"
                        pTooltip="Clear file"
                    />
                }
            </div>

            @if (currentFile()) {
                <!-- File loaded state -->
                <div class="flex items-center gap-2 p-3 rounded-border bg-surface-100 dark:bg-surface-800">
                    <i class="pi pi-file text-primary"></i>
                    <span class="text-sm font-medium truncate flex-1">{{ currentFile()?.name }}</span>
                    <span class="text-xs text-surface-400">{{ formatSize(currentFile()?.size ?? 0) }}</span>
                </div>
            } @else {
                <!-- Mode toggle -->
                <div class="flex gap-2">
                    <p-button
                        label="Upload"
                        icon="pi pi-upload"
                        [outlined]="mode() !== 'drop'"
                        size="small"
                        (onClick)="mode.set('drop')"
                    />
                    <p-button
                        label="Paste Text"
                        icon="pi pi-pencil"
                        [outlined]="mode() !== 'paste'"
                        size="small"
                        (onClick)="mode.set('paste')"
                    />
                    <p-button
                        label="Sample"
                        icon="pi pi-star"
                        [outlined]="true"
                        severity="secondary"
                        size="small"
                        (onClick)="loadSample()"
                        pTooltip="Load sample data for both panels"
                    />
                </div>

                @if (mode() === 'drop') {
                    <!-- Drop zone -->
                    <div
                        class="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-border p-8 cursor-pointer transition-colors"
                        [class.border-primary]="isDragOver()"
                        [class.bg-primary-50]="isDragOver()"
                        [class.dark:bg-primary-950]="isDragOver()"
                        [class.border-surface-300]="!isDragOver()"
                        [class.dark:border-surface-600]="!isDragOver()"
                        [class.hover:border-primary]="!isDragOver()"
                        (click)="fileInputRef()!.nativeElement.click()"
                        (dragover)="onDragOver($event)"
                        (dragleave)="onDragLeave($event)"
                        (drop)="onDrop($event)"
                    >
                        <i class="pi pi-cloud-upload text-4xl text-surface-400"></i>
                        <div class="text-center">
                            <p class="font-medium text-surface-600 dark:text-surface-300">Drop file here or click to browse</p>
                            <p class="text-sm text-surface-400 mt-1">Max 10MB · Text files only</p>
                        </div>
                        <input
                            #fileInput
                            type="file"
                            class="hidden"
                            [accept]="supportedExtensions"
                            (change)="onFileSelected($event)"
                        />
                    </div>
                } @else {
                    <!-- Paste mode -->
                    <div class="flex flex-col gap-2 flex-1">
                        <textarea
                            pTextarea
                            [rows]="10"
                            placeholder="Paste your text here..."
                            [(ngModel)]="pasteText"
                            class="font-mono text-sm w-full resize-none flex-1"
                        ></textarea>
                        <p-button
                            label="Use this text"
                            icon="pi pi-check"
                            [disabled]="!pasteText()"
                            (onClick)="usePasteText()"
                        />
                    </div>
                }
            }

            @if (isLoading()) {
                <div class="flex items-center gap-2 text-sm text-surface-500">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>Reading file...</span>
                </div>
            }

            @if (errorMessage()) {
                <p-message severity="error" [text]="errorMessage()!" styleClass="w-full" />
            }
        </div>
    `
})
export class FileInput {
    side = input.required<'left' | 'right'>();

    state = inject(FileCompareState);
    syntaxHighlight = inject(SyntaxHighlight);

    fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    mode = signal<'drop' | 'paste'>('drop');
    isDragOver = signal(false);
    pasteText = signal('');
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);

    readonly supportedExtensions = SUPPORTED_EXTENSIONS.join(',');

    currentFile() {
        return this.side() === 'left' ? this.state.leftFile() : this.state.rightFile();
    }

    clearFile(): void {
        this.state.clearFile(this.side());
        this.errorMessage.set(null);
    }

    loadSample(): void {
        this.state.loadSampleData();
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);

        const file = event.dataTransfer?.files?.[0];
        if (file) this.processFile(file);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) this.processFile(file);
        input.value = ''; // reset so same file can be re-selected
    }

    usePasteText(): void {
        const text = this.pasteText();
        if (!text) return;

        const fileContent: FileContent = {
            name: 'untitled',
            content: text,
            encoding: 'UTF-8',
            language: 'plaintext',
            size: text.length
        };
        this.state.setFile(this.side(), fileContent);
        this.errorMessage.set(null);
    }

    private processFile(file: File): void {
        this.errorMessage.set(null);

        if (file.size > MAX_FILE_SIZE) {
            this.errorMessage.set(`File too large: ${this.formatSize(file.size)}. Maximum is 10MB.`);
            return;
        }

        // Check if it might be binary
        const ext = this.getExtension(file.name);
        if (ext && !SUPPORTED_EXTENSIONS.includes(ext)) {
            this.errorMessage.set(`Unsupported file type: ${ext}. Please use a text file.`);
            return;
        }

        this.isLoading.set(true);

        // First read as ArrayBuffer to detect encoding
        const arrayReader = new FileReader();
        arrayReader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            const encoding = this.detectEncoding(buffer);
            this.readAsText(file, encoding);
        };
        arrayReader.onerror = () => {
            this.isLoading.set(false);
            this.errorMessage.set('Failed to read file.');
        };
        arrayReader.readAsArrayBuffer(file.slice(0, 4)); // Only need first few bytes for BOM
    }

    private readAsText(file: File, encoding: string): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.isLoading.set(false);
            const content = e.target?.result as string;

            // Check for binary content (null bytes)
            if (content.includes('\0')) {
                this.errorMessage.set('Binary file detected. Only text files are supported.');
                return;
            }

            const language = this.syntaxHighlight.detectLanguage(file.name);
            const fileContent: FileContent = {
                name: file.name,
                content,
                encoding,
                language,
                size: file.size
            };
            this.state.setFile(this.side(), fileContent);
            this.errorMessage.set(null);
        };
        reader.onerror = () => {
            this.isLoading.set(false);
            this.errorMessage.set('Failed to read file.');
        };
        reader.readAsText(file, encoding);
    }

    private detectEncoding(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);

        // UTF-8 BOM: EF BB BF
        if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'UTF-8';
        // UTF-16 LE BOM: FF FE
        if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'UTF-16LE';
        // UTF-16 BE BOM: FE FF
        if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'UTF-16BE';

        return 'UTF-8';
    }

    private getExtension(filename: string): string {
        const dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex).toLowerCase() : '';
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
