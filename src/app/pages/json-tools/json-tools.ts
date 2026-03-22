import { Component, effect, signal, ChangeDetectionStrategy, untracked } from '@angular/core';
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
import Ajv from 'ajv';
import { JSONPath } from 'jsonpath-plus';

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

@Component({
    selector: 'app-json-tools',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToastModule, EditorComponent, DrawerModule, CheckboxModule, InputTextModule, ToggleSwitchModule, TooltipModule, SelectModule],
    providers: [MessageService],
    templateUrl: './json-tools.html',
    styleUrl: './json-tools.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonTools {
    inputCode = signal<string>('');
    outputCode = signal<string>('');

    inputEditorOptions = signal<any>({ theme: 'vs-light', language: 'json', automaticLayout: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false });
    outputEditorOptions = signal<any>({ theme: 'vs-light', language: 'json', automaticLayout: true, readOnly: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false });

    autoUpdate = signal<boolean>(false);
    displaySettings = signal<boolean>(false);
    tabWidth = signal<number>(4);
    useTabs = signal<boolean>(false);

    tabSizeOptions = [
        { name: '2', code: 2 },
        { name: '4', code: 4 },
        { name: '8', code: 8 }
    ];

    isDragging = signal<boolean>(false);

    inputCursor = signal({ line: 1, col: 0 });
    outputCursor = signal({ line: 1, col: 0 });
    inputSize = signal<number>(0);
    outputSize = signal<number>(0);

    transformFn = signal<string>('return data;');
    displayTransformSettings = signal<boolean>(false);
    displayQuerySettings = signal<boolean>(false);
    displaySchemaSettings = signal<boolean>(false);
    query = signal<string>('');
    queryResults = signal<string>('');
    queryError = signal<string | null>(null);
    schemaInput = signal<string>('{\n  "type": "object"\n}');
    validationErrors = signal<Array<{ path: string; message: string }>>([]);
    validationPassed = signal<boolean | null>(null);

    private inputEditorInstance: any;
    private outputEditorInstance: any;
    private autoUpdateTimeout: any;

    constructor(
        private messageService: MessageService,
        private layoutService: LayoutService
    ) {
        effect(
            () => {
                const isDark = this.layoutService.isDarkTheme();
                const theme = isDark ? 'vs-dark' : 'vs-light';
                const currentIn = untracked(() => this.inputEditorOptions());
                this.inputEditorOptions.set({ ...currentIn, theme });
                const currentOut = untracked(() => this.outputEditorOptions());
                this.outputEditorOptions.set({ ...currentOut, theme });
            },
            { allowSignalWrites: true }
        );
    }

    onFormatConfigChange() {
        if (this.autoUpdate()) {
            this.formatJson();
        }
    }

    onAutoUpdateChange() {
        if (this.autoUpdate()) {
            this.formatJson(); // Default action for auto-update
        }
    }

    onInputEditorInit(editor: any) {
        this.inputEditorInstance = editor;
        editor.onDidChangeCursorPosition((e: any) => {
            this.inputCursor.set({ line: e.position.lineNumber, col: e.position.column });
        });
    }

    onOutputEditorInit(editor: any) {
        this.outputEditorInstance = editor;
        editor.onDidChangeCursorPosition((e: any) => {
            this.outputCursor.set({ line: e.position.lineNumber, col: e.position.column });
        });
    }

    onInputChange(newValue: string) {
        this.inputCode.set(newValue);
        this.inputSize.set(new Blob([newValue]).size);

        if (this.autoUpdate()) {
            if (this.autoUpdateTimeout) {
                clearTimeout(this.autoUpdateTimeout);
            }
            this.autoUpdateTimeout = setTimeout(() => {
                this.formatJson(); // Default action for auto-update
            }, 500);
        }
    }

    increaseFontSize() {
        const currentIn = this.inputEditorOptions();
        if (currentIn.fontSize < 30) {
            const newSize = currentIn.fontSize + 1;
            this.inputEditorOptions.set({ ...currentIn, fontSize: newSize });
            this.outputEditorOptions.set({ ...this.outputEditorOptions(), fontSize: newSize });
        }
    }

    decreaseFontSize() {
        const currentIn = this.inputEditorOptions();
        if (currentIn.fontSize > 8) {
            const newSize = currentIn.fontSize - 1;
            this.inputEditorOptions.set({ ...currentIn, fontSize: newSize });
            this.outputEditorOptions.set({ ...this.outputEditorOptions(), fontSize: newSize });
        }
    }

    undoInput() {
        if (this.inputEditorInstance) {
            this.inputEditorInstance.trigger('keyboard', 'undo', null);
        }
    }

    clearInput() {
        this.inputCode.set('');
        this.inputSize.set(0);
        if (this.autoUpdate()) this.formatJson();
    }

    clearOutput() {
        this.outputCode.set('');
        this.outputSize.set(0);
    }

    copyCode(isInput: boolean) {
        const content = isInput ? this.inputCode() : this.outputCode();
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
        const sample = `{\n  "name": "Jane Doe",\n  "age": 30,\n  "isActive": true,\n  "skills": ["Angular", "TypeScript", "Tailwind CSS"],\n  "contact": {\n    "email": "jane.doe@example.com",\n    "phone": "555-1234"\n  }\n}`;
        this.inputCode.set(sample);
        this.inputSize.set(new Blob([sample]).size);
        this.messageService.add({ severity: 'info', summary: 'Sample Loaded', detail: 'JSON sample loaded' });
        if (this.autoUpdate()) this.formatJson();
        this.displaySettings.set(false);
    }

    validateJson(): boolean {
        const input = this.inputCode().trim();
        if (!input) {
            this.outputCode.set('');
            this.outputSize.set(0);
            return false;
        }

        try {
            JSON.parse(input);
            if (!this.autoUpdate()) {
                this.messageService.add({ severity: 'success', summary: 'Valid JSON', detail: 'The input is properly formatted JSON.' });
            }
            return true;
        } catch (error: any) {
            console.error('JSON Validation error:', error);
            if (!this.autoUpdate()) {
                this.messageService.add({ severity: 'error', summary: 'Invalid JSON', detail: error.message || 'Syntax error in JSON.' });
            }
            return false;
        }
    }

    protected callPrettierFormat(code: string, options: object): Promise<string> {
        return prettier.format(code, options as any);
    }

    async formatJson() {
        const input = this.inputCode().trim();
        if (!input) {
            this.outputCode.set('');
            this.outputSize.set(0);
            return;
        }

        try {
            const formatted = await this.callPrettierFormat(input, {
                parser: 'json',
                plugins: [babelPlugin, estreePlugin],
                tabWidth: Number(this.tabWidth()),
                useTabs: this.useTabs()
            });

            this.outputCode.set(formatted);
            this.outputSize.set(new Blob([formatted]).size);
            if (!this.autoUpdate()) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'JSON formatted!' });
        } catch (error: any) {
            console.error('Formatting error:', error);
            if (!this.autoUpdate()) {
                this.messageService.add({ severity: 'error', summary: 'Formatting Error', detail: error.message || 'Syntax error in JSON.' });
            }
        }
    }

    minifyJson() {
        const input = this.inputCode().trim();
        if (!input) {
            this.outputCode.set('');
            this.outputSize.set(0);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const str = JSON.stringify(parsed);
            this.outputCode.set(str);
            this.outputSize.set(new Blob([str]).size);
            if (!this.autoUpdate()) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'JSON minified!' });
        } catch (error: any) {
            console.error('Minification error:', error);
            if (!this.autoUpdate()) {
                this.messageService.add({ severity: 'error', summary: 'Minification Error', detail: 'Invalid JSON data.' });
            }
        }
    }

    transformJson() {
        const input = this.inputCode().trim();
        if (!input) {
            this.outputCode.set('');
            this.outputSize.set(0);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const fn = new Function('data', this.transformFn());
            const result = fn(parsed);

            const str = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
            this.outputCode.set(str);
            this.outputSize.set(new Blob([str]).size);
            if (!this.autoUpdate()) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'JSON transformed!' });
            this.displayTransformSettings.set(false);
        } catch (error: any) {
            console.error('Transform error:', error);
            if (!this.autoUpdate()) {
                this.messageService.add({ severity: 'error', summary: 'Transform Error', detail: error.message || 'Failed to execute script.' });
            }
        }
    }

    runJsonPathQuery() {
        const input = this.inputCode().trim();
        this.queryError.set(null);
        this.queryResults.set('');

        if (!input) {
            this.queryError.set('Load or paste JSON before running a query.');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const result = JSONPath({ path: this.query().trim() || '$', json: parsed, wrap: true });
            const serialized = JSON.stringify(result, null, 2);
            this.queryResults.set(serialized);
        } catch (error: any) {
            this.queryError.set(error?.message || 'Failed to execute JSONPath query.');
        }
    }

    validateAgainstSchema() {
        const input = this.inputCode().trim();
        this.validationErrors.set([]);
        this.validationPassed.set(null);

        if (!input) {
            this.validationErrors.set([{ path: '$', message: 'Load or paste JSON before validating.' }]);
            return;
        }

        try {
            const payload = JSON.parse(input);
            const schema = JSON.parse(this.schemaInput());
            const ajv = new Ajv({ allErrors: true, strict: false });
            const validate = ajv.compile(schema);
            const valid = validate(payload);

            this.validationPassed.set(Boolean(valid));
            if (!valid) {
                this.validationErrors.set(
                    (validate.errors ?? []).map((item) => ({
                        path: item.instancePath || '$',
                        message: item.message || 'Schema validation failed'
                    }))
                );
            }
        } catch (error: any) {
            this.validationPassed.set(false);
            this.validationErrors.set([{ path: '$', message: error?.message || 'Failed to validate JSON against schema.' }]);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDragEnter(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom) {
            this.isDragging.set(false);
        }
    }

    onFileDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);

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
            const res = e.target?.result as string;
            this.inputCode.set(res);
            this.inputSize.set(new Blob([res]).size);
            this.messageService.add({ severity: 'info', summary: 'File Loaded', detail: `Loaded ${file.name}` });
            if (this.autoUpdate()) this.formatJson();
        };
        reader.readAsText(file);
    }

    downloadCode(isInput: boolean) {
        const content = isInput ? this.inputCode() : this.outputCode();
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
