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
import { SchemaLabService } from './schema-lab.service';

type GeneratedOutputKind = 'schema' | 'typescript' | 'zod';

@Component({
    selector: 'app-schema-lab',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './schema-lab.html',
    styleUrl: './schema-lab.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaLab {
    readonly samplePayload = `{
  "project": "DevWorkspace",
  "version": 21,
  "active": true,
  "owners": [
    {
      "id": 1,
      "email": "team@example.com"
    }
  ],
  "meta": {
    "region": "apac",
    "lastDeployAt": "2026-03-22T08:30:00Z"
  }
}`;

    readonly rootTypeName = signal('RootSchema');
    readonly payloadText = signal(this.samplePayload);
    readonly schemaText = signal('');
    readonly outputText = signal('');
    readonly outputKind = signal<GeneratedOutputKind>('schema');
    readonly validationMessage = signal('Load a payload, infer a schema, then validate or generate frontend types.');
    readonly validationState = signal<'idle' | 'success' | 'error'>('idle');

    readonly payloadMetrics = computed(() => calculateTextMetrics(this.payloadText()));
    readonly schemaMetrics = computed(() => calculateTextMetrics(this.schemaText()));
    readonly outputMetrics = computed(() => calculateTextMetrics(this.outputText()));
    readonly outputKindLabel = computed(() => {
        switch (this.outputKind()) {
            case 'typescript':
                return 'TypeScript';
            case 'zod':
                return 'Zod';
            default:
                return 'JSON Schema';
        }
    });
    readonly shellStats = computed(() => [
        { icon: 'pi pi-box', label: `${this.outputKindLabel()} workspace` },
        { icon: 'pi pi-file', label: `${this.payloadMetrics().lines} payload lines` },
        { icon: 'pi pi-shield', label: this.validationState() === 'success' ? 'Schema valid' : this.validationState() === 'error' ? 'Needs review' : 'Validation ready' }
    ]);

    constructor(
        private schemaLabService: SchemaLabService,
        private clipboardService: ClipboardService,
        private textFileService: TextFileService,
        private messageService: MessageService
    ) {
        this.inferSchema();
    }

    inferSchema() {
        try {
            const schema = this.schemaLabService.inferSchemaFromText(this.payloadText());
            this.schemaText.set(schema);
            if (this.outputKind() === 'schema') {
                this.outputText.set(schema);
            }
            this.validationState.set('idle');
            this.validationMessage.set('Schema inferred from the current sample payload.');
        } catch (error) {
            this.handleError(error, 'Failed to infer schema from JSON payload.');
        }
    }

    validateSchema() {
        try {
            const result = this.schemaLabService.validate(this.payloadText(), this.schemaText());
            this.validationState.set(result.valid ? 'success' : 'error');
            this.validationMessage.set(result.valid ? 'Payload matches the current JSON Schema.' : result.errors.map((item) => `${item.path}: ${item.message}`).join(' | '));
        } catch (error) {
            this.handleError(error, 'Schema validation failed.');
        }
    }

    generateOutput(kind: GeneratedOutputKind) {
        this.outputKind.set(kind);

        try {
            const output =
                kind === 'typescript'
                    ? this.schemaLabService.generateTypeScriptFromText(this.payloadText(), this.rootTypeName())
                    : kind === 'zod'
                      ? this.schemaLabService.generateZodFromText(this.payloadText(), this.rootTypeName())
                      : this.schemaText() || this.schemaLabService.inferSchemaFromText(this.payloadText());

            if (kind === 'schema' && !this.schemaText()) {
                this.schemaText.set(output);
            }

            this.outputText.set(output);
            this.messageService.add({
                severity: 'success',
                summary: 'Generated',
                detail: `${this.outputKindLabel()} output is ready.`
            });
        } catch (error) {
            this.handleError(error, `Failed to generate ${kind} output.`);
        }
    }

    async copyOutput() {
        const copied = await this.clipboardService.copyText(this.outputText());
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? `${this.outputKindLabel()} output copied to clipboard.` : 'Clipboard access is unavailable in this context.'
        });
    }

    async importPayload(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        const content = await this.textFileService.readText(file);
        this.payloadText.set(content);
        this.validationState.set('idle');
        this.validationMessage.set(`Loaded ${file.name}. Infer the schema again to refresh generated output.`);
        this.inferSchema();
    }

    downloadOutput() {
        if (!this.outputText()) {
            return;
        }

        const filename = this.outputKind() === 'schema' ? 'schema-lab.schema.json' : this.outputKind() === 'typescript' ? 'schema-lab.types.ts' : 'schema-lab.zod.ts';
        const ok = this.textFileService.downloadText(filename, this.outputText(), 'text/plain;charset=utf-8');

        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? `${this.outputKindLabel()} output downloaded.` : 'File download is unavailable in this context.'
        });
    }

    loadSample() {
        this.payloadText.set(this.samplePayload);
        this.rootTypeName.set('RootSchema');
        this.inferSchema();
    }

    private handleError(error: unknown, fallback: string) {
        const detail = error instanceof Error ? error.message : fallback;
        this.validationState.set('error');
        this.validationMessage.set(detail || fallback);
        this.messageService.add({
            severity: 'error',
            summary: 'Schema Lab',
            detail: detail || fallback
        });
    }
}
