import { Component, input, signal, computed, inject, ElementRef, viewChild, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CodeCompareState } from '../../services/code-compare-state.service';
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
    selector: 'p-code-input',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, MessageModule, TagModule, TooltipModule],
    templateUrl: './code-input.html',
    styleUrl: './code-input.scss'
})
export class CodeInput {
    side = input.required<'left' | 'right'>();

    state = inject(CodeCompareState);
    syntaxHighlight = inject(SyntaxHighlight);

    fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    text = signal('');
    fileName = signal<string | null>(null);
    detectedLanguage = signal('plaintext');
    isDragOver = signal(false);
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);

    lineCount = computed(() => {
        const t = this.text();
        return t ? t.split('\n').length : 0;
    });

    readonly supportedExtensions = SUPPORTED_EXTENSIONS.join(',');

    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private skipNextSync = false;

    constructor() {
        // Sync FROM state → text (handles session restore, sample load, swap)
        effect(() => {
            const file = this.side() === 'left' ? this.state.leftFile() : this.state.rightFile();
            const stateContent = file?.content ?? '';
            if (untracked(() => this.text()) !== stateContent) {
                this.skipNextSync = true;
                this.text.set(stateContent);
                this.fileName.set(file?.name ?? null);
                this.detectedLanguage.set(file?.language ?? 'plaintext');
            }
        });

        // Sync FROM text → state (debounced, user edits)
        effect(() => {
            const t = this.text();
            if (this.skipNextSync) {
                this.skipNextSync = false;
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = null;
                }
                return;
            }
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.syncToState(t), 400);
        });
    }

    private syncToState(text: string): void {
        if (!text.trim()) {
            this.state.clearFile(this.side());
            return;
        }
        this.state.setFile(this.side(), {
            name: this.fileName() ?? 'untitled',
            content: text,
            encoding: 'UTF-8',
            language: this.detectedLanguage(),
            size: text.length
        });
    }

    clear(): void {
        this.text.set('');
        this.fileName.set(null);
        this.detectedLanguage.set('plaintext');
        this.errorMessage.set(null);
        this.state.clearFile(this.side());
    }

    triggerFileInput(): void {
        this.fileInputRef()?.nativeElement.click();
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
        input.value = '';
    }

    private processFile(file: File): void {
        this.errorMessage.set(null);

        if (file.size > MAX_FILE_SIZE) {
            this.errorMessage.set(`File too large: ${this.formatSize(file.size)}. Maximum is 10MB.`);
            return;
        }

        const ext = this.getExtension(file.name);
        if (ext && !SUPPORTED_EXTENSIONS.includes(ext)) {
            this.errorMessage.set(`Unsupported file type: ${ext}. Please use a text file.`);
            return;
        }

        this.isLoading.set(true);

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
        arrayReader.readAsArrayBuffer(file.slice(0, 4));
    }

    private readAsText(file: File, encoding: string): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.isLoading.set(false);
            const content = e.target?.result as string;

            if (content.includes('\0')) {
                this.errorMessage.set('Binary file detected. Only text files are supported.');
                return;
            }

            const language = this.syntaxHighlight.detectLanguage(file.name);
            const fileContent: FileContent = { name: file.name, content, encoding, language, size: file.size };

            // Immediately sync to state (no debounce) — skip the text→state effect
            this.skipNextSync = true;
            this.text.set(content);
            this.fileName.set(file.name);
            this.detectedLanguage.set(language);
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
        if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'UTF-8';
        if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'UTF-16LE';
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
