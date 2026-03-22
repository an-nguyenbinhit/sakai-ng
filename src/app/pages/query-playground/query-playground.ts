import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService, TreeNode } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TreeModule } from 'primeng/tree';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { BrowserService } from '@/app/shared/services/browser.service';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { TextFileService } from '@/app/shared/services/text-file.service';
import { calculateTextMetrics } from '@/app/shared/utils/text-metrics';
import { QueryLanguage, QueryPlaygroundService, QueryResultMode } from './query-playground.service';

interface QueryHistoryItem {
    language: QueryLanguage;
    query: string;
    resultMode: QueryResultMode;
}

const HISTORY_STORAGE_KEY = 'query-playground-history';
const HISTORY_LIMIT = 6;

@Component({
    selector: 'app-query-playground',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, ToastModule, ToolPageShell, TreeModule],
    providers: [MessageService],
    templateUrl: './query-playground.html',
    styleUrl: './query-playground.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryPlayground {
    readonly samples: Record<QueryLanguage, { input: string; query: string }> = {
        jsonpath: {
            input: '{\n  "services": [\n    { "name": "query-playground", "enabled": true, "owner": "platform" },\n    { "name": "schema-lab", "enabled": false, "owner": "frontend" },\n    { "name": "url-tools", "enabled": true, "owner": "growth" }\n  ],\n  "meta": {\n    "env": "local",\n    "owners": ["platform", "frontend", "growth"]\n  }\n}',
            query: '$.services[?(@.enabled === true)].name'
        },
        xpath: {
            input: '<workspace>\n  <service enabled="true"><name>query-playground</name><owner>platform</owner></service>\n  <service enabled="false"><name>schema-lab</name><owner>frontend</owner></service>\n  <service enabled="true"><name>url-tools</name><owner>growth</owner></service>\n  <meta>\n    <env>local</env>\n    <owners>\n      <owner>platform</owner>\n      <owner>frontend</owner>\n      <owner>growth</owner>\n    </owners>\n  </meta>\n</workspace>',
            query: '//service[@enabled="true"]/name/text()'
        }
    };

    readonly modes: Array<{ label: string; value: QueryLanguage }> = [
        { label: 'JSONPath', value: 'jsonpath' },
        { label: 'XPath', value: 'xpath' }
    ];
    readonly resultModes: Array<{ label: string; value: QueryResultMode }> = [
        { label: 'Values only', value: 'values' },
        { label: 'Paths only', value: 'paths' },
        { label: 'Path + value', value: 'detailed' }
    ];

    readonly language = signal<QueryLanguage>('jsonpath');
    readonly resultMode = signal<QueryResultMode>('detailed');
    readonly inputText = signal(this.samples.jsonpath.input);
    readonly queryText = signal(this.samples.jsonpath.query);
    readonly outputText = signal('');
    readonly resultTree = signal<TreeNode[]>([]);
    readonly error = signal('');
    readonly matchCount = signal(0);
    readonly recentQueries = signal<QueryHistoryItem[]>([]);

    readonly examples = computed(() => this.queryPlaygroundService.examples[this.language()]);
    readonly filteredRecentQueries = computed(() => this.recentQueries().filter((item) => item.language === this.language()));
    readonly inputMetrics = computed(() => calculateTextMetrics(this.inputText()));
    readonly outputMetrics = computed(() => calculateTextMetrics(this.outputText()));
    readonly shellStats = computed(() => [
        { icon: 'pi pi-sitemap', label: this.language() === 'jsonpath' ? 'JSONPath evaluator' : 'XPath evaluator' },
        { icon: 'pi pi-list', label: `${this.matchCount()} matches from latest run` },
        { icon: 'pi pi-desktop', label: 'Client-side history and downloads' }
    ]);

    constructor(
        private queryPlaygroundService: QueryPlaygroundService,
        private browserService: BrowserService,
        private clipboardService: ClipboardService,
        private textFileService: TextFileService,
        private messageService: MessageService
    ) {
        this.restoreHistory();
        this.runQuery();
    }

    async copyOutput() {
        const copied = await this.clipboardService.copyText(this.outputText());
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? 'Query output copied to clipboard.' : 'Clipboard access is unavailable in this context.'
        });
    }

    async importFile(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        const content = await this.textFileService.readText(file);
        this.inputText.set(content);
        this.runQuery();
    }

    downloadOutput() {
        const extension = this.resultMode() === 'paths' ? 'txt' : 'json';
        const ok = this.textFileService.downloadText(`query-playground-output.${extension}`, this.outputText(), extension === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8');
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Query output downloaded.' : 'File download is unavailable in this context.'
        });
    }

    loadExample(query: string) {
        this.queryText.set(query);
        this.runQuery();
    }

    loadHistory(item: QueryHistoryItem) {
        this.queryText.set(item.query);
        this.resultMode.set(item.resultMode);
        this.runQuery();
    }

    loadSample() {
        const sample = this.samples[this.language()];
        this.inputText.set(sample.input);
        this.queryText.set(sample.query);
        this.runQuery();
    }

    runQuery() {
        try {
            const result = this.queryPlaygroundService.execute(this.language(), this.inputText(), this.queryText(), this.resultMode());
            this.outputText.set(result.outputText);
            this.resultTree.set(result.tree);
            this.matchCount.set(result.matchCount);
            this.error.set('');
            this.persistHistory();
        } catch (error) {
            this.outputText.set('');
            this.resultTree.set([]);
            this.matchCount.set(0);
            this.error.set(error instanceof Error ? error.message : 'Query execution failed.');
        }
    }

    setResultMode(mode: QueryResultMode) {
        this.resultMode.set(mode);
        if (this.queryText().trim()) {
            this.runQuery();
        }
    }

    setLanguage(language: QueryLanguage) {
        this.language.set(language);
        this.loadSample();
    }

    private persistHistory() {
        if (!this.browserService.isBrowser || !this.queryText().trim()) {
            return;
        }

        const nextHistory = [
            { language: this.language(), query: this.queryText().trim(), resultMode: this.resultMode() },
            ...this.recentQueries().filter((item) => !(item.language === this.language() && item.query === this.queryText().trim() && item.resultMode === this.resultMode()))
        ].slice(0, HISTORY_LIMIT);

        this.recentQueries.set(nextHistory);

        try {
            this.browserService.nativeWindow?.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
        } catch {
            // localStorage can be unavailable or full in private/restricted contexts.
        }
    }

    private restoreHistory() {
        if (!this.browserService.isBrowser) {
            return;
        }

        try {
            const raw = this.browserService.nativeWindow?.localStorage.getItem(HISTORY_STORAGE_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) {
                return;
            }

            const history = parsed.filter(this.isHistoryItem).slice(0, HISTORY_LIMIT);
            this.recentQueries.set(history);
        } catch {
            this.recentQueries.set([]);
        }
    }

    private isHistoryItem(value: unknown): value is QueryHistoryItem {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const candidate = value as Partial<QueryHistoryItem>;
        return (candidate.language === 'jsonpath' || candidate.language === 'xpath') && typeof candidate.query === 'string' && (candidate.resultMode === 'values' || candidate.resultMode === 'paths' || candidate.resultMode === 'detailed');
    }
}
