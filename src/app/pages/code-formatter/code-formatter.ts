import { Component, effect, signal, ChangeDetectionStrategy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { LayoutService } from '@/app/layout/service/layout.service';

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as htmlPlugin from 'prettier/plugins/html';
import * as postcssPlugin from 'prettier/plugins/postcss';
import * as markdownPlugin from 'prettier/plugins/markdown';

import { format as sqlFormat } from 'sql-formatter';

@Component({
    selector: 'app-code-formatter',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, ButtonModule, ToastModule, TextareaModule, EditorComponent, DrawerModule, CheckboxModule, InputTextModule, ToggleSwitchModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './code-formatter.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeFormatter {
    languages = [
        { name: 'JavaScript / TypeScript', code: 'typescript' },
        { name: 'JSON', code: 'json' },
        { name: 'HTML', code: 'html' },
        { name: 'CSS', code: 'css' },
        { name: 'Markdown', code: 'markdown' },
        { name: 'XML', code: 'xml' },
        { name: 'SQL', code: 'sql' }
    ];

    selectedLanguage = signal<string>('html');
    inputCode = signal<string>('');
    outputCode = signal<string>('');

    inputEditorOptions = signal<any>({ theme: 'vs-light', language: 'html', automaticLayout: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false });
    outputEditorOptions = signal<any>({ theme: 'vs-light', language: 'html', automaticLayout: true, readOnly: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false });

    autoUpdate = signal<boolean>(false);
    formatCssJs = signal<boolean>(true);

    displaySettings = signal<boolean>(false);
    tabWidth = signal<number>(4);
    printWidth = signal<number>(80);
    useTabs = signal<boolean>(false);
    singleQuote = signal<boolean>(true);

    tabSizeOptions = [
        { name: '2', code: 2 },
        { name: '4', code: 4 },
        { name: '8', code: 8 }
    ];

    isDragging = signal<boolean>(false);

    inputCursor = signal<{ line: number; col: number }>({ line: 1, col: 0 });
    outputCursor = signal<{ line: number; col: number }>({ line: 1, col: 0 });
    inputSize = signal<number>(0);
    outputSize = signal<number>(0);

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

                const inOpts = untracked(() => this.inputEditorOptions());
                this.inputEditorOptions.set({ ...inOpts, theme });

                const outOpts = untracked(() => this.outputEditorOptions());
                this.outputEditorOptions.set({ ...outOpts, theme });
            },
            { allowSignalWrites: true }
        );
    }

    onLanguageChange() {
        this.inputEditorOptions.set({ ...this.inputEditorOptions(), language: this.selectedLanguage() });
        this.outputEditorOptions.set({ ...this.outputEditorOptions(), language: this.selectedLanguage() });
        if (this.autoUpdate()) {
            this.formatCode();
        }
    }

    getLanguageLabel(): string {
        const lang = this.languages.find((l) => l.code === this.selectedLanguage());
        return lang ? lang.name : 'Data';
    }

    onFormatConfigChange() {
        if (this.autoUpdate()) {
            this.formatCode();
        }
    }

    onAutoUpdateChange() {
        if (this.autoUpdate()) {
            this.formatCode();
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
                this.formatCode();
            }, 500);
        }
    }

    increaseFontSize() {
        const inOpts = this.inputEditorOptions();
        if (inOpts.fontSize < 30) {
            const newSize = inOpts.fontSize + 1;
            this.inputEditorOptions.set({ ...inOpts, fontSize: newSize });
            this.outputEditorOptions.set({ ...this.outputEditorOptions(), fontSize: newSize });
        }
    }

    decreaseFontSize() {
        const inOpts = this.inputEditorOptions();
        if (inOpts.fontSize > 8) {
            const newSize = inOpts.fontSize - 1;
            this.inputEditorOptions.set({ ...inOpts, fontSize: newSize });
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
        if (this.autoUpdate()) this.formatCode();
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
        const sample = `function sayHello(name) {\nconsole.log( 'Hello ' +name);\n}\nconst test = [ 1, 2,  3 ];`;
        this.inputCode.set(sample);
        this.selectedLanguage.set('typescript');
        this.inputSize.set(new Blob([sample]).size);
        this.onLanguageChange();
        this.messageService.add({ severity: 'info', summary: 'Sample Loaded', detail: 'TypeScript sample loaded' });
        if (this.autoUpdate()) this.formatCode();
        this.displaySettings.set(false);
    }

    async formatCode() {
        const code = this.inputCode();
        if (!code.trim()) {
            this.outputCode.set('');
            this.outputSize.set(0);
            return;
        }

        try {
            let plugins: any[] = [];
            let parser = '';

            switch (this.selectedLanguage()) {
                case 'typescript':
                case 'javascript':
                    plugins = [babelPlugin, estreePlugin];
                    parser = 'babel-ts';
                    break;
                case 'json':
                    plugins = [babelPlugin, estreePlugin];
                    parser = 'json';
                    break;
                case 'html':
                    plugins = [htmlPlugin];
                    if (this.formatCssJs()) {
                        plugins.push(babelPlugin, estreePlugin, postcssPlugin);
                    }
                    parser = 'html';
                    break;
                case 'css':
                    plugins = [postcssPlugin];
                    parser = 'css';
                    break;
                case 'markdown':
                    plugins = [markdownPlugin];
                    parser = 'markdown';
                    break;
                case 'xml': {
                    const xmlPlugin = await import('@prettier/plugin-xml');
                    plugins = [xmlPlugin.default ?? xmlPlugin];
                    parser = 'xml';
                    break;
                }
                case 'sql':
                    const formattedSql = sqlFormat(code, {
                        language: 'sql',
                        tabWidth: Number(this.tabWidth()),
                        useTabs: this.useTabs(),
                        keywordCase: 'upper'
                    });
                    this.outputCode.set(formattedSql);
                    this.outputSize.set(new Blob([formattedSql]).size);
                    if (!this.autoUpdate()) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Code formatted!' });
                    return;
                default:
                    throw new Error('Unsupported language');
            }

            const formatted = await this.callPrettierFormat(code, {
                parser: parser,
                plugins: plugins,
                printWidth: Number(this.printWidth()),
                tabWidth: Number(this.tabWidth()),
                useTabs: this.useTabs(),
                singleQuote: this.singleQuote()
            });

            this.outputCode.set(formatted);
            this.outputSize.set(new Blob([formatted]).size);
            if (!this.autoUpdate()) this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Code formatted!' });
        } catch (error: any) {
            console.error('Formatting error:', error);
            if (!this.autoUpdate()) {
                this.messageService.add({ severity: 'error', summary: 'Formatting Error', detail: error.message || 'Syntax error in code.' });
            }
        }
    }

    /** Protected wrapper so unit tests can spy on `prettier.format` calls without touching the sealed module export. */
    protected callPrettierFormat(code: string, options: object): Promise<string> {
        return prettier.format(code, options as any) as Promise<string>;
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
            this.detectLanguageFromFile(file.name);
            this.messageService.add({ severity: 'info', summary: 'File Loaded', detail: `Loaded ${file.name}` });
            if (this.autoUpdate()) this.formatCode();
        };
        reader.readAsText(file);
    }

    detectLanguageFromFile(filename: string) {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'ts':
            case 'jsx':
            case 'tsx':
                this.selectedLanguage.set('typescript');
                break;
            case 'json':
                this.selectedLanguage.set('json');
                break;
            case 'html':
            case 'htm':
                this.selectedLanguage.set('html');
                break;
            case 'css':
            case 'scss':
            case 'less':
                this.selectedLanguage.set('css');
                break;
            case 'md':
                this.selectedLanguage.set('markdown');
                break;
            case 'xml':
                this.selectedLanguage.set('xml');
                break;
            case 'sql':
                this.selectedLanguage.set('sql');
                break;
        }
        this.onLanguageChange();
    }

    downloadCode(isInput: boolean) {
        const content = isInput ? this.inputCode() : this.outputCode();
        if (!content) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No code to download.' });
            return;
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        let ext = '.txt';
        switch (this.selectedLanguage()) {
            case 'typescript':
                ext = '.ts';
                break;
            case 'json':
                ext = '.json';
                break;
            case 'html':
                ext = '.html';
                break;
            case 'css':
                ext = '.css';
                break;
            case 'markdown':
                ext = '.md';
                break;
            case 'xml':
                ext = '.xml';
                break;
            case 'sql':
                ext = '.sql';
                break;
        }

        a.href = url;
        const prefix = isInput ? 'raw-code' : 'formatted-code';
        a.download = `${prefix}${ext}`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File downloaded successfully!' });
    }
}
