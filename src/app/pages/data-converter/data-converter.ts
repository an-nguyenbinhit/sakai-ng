import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { TextFileService } from '@/app/shared/services/text-file.service';
import { calculateTextMetrics } from '@/app/shared/utils/text-metrics';
import { DataConverterService, DataFormat } from './data-converter.service';

interface FormatOption {
    label: string;
    value: DataFormat;
}

@Component({
    selector: 'app-data-converter',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './data-converter.html',
    styleUrl: './data-converter.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataConverter {
    readonly formatOptions: FormatOption[] = [
        { label: 'JSON', value: 'json' },
        { label: 'YAML', value: 'yaml' },
        { label: 'TOML', value: 'toml' },
        { label: 'XML', value: 'xml' },
        { label: 'CSV', value: 'csv' },
        { label: 'TSV', value: 'tsv' }
    ];

    readonly samples: Record<DataFormat, string> = {
        json: '{\n  "app": "DevWorkspace",\n  "modules": ["formatter", "json-tools"],\n  "active": true\n}',
        yaml: 'app: DevWorkspace\nmodules:\n  - formatter\n  - json-tools\nactive: true\n',
        toml: 'app = "DevWorkspace"\nactive = true\nmodules = ["formatter", "json-tools"]\n',
        xml: '<root>\n  <app>DevWorkspace</app>\n  <active>true</active>\n  <modules>\n    <item>formatter</item>\n    <item>json-tools</item>\n  </modules>\n</root>',
        csv: 'name,role,team\nAn,Frontend,Platform\nBao,Backend,Core',
        tsv: 'name\trole\tteam\nAn\tFrontend\tPlatform\nBao\tBackend\tCore'
    };

    readonly inputFormat = signal<DataFormat>('json');
    readonly outputFormat = signal<DataFormat>('yaml');
    readonly inputText = signal(this.samples.json);
    readonly outputText = signal('');
    readonly error = signal('');

    readonly inputMetrics = computed(() => calculateTextMetrics(this.inputText()));
    readonly outputMetrics = computed(() => calculateTextMetrics(this.outputText()));
    readonly shellStats = computed(() => [
        { icon: 'pi pi-sync', label: `${this.inputFormat().toUpperCase()} -> ${this.outputFormat().toUpperCase()}` },
        { icon: 'pi pi-file', label: `${this.inputMetrics().lines} input lines` },
        { icon: 'pi pi-download', label: 'Import and export ready' }
    ]);

    constructor(
        private dataConverterService: DataConverterService,
        private clipboardService: ClipboardService,
        private textFileService: TextFileService,
        private messageService: MessageService
    ) {
        this.convert();
    }

    async copyOutput() {
        const copied = await this.clipboardService.copyText(this.outputText());
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? 'Converted output copied to clipboard.' : 'Clipboard access is unavailable in this context.'
        });
    }

    convert() {
        try {
            const output = this.dataConverterService.convert(this.inputText(), this.inputFormat(), this.outputFormat());
            this.outputText.set(output);
            this.error.set('');
        } catch (error) {
            this.outputText.set('');
            this.error.set(error instanceof Error ? error.message : 'Conversion failed.');
        }
    }

    async importFile(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        const content = await this.textFileService.readText(file);
        this.inputText.set(content);
        this.convert();
    }

    downloadOutput() {
        if (!this.outputText()) {
            return;
        }

        const ok = this.textFileService.downloadText(`converted.${this.outputFormat()}`, this.outputText());
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Converted result downloaded.' : 'File download is unavailable in this context.'
        });
    }

    loadSample() {
        this.inputText.set(this.samples[this.inputFormat()]);
        this.convert();
    }

    onFormatChange() {
        if (this.inputFormat() === this.outputFormat()) {
            this.outputFormat.set(this.inputFormat() === 'json' ? 'yaml' : 'json');
        }
        this.convert();
    }

    applyJsonShortcut(action: 'format' | 'minify' | 'escape' | 'stringify') {
        try {
            const nextValue =
                action === 'format'
                    ? this.dataConverterService.formatJson(this.inputText())
                    : action === 'minify'
                      ? this.dataConverterService.minifyJson(this.inputText())
                      : action === 'escape'
                        ? this.dataConverterService.escapeJsonString(this.inputText())
                        : this.dataConverterService.stringifyJsonLiteral(this.inputText());

            this.outputText.set(nextValue);
            this.error.set('');
        } catch (error) {
            this.error.set(error instanceof Error ? error.message : 'JSON shortcut failed.');
        }
    }

    swapFormats() {
        const currentInput = this.inputFormat();
        this.inputFormat.set(this.outputFormat());
        this.outputFormat.set(currentInput);
        this.inputText.set(this.outputText() || this.inputText());
        this.convert();
    }
}
