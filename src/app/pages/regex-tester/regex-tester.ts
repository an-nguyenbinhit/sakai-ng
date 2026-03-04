import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
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
    templateUrl: './regex-tester.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegexTester {
    pattern = signal<string>('');
    testString = signal<string>('');

    flagG = signal<boolean>(true);
    flagI = signal<boolean>(false);
    flagM = signal<boolean>(false);

    matches = signal<any[]>([]);
    highlightedHtml = signal<SafeHtml>('');
    regexError = signal<string | null>(null);

    cheatSheetVisible = signal<boolean>(false);

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
        if (this.flagG()) f += 'g';
        if (this.flagI()) f += 'i';
        if (this.flagM()) f += 'm';
        return f;
    }

    evaluateRegex() {
        this.regexError.set(null);

        const pat = this.pattern();
        const testStr = this.testString();

        if (!pat) {
            this.matches.set([]);
            this.updateHighlightedHtml(testStr);
            return;
        }

        try {
            const flagStr = this.getFlags();
            const regex = new RegExp(pat, flagStr);

            let newMatches: any[] = [];

            if (!testStr) {
                this.matches.set([]);
                this.updateHighlightedHtml('');
                return;
            }

            if (flagStr.includes('g')) {
                const results = [...testStr.matchAll(regex)];
                newMatches = results.map((res: any, index) => ({
                    index: index + 1,
                    match: res[0],
                    start: res.index,
                    end: res.index + res[0].length
                }));
            } else {
                const res = testStr.match(regex);
                if (res && res.index !== undefined) {
                    newMatches = [
                        {
                            index: 1,
                            match: res[0],
                            start: res.index,
                            end: res.index + res[0].length
                        }
                    ];
                }
            }

            this.matches.set(newMatches);

            let lastIdx = 0;
            let resultHtml = '';

            if (newMatches.length > 0) {
                for (let m of newMatches) {
                    resultHtml += this.escapeHtml(testStr.substring(lastIdx, m.start));
                    resultHtml += `<mark class="bg-amber-300 dark:bg-amber-600/60 text-amber-900 dark:text-amber-50 px-1 rounded font-bold shadow-sm">` + this.escapeHtml(testStr.substring(m.start, m.end)) + `</mark>`;
                    lastIdx = m.end;
                }
                resultHtml += this.escapeHtml(testStr.substring(lastIdx));
                this.updateHighlightedHtml(resultHtml, true);
            } else {
                this.updateHighlightedHtml(testStr);
            }
        } catch (e: any) {
            this.matches.set([]);
            this.updateHighlightedHtml(testStr);
            this.regexError.set(e.message);
        }
    }

    updateHighlightedHtml(text: string, isAlreadyEscaped: boolean = false) {
        let safeStr = isAlreadyEscaped ? text : this.escapeHtml(text);
        safeStr = safeStr.replace(/\\n/g, '<br>');
        if (!safeStr) safeStr = '<span class="text-surface-400 dark:text-surface-500 italic flex items-center gap-2"><i class="pi pi-receipt"></i> No test string provided...</span>';
        this.highlightedHtml.set(this.sanitizer.bypassSecurityTrustHtml(safeStr));
    }

    escapeHtml(unsafe: string) {
        return (unsafe || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    clearInputs() {
        this.pattern.set('');
        this.testString.set('');
        this.flagG.set(true);
        this.flagI.set(false);
        this.flagM.set(false);
        this.evaluateRegex();
        this.messageService.add({ severity: 'info', summary: 'Cleared', detail: 'Inputs cleared' });
    }

    copyRegex() {
        const pat = this.pattern();
        if (!pat) return;
        const fullRegex = `/${pat}/${this.getFlags()}`;
        navigator.clipboard.writeText(fullRegex).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Regex copied to clipboard' });
        });
    }

    copyMatches() {
        const matchArr = this.matches();
        if (matchArr.length === 0) return;
        const text = matchArr.map((m) => m.match).join('\\n');
        navigator.clipboard.writeText(text).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Matches copied to clipboard' });
        });
    }

    selectRegexPattern(pattern: string) {
        this.pattern.set(pattern);
        this.evaluateRegex();
        this.cheatSheetVisible.set(false);
        this.messageService.add({ severity: 'info', summary: 'Pattern Applied', detail: 'Regex pattern inserted from Cheat Sheet' });
    }

    getJavaScriptSnippet(): string {
        const pat = this.pattern();
        if (!pat) return '// Insert a pattern to generate code';
        const flags = this.getFlags();
        return `const regex = /${pat}/${flags};\nconst text = \`${this.testString()}\`;\n\nconst matches = text.match(regex);\nconsole.log(matches);`;
    }

    getDotNetSnippet(): string {
        const pat = this.pattern();
        if (!pat) return '// Insert a pattern to generate code';

        const escapedPattern = pat.replace(/"/g, '""');
        const flagImports = [];
        if (this.flagI()) flagImports.push('RegexOptions.IgnoreCase');
        if (this.flagM()) flagImports.push('RegexOptions.Multiline');

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
