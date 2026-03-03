import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { LayoutService } from '@/app/layout/service/layout.service';
import { SelectModule } from 'primeng/select';

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

@Component({
    selector: 'app-json-tools',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToastModule, EditorComponent, DrawerModule, CheckboxModule, InputTextModule, ToggleSwitchModule, TooltipModule, SelectModule],
    providers: [MessageService],
    templateUrl: './json-tools.html',
    styleUrl: './json-tools.scss'
})
export class JsonTools {
    inputCode: string = '';
    outputCode: string = '';

    inputEditorOptions = { theme: 'vs-light', language: 'json', automaticLayout: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false };
    outputEditorOptions = { theme: 'vs-light', language: 'json', automaticLayout: true, readOnly: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false };

    autoUpdate: boolean = false;
    displaySettings: boolean = false;
    tabWidth: number = 4;
    useTabs: boolean = false;

    tabSizeOptions = [
        { name: '2', code: 2 },
        { name: '4', code: 4 },
        { name: '8', code: 8 }
    ];

    isDragging: boolean = false;

    inputCursor = { line: 1, col: 0 };
    outputCursor = { line: 1, col: 0 };
    inputSize: number = 0;
    outputSize: number = 0;

    transformFn: string = 'return data;';
    displayTransformSettings: boolean = false;

    private inputEditorInstance: any;
    private outputEditorInstance: any;
    private autoUpdateTimeout: any;

    constructor(
        private messageService: MessageService,
        private layoutService: LayoutService
    ) {
        effect(() => {
            const isDark = this.layoutService.isDarkTheme();
            const theme = isDark ? 'vs-dark' : 'vs-light';
            this.inputEditorOptions = { ...this.inputEditorOptions, theme };
            this.outputEditorOptions = { ...this.outputEditorOptions, theme };
        });
    }

    onFormatConfigChange() {
        if (this.autoUpdate) {
            this.formatJson();
        }
    }

    onAutoUpdateChange() {
        if (this.autoUpdate) {
            this.formatJson(); // Or whatever the last action was, default to format
        }
    }

    onInputEditorInit(editor: any) {
        this.inputEditorInstance = editor;
        editor.onDidChangeCursorPosition((e: any) => {
            this.inputCursor = { line: e.position.lineNumber, col: e.position.column };
        });
    }

    onOutputEditorInit(editor: any) {
        this.outputEditorInstance = editor;
        editor.onDidChangeCursorPosition((e: any) => {
            this.outputCursor = { line: e.position.lineNumber, col: e.position.column };
        });
    }

    onInputChange(newValue: string) {
        this.inputCode = newValue;
        this.inputSize = new Blob([newValue]).size;

        if (this.autoUpdate) {
            if (this.autoUpdateTimeout) {
                clearTimeout(this.autoUpdateTimeout);
            }
            this.autoUpdateTimeout = setTimeout(() => {
                this.formatJson(); // Default action for auto-update
            }, 500);
        }
    }

    increaseFontSize() {
        if (this.inputEditorOptions.fontSize < 30) {
            const newSize = this.inputEditorOptions.fontSize + 1;
            this.inputEditorOptions = { ...this.inputEditorOptions, fontSize: newSize };
            this.outputEditorOptions = { ...this.outputEditorOptions, fontSize: newSize };
        }
    }

    decreaseFontSize() {
        if (this.inputEditorOptions.fontSize > 8) {
            const newSize = this.inputEditorOptions.fontSize - 1;
            this.inputEditorOptions = { ...this.inputEditorOptions, fontSize: newSize };
            this.outputEditorOptions = { ...this.outputEditorOptions, fontSize: newSize };
        }
    }

    undoInput() {
        if (this.inputEditorInstance) {
            this.inputEditorInstance.trigger('keyboard', 'undo', null);
        }
    }

    clearInput() {
        this.inputCode = '';
        this.inputSize = 0;
        if (this.autoUpdate) this.formatJson();
    }

    clearOutput() {
        this.outputCode = '';
        this.outputSize = 0;
    }

