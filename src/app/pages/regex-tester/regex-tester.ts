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
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-regex-tester',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, CheckboxModule, ToastModule, TextareaModule, TableModule, TooltipModule, DrawerModule, TabsModule],
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

    cheatSheetVisible: boolean = false;

    cheatSheetItems = [
        { label: 'Email Address', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', desc: 'Match valid email addresses' },
        { label: 'URL', pattern: '^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$', desc: 'Match URLs (http/https optional)' },
        { label: 'IPv4 Address', pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', desc: 'Match IPv4 addresses' },
        { label: 'Strong Password', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', desc: 'At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char' },
        { label: 'Vietnamese Phone Number', pattern: '^(0|\\+84)(3|5|7|8|9)[0-9]{8}$', desc: 'Match valid Vietnamese mobile numbers' },
        { label: 'UUID', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', desc: 'Match standard UUID string' },
        { label: 'Extract Hashtags', pattern: '#(\\w+)', desc: 'Find all hashtags in a text' },
        { label: 'HTML Tags', pattern: '<\\/?\\w+((\\s+\\w+(\\s*=\\s*(?:".*?"|\'.*?\'|[\\^"\'>\\s]+))?)+\\s*|\\s*)\\/?>', desc: 'Match opening and closing HTML tags' }
    ];

    constructor(
        private messageService: MessageService,
        private sanitizer: DomSanitizer
    ) {
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
                    this.matches = [
                        {
                            index: 1,
                            match: res[0],
                            start: res.index,
                            end: res.index + res[0].length
                        }
                    ];
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
        return (unsafe || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
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
        const text = this.matches.map((m) => m.match).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Matches copied to clipboard' });
        });
    }

    selectRegexPattern(pattern: string) {
        this.pattern = pattern;
        this.evaluateRegex();
        this.cheatSheetVisible = false;
        this.messageService.add({ severity: 'info', summary: 'Pattern Applied', detail: 'Regex pattern inserted from Cheat Sheet' });
    }

    getJavaScriptSnippet(): string {
        if (!this.pattern) return '// Insert a pattern to generate code';
        const flags = this.getFlags();
        // Cần double-escape cho constructor RegExp trong JS nếu xuất ra chuỗi
        // Nhưng thường dev dùng literal /.../
        return `const regex = /${this.pattern}/${flags};\nconst text = \`\${testString}\`;\n\nconst matches = text.match(regex);\nconsole.log(matches);`;
    }

    getDotNetSnippet(): string {
        if (!this.pattern) return '// Insert a pattern to generate code';

        // Escape double quotes for C# verbatim string
        const escapedPattern = this.pattern.replace(/"/g, '""');
        const flagImports = [];
        if (this.flagI) flagImports.push('RegexOptions.IgnoreCase');
        if (this.flagM) flagImports.push('RegexOptions.Multiline');

        let flagStr = flagImports.length > 0 ? `, ${flagImports.join(' | ')}` : '';

        return `using System;\nusing System.Text.RegularExpressions;\n\npublic class RegexTest\n{\n    public static void Main()\n    {\n        string pattern = @"${escapedPattern}";\n        string input = "test string";\n\n        Regex regex = new Regex(pattern${flagStr});\n        MatchCollection matches = regex.Matches(input);\n\n        foreach (Match match in matches)\n        {\n            Console.WriteLine("Match found: " + match.Value);\n        }\n    }\n}`;
    }

    copyCodeSnippet(language: string) {
        let code = '';
        if (language === 'js') code = this.getJavaScriptSnippet();
        else if (language === 'dotnet') code = this.getDotNetSnippet();

        navigator.clipboard.writeText(code).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Code snippet copied to clipboard' });
        });
    }
}
