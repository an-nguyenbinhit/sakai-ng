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

interface RegexCaptureGroup {
    index: number;
    value: string;
}

interface RegexMatchResult {
    index: number;
    match: string;
    start: number;
    end: number;
    captureGroups: RegexCaptureGroup[];
    namedGroups: Record<string, string>;
}

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
    replacementString = signal<string>('');

    flagG = signal<boolean>(true);
    flagI = signal<boolean>(false);
    flagM = signal<boolean>(true);

    matches = signal<RegexMatchResult[]>([]);
    highlightedHtml = signal<SafeHtml>('');
    regexError = signal<string | null>(null);
    replacementPreview = signal<string>('');
    selectedMatchIndex = signal<number>(0);

    cheatSheetVisible = signal<boolean>(false);

    cheatSheetItems = [
        { label: 'Email Address', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', desc: 'Match valid email addresses', sample: 'user@example.com\nadmin@my-domain.co.uk\ninvalid-email@com\ntest@sub.domain.org' },
        {
            label: 'URL',
            pattern: '^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$',
            desc: 'Match URLs (http/https optional)',
            sample: 'https://www.google.com\nhttp://my-site.net/path?query=1\ninvalid-url\nexample.org/about'
        },
        { label: 'IPv4 Address', pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', desc: 'Match IPv4 addresses', sample: '192.168.1.1\n10.0.0.255\n256.1.2.3\n127.0.0.1' },
        {
            label: 'Strong Password',
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
            desc: 'At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char',
            sample: 'Password123!\nweakpass\nNoSpecialChar123\nS0per$ecureP@ass'
        },
        { label: 'Vietnamese Phone Number', pattern: '^(0|\\+84)(3|5|7|8|9)[0-9]{8}$', desc: 'Match valid Vietnamese mobile numbers', sample: '0912345678\n+84987654321\n02431234567\n0123456789' },
        {
            label: 'UUID',
            pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
            desc: 'Match standard UUID string',
            sample: '123e4567-e89b-12d3-a456-426614174000\n550e8400-e29b-41d4-a716-446655440000\ninvalid-uuid-here'
        },
        { label: 'Extract Hashtags', pattern: '#(\\w+)', desc: 'Find all hashtags in a text', sample: 'Check out the new #Angular features! #WebDev #TypeScript is awesome.' },
        {
            label: 'HTML Tags',
            pattern: '<\\/?\\w+((\\s+\\w+(\\s*=\\s*(?:".*?"|\'.*?\'|[\\^"\'>\\s]+))?)+\\s*|\\s*)\\/?>',
            desc: 'Match opening and closing HTML tags',
            sample: '<div class="container">\n  <p>Hello <b>World</b>!</p>\n  <img src="test.png" alt="Test" />\n</div>'
        },
        { label: 'Dates (YYYY-MM-DD)', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', desc: 'Match dates in YYYY-MM-DD format', sample: '2023-10-15\n2024-02-29\n2023-13-45\n1999-12-31' },
        { label: 'Hex Colors', pattern: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$', desc: 'Match 3 or 6 digit hex color codes', sample: '#fff\n#1a2b3c\n#FF0000\ninvalid-color\nf0f' },
        {
            label: 'JWT Token',
            pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
            desc: 'Match JSON Web Tokens (JWT)',
            sample: 'eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZTEifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\ninvalid.jwt.string'
        },
        {
            label: 'Credit Card',
            pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11})$',
            desc: 'Match major credit card numbers',
            sample: '4123456789012345 (Visa)\n5123456789012345 (Mastercard)\n1234567890123456 (Invalid)'
        },
        { label: 'Currency (USD)', pattern: '^\\$[0-9]{1,3}(,[0-9]{3})*(\\.[0-9]{2})?$', desc: 'Match US currency formats', sample: '$1,234.56\n$10.00\n$5\n100.00' }
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
            this.updateReplacementPreview();
            return;
        }

        try {
            const flagStr = this.getFlags();
            const regex = new RegExp(pat, flagStr);

            let newMatches: RegexMatchResult[] = [];

            if (!testStr) {
                this.matches.set([]);
                this.updateHighlightedHtml('');
                this.updateReplacementPreview();
                return;
            }

            if (flagStr.includes('g')) {
                const results = [...testStr.matchAll(regex)];
                newMatches = results.map((res: any, index) => this.buildMatchResult(res, index + 1));
            } else {
                const res = testStr.match(regex);
                if (res && res.index !== undefined) {
                    newMatches = [this.buildMatchResult(res, 1)];
                }
            }

            this.matches.set(newMatches);
            this.selectedMatchIndex.set(0);

            let lastIdx = 0;
            let resultHtml = '';

            if (newMatches.length > 0) {
                for (let m of newMatches) {
                    resultHtml += this.escapeHtml(testStr.substring(lastIdx, m.start));
                    resultHtml +=
                        `<span class="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 rounded font-bold shadow-sm border border-amber-200 dark:border-amber-800">` +
                        this.escapeHtml(testStr.substring(m.start, m.end)) +
                        `</span>`;
                    lastIdx = m.end;
                }
                resultHtml += this.escapeHtml(testStr.substring(lastIdx));
                this.updateHighlightedHtml(resultHtml, true);
            } else {
                this.updateHighlightedHtml(testStr);
            }
            this.updateReplacementPreview();
        } catch (e: any) {
            this.matches.set([]);
            this.updateHighlightedHtml(testStr);
            this.regexError.set(e.message);
            this.updateReplacementPreview();
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
        this.replacementString.set('');
        this.flagG.set(true);
        this.flagI.set(false);
        this.flagM.set(true);
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

    selectRegexPattern(item: any) {
        this.pattern.set(item.pattern);
        if (item.sample) {
            this.testString.set(item.sample);
        }
        this.flagG.set(true);
        this.flagM.set(true);
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

    updateReplacementPreview() {
        const pat = this.pattern();
        const testStr = this.testString();
        if (!pat || !testStr) {
            this.replacementPreview.set('');
            return;
        }

        try {
            const regex = new RegExp(pat, this.getFlags());
            this.replacementPreview.set(testStr.replace(regex, this.replacementString()));
        } catch {
            this.replacementPreview.set('');
        }
    }

    copyReplacementPreview() {
        const output = this.replacementPreview();
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Replacement preview copied to clipboard' });
        });
    }

    selectMatch(index: number) {
        this.selectedMatchIndex.set(index);
    }

    activeMatch = computed(() => this.matches()[this.selectedMatchIndex()] ?? null);

    private buildMatchResult(res: any, index: number): RegexMatchResult {
        return {
            index,
            match: res[0],
            start: res.index,
            end: res.index + res[0].length,
            captureGroups: res.slice(1).map((value: string, groupIndex: number) => ({
                index: groupIndex + 1,
                value: value ?? ''
            })),
            namedGroups: { ...(res.groups ?? {}) }
        };
    }
}