    copyCode(isInput: boolean) {
        const content = isInput ? this.inputCode : this.outputCode;
        if (!content) return;

        navigator.clipboard.writeText(content).then(
            () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Copied to clipboard' });
            },
            () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy to clipboard' });
            }
        );
    }

    toggleFullscreen(container: HTMLElement) {
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch((err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fullscreen not supported' });
            });
        } else {
            document.exitFullscreen();
        }
    }

    loadSample() {
        this.inputCode = `{\n  "name": "Jane Doe",\n  "age": 30,\n  "isActive": true,\n  "skills": ["Angular", "TypeScript", "Tailwind CSS"],\n  "contact": {\n    "email": "jane.doe@example.com",\n    "phone": "555-1234"\n  }\n}`;
        this.inputSize = new Blob([this.inputCode]).size;
        this.messageService.add({ severity: 'info', summary: 'Sample Loaded', detail: 'JSON sample loaded' });
        if (this.autoUpdate) this.formatJson();
        this.displaySettings = false;
    }

    validateJson(): boolean {
        if (!this.inputCode.trim()) {
            this.outputCode = '';
            this.outputSize = 0;
            return false;
        }

        try {
            JSON.parse(this.inputCode);
            if (!this.autoUpdate) {
                this.messageService.add({ severity: 'success', summary: 'Valid JSON', detail: 'The input is properly formatted JSON.' });
            }
            return true;
        } catch (error: any) {
            console.error('JSON Validation error:', error);
            if (!this.autoUpdate) {
                this.messageService.add({ severity: 'error', summary: 'Invalid JSON', detail: error.message || 'Syntax error in JSON.' });
            }
            return false;
        }
    }

    async formatJson() {
        if (!this.inputCode.trim()) {
            this.outputCode = '';
            this.outputSize = 0;
            return;
        }

        try {
            const formatted = await prettier.format(this.inputCode, {
                parser: 'json',
                plugins: [babelPlugin, estreePlugin],
                tabWidth: Number(this.tabWidth),
                useTabs: this.useTabs
            });

            this.outputCode = formatted;
            this.outputSize = new Blob([this.outputCode]).size;
            if (!this.autoUpdate) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'JSON formatted!' });
        } catch (error: any) {
            console.error('Formatting error:', error);
            if (!this.autoUpdate) {
                this.messageService.add({ severity: 'error', summary: 'Formatting Error', detail: error.message || 'Syntax error in JSON.' });
            }
        }
    }

    minifyJson() {
        if (!this.inputCode.trim()) {
            this.outputCode = '';
            this.outputSize = 0;
            return;
        }

        try {
            const parsed = JSON.parse(this.inputCode);
            this.outputCode = JSON.stringify(parsed);
            this.outputSize = new Blob([this.outputCode]).size;
            if (!this.autoUpdate) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'JSON minified!' });
        } catch (error: any) {
            console.error('Minification error:', error);
            if (!this.autoUpdate) {
                this.messageService.add({ severity: 'error', summary: 'Minification Error', detail: 'Invalid JSON data.' });
            }
        }
    }

    transformJson() {
        if (!this.inputCode.trim()) {
            this.outputCode = '';
            this.outputSize = 0;
            return;
        }

        try {
            const parsed = JSON.parse(this.inputCode);
            // Create a function dynamically (be careful with this in a real prod env regarding XSS if inputs aren't trusted)
            const fn = new Function('data', this.transformFn);
            const result = fn(parsed);

            // Format output to be readable
            this.outputCode = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
            this.outputSize = new Blob([this.outputCode]).size;
            if (!this.autoUpdate) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'JSON transformed!' });
            this.displayTransformSettings = false;
        } catch (error: any) {
            console.error('Transform error:', error);
            if (!this.autoUpdate) {
                this.messageService.add({ severity: 'error', summary: 'Transform Error', detail: error.message || 'Failed to execute script.' });
            }
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDragEnter(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom) {
            this.isDragging = false;
        }
    }

    onFileDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
        event.target.value = '';
    }

    handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.inputCode = e.target?.result as string;
            this.inputSize = new Blob([this.inputCode]).size;
            this.messageService.add({ severity: 'info', summary: 'File Loaded', detail: `Loaded ${file.name}` });
            if (this.autoUpdate) this.formatJson();
        };
        reader.readAsText(file);
    }

    downloadCode(isInput: boolean) {
        const content = isInput ? this.inputCode : this.outputCode;
        if (!content) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No data to download.' });
            return;
        }

        const blob = new Blob([content], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        const prefix = isInput ? 'raw-json' : 'processed-json';
        a.download = `${prefix}.json`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File downloaded successfully!' });
    }
}
