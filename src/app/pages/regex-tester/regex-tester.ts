import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-regex-tester',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, CheckboxModule, ToastModule, TextareaModule, TableModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './regex-tester.html'
})
export class RegexTester {
    pattern: string = '';
    testString: string = '';

    flagG: boolean = true;
    flagI: boolean = false;
    flagM: boolean = false;

    matches: any[] = [];
    highlightedHtml: SafeHtml = '';
    regexError: string | null = null;

    constructor(private messageService: MessageService, private sanitizer: DomSanitizer) {
        this.evaluateRegex();
    }

    onInputChange() {
        this.evaluateRegex();
    }

    onFlagChange() {
        this.evaluateRegex();
    }

    getFlags(): string {
        let f = '';
        if (this.flagG) f += 'g';
        if (this.flagI) f += 'i';
        if (this.flagM) f += 'm';
        return f;
    }

    evaluateRegex() {
        this.regexError = null;

        if (!this.pattern) {
            this.matches = [];
            this.updateHighlightedHtml(this.testString);
            return;
        }

        try {
            const flagStr = this.getFlags();
            const regex = new RegExp(this.pattern, flagStr);

            this.matches = [];

            if (!this.testString) {
                this.updateHighlightedHtml('');
                return;
            }

            if (flagStr.includes('g')) {
                const results = [...this.testString.matchAll(regex)];
                this.matches = results.map((res: any, index) => ({
                    index: index + 1,
                    match: res[0],
                    start: res.index,
                    end: res.index + res[0].length
                }));
            } else {
                const res = this.testString.match(regex);
                if (res && res.index !== undefined) {
                    this.matches = [{
                        index: 1,
                        match: res[0],
                        start: res.index,
                        end: res.index + res[0].length
                    }];
                } else {
                    this.matches = [];
                }
            }

            let lastIdx = 0;
            let resultHtml = '';

            if (this.matches.length > 0) {
                for (let m of this.matches) {
                    resultHtml += this.escapeHtml(this.testString.substring(lastIdx, m.start));
                    resultHtml += `<mark class="bg-amber-200 dark:bg-amber-600/50 text-surface-900 dark:text-surface-0 px-1 rounded font-medium">` + this.escapeHtml(this.testString.substring(m.start, m.end)) + `</mark>`;
                    lastIdx = m.end;
                }
                resultHtml += this.escapeHtml(this.testString.substring(lastIdx));
                this.updateHighlightedHtml(resultHtml, true);
            } else {
                this.updateHighlightedHtml(this.testString);
            }

        } catch (e: any) {
            this.matches = [];
            this.updateHighlightedHtml(this.testString);
            this.regexError = e.message;
        }
    }

    updateHighlightedHtml(text: string, isAlreadyEscaped: boolean = false) {
        let safeStr = isAlreadyEscaped ? text : this.escapeHtml(text);
        safeStr = safeStr.replace(/\n/g, '<br>');
        if (!safeStr) safeStr = '<span class="text-surface-400 dark:text-surface-500 italic">No test string provided...</span>';
        this.highlightedHtml = this.sanitizer.bypassSecurityTrustHtml(safeStr);
    }

    escapeHtml(unsafe: string) {
        return (unsafe || '').replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    clearInputs() {
        this.pattern = '';
        this.testString = '';
        this.flagG = true;
        this.flagI = false;
        this.flagM = false;
        this.evaluateRegex();
        this.messageService.add({ severity: 'info', summary: 'Cleared', detail: 'Inputs cleared' });
    }

    copyRegex() {
        if (!this.pattern) return;
        const fullRegex = `/${this.pattern}/${this.getFlags()}`;
        navigator.clipboard.writeText(fullRegex).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Regex copied to clipboard' });
        });
    }

    copyMatches() {
        if (this.matches.length === 0) return;
        const text = this.matches.map(m => m.match).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Matches copied to clipboard' });
        });
    }
}
