import { Component } from '@angular/core';
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
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { LayoutService } from '@/app/layout/service/layout.service';
import { effect } from '@angular/core';

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as htmlPlugin from 'prettier/plugins/html';
import * as postcssPlugin from 'prettier/plugins/postcss';
import * as markdownPlugin from 'prettier/plugins/markdown';
import * as xmlPlugin from '@prettier/plugin-xml';
import { format as sqlFormat } from 'sql-formatter';

@Component({
    selector: 'app-code-formatter',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, ButtonModule, ToastModule, TextareaModule, EditorComponent, DrawerModule, CheckboxModule, InputTextModule],
    providers: [MessageService],
    templateUrl: './code-formatter.html',
    styleUrl: './code-formatter.scss'
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

    selectedLanguage: string = 'typescript';
    codeContent: string = '';
    editorOptions = { theme: 'vs-light', language: 'typescript', automaticLayout: true };

    displaySettings: boolean = false;
    tabWidth: number = 4;
    printWidth: number = 80;
    useTabs: boolean = false;
    singleQuote: boolean = true;

    tabSizeOptions = [
        { name: '2 Spaces', code: 2 },
        { name: '4 Spaces', code: 4 },
        { name: '8 Spaces', code: 8 }
    ];

    isDragging: boolean = false;

    constructor(private messageService: MessageService, private layoutService: LayoutService) {
        effect(() => {
            const isDark = this.layoutService.isDarkTheme();
            this.editorOptions = { ...this.editorOptions, theme: isDark ? 'vs-dark' : 'vs-light' };
        });
    }

    onLanguageChange() {
        this.editorOptions = { ...this.editorOptions, language: this.selectedLanguage };
    }

    async formatCode() {
        if (!this.codeContent.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter some code to format.' });
            return;
        }

        try {
            let plugins: any[] = [];
            let parser = '';

            switch (this.selectedLanguage) {
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
                case 'xml':
                    plugins = [xmlPlugin];
                    parser = 'xml';
                    break;
                case 'sql':
                    const formattedSql = sqlFormat(this.codeContent, {
                        language: 'sql',
                        tabWidth: Number(this.tabWidth),
                        useTabs: this.useTabs,
                        keywordCase: 'upper'
                    });
                    this.codeContent = formattedSql;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Code formatted successfully!' });
                    return;
                default:
                    throw new Error('Unsupported language');
            }

            const formatted = await prettier.format(this.codeContent, {
                parser: parser,
                plugins: plugins,
                printWidth: Number(this.printWidth),
                tabWidth: Number(this.tabWidth),
                useTabs: this.useTabs,
                singleQuote: this.singleQuote
            });

            this.codeContent = formatted;
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Code formatted successfully!' });
        } catch (error: any) {
            console.error('Formatting error:', error);
            this.messageService.add({ severity: 'error', summary: 'Formatting Error', detail: error.message || 'Syntax error in code.' });
        }
    }

    copyCode() {
        if (!this.codeContent) return;

        navigator.clipboard.writeText(this.codeContent).then(
            () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Copied to clipboard' });
            },
            () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy to clipboard' });
            }
        );
    }

    clearCode() {
        this.codeContent = '';
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
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.codeContent = e.target?.result as string;
                this.detectLanguageFromFile(file.name);
                this.messageService.add({ severity: 'info', summary: 'File Loaded', detail: `Loaded ${file.name}` });
            };
            reader.readAsText(file);
        }
    }

    detectLanguageFromFile(filename: string) {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'ts':
            case 'jsx':
            case 'tsx':
                this.selectedLanguage = 'typescript';
                break;
            case 'json':
                this.selectedLanguage = 'json';
                break;
            case 'html':
                this.selectedLanguage = 'html';
                break;
            case 'css':
            case 'scss':
            case 'less':
                this.selectedLanguage = 'css';
                break;
            case 'md':
                this.selectedLanguage = 'markdown';
                break;
            case 'xml':
                this.selectedLanguage = 'xml';
                break;
            case 'sql':
                this.selectedLanguage = 'sql';
                break;
        }
        this.onLanguageChange();
    }

    downloadFile() {
        if (!this.codeContent) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No code to download.' });
            return;
        }

        const blob = new Blob([this.codeContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        let ext = '.txt';
        switch (this.selectedLanguage) {
            case 'typescript': ext = '.ts'; break;
            case 'json': ext = '.json'; break;
            case 'html': ext = '.html'; break;
            case 'css': ext = '.css'; break;
            case 'markdown': ext = '.md'; break;
            case 'xml': ext = '.xml'; break;
            case 'sql': ext = '.sql'; break;
        }

        a.href = url;
        a.download = `formatted-code${ext}`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File downloaded successfully!' });
    }
}
