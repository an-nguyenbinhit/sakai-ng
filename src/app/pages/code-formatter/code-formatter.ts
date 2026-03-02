import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as htmlPlugin from 'prettier/plugins/html';
import * as postcssPlugin from 'prettier/plugins/postcss';

@Component({
    selector: 'app-code-formatter',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, ButtonModule, ToastModule, TextareaModule],
    providers: [MessageService],
    templateUrl: './code-formatter.html',
    styleUrl: './code-formatter.scss'
})
export class CodeFormatter {
    languages = [
        { name: 'JavaScript / TypeScript', code: 'typescript' },
        { name: 'JSON', code: 'json' },
        { name: 'HTML', code: 'html' },
        { name: 'CSS', code: 'css' }
    ];

    selectedLanguage: string = 'typescript';
    codeContent: string = '';

    constructor(private messageService: MessageService) { }

    async formatCode() {
        if (!this.codeContent.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter some code to format.' });
            return;
        }

        try {
            let plugins = [];
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
                default:
                    throw new Error('Unsupported language');
            }

            const formatted = await prettier.format(this.codeContent, {
                parser: parser,
                plugins: plugins,
                printWidth: 80,
                tabWidth: 4,
                singleQuote: true
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
}
