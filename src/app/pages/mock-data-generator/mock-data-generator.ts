import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { TextFileService } from '@/app/shared/services/text-file.service';
import { calculateTextMetrics } from '@/app/shared/utils/text-metrics';
import {
    MockConditionOperator,
    MockDataGeneratorService,
    MockDatasetDefinition,
    MockDistribution,
    MockFieldDefinition,
    MockFieldShape,
    MockFieldSourceMode,
    MockFieldType,
    MockScenarioPreset
} from './mock-data-generator.service';

interface SelectOption<T> {
    label: string;
    value: T;
}

@Component({
    selector: 'app-mock-data-generator',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, InputTextModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './mock-data-generator.html',
    styleUrl: './mock-data-generator.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MockDataGenerator {
    readonly shapeOptions: Array<SelectOption<MockFieldShape>> = [
        { label: 'Scalar', value: 'scalar' },
        { label: 'Object', value: 'object' },
        { label: 'Array', value: 'array' }
    ];
    readonly sourceOptions: Array<SelectOption<MockFieldSourceMode>> = [
        { label: 'Generated', value: 'generated' },
        { label: 'Template', value: 'template' },
        { label: 'Reference', value: 'reference' }
    ];
    readonly fieldTypeOptions: Array<SelectOption<MockFieldType>> = [
        { label: 'UUID', value: 'uuid' },
        { label: 'First name', value: 'firstName' },
        { label: 'Last name', value: 'lastName' },
        { label: 'Full name', value: 'fullName' },
        { label: 'Email', value: 'email' },
        { label: 'Company', value: 'company' },
        { label: 'Word', value: 'word' },
        { label: 'Title', value: 'title' },
        { label: 'Sentence', value: 'sentence' },
        { label: 'Number', value: 'number' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'Date', value: 'date' },
        { label: 'Enum', value: 'enum' },
        { label: 'Slug', value: 'slug' },
        { label: 'Pattern', value: 'pattern' }
    ];
    readonly distributionOptions: Array<SelectOption<MockDistribution>> = [
        { label: 'Uniform', value: 'uniform' },
        { label: 'Sequence', value: 'sequence' },
        { label: 'Boundary', value: 'boundary' }
    ];
    readonly conditionOptions: Array<SelectOption<MockConditionOperator>> = [
        { label: 'Equals', value: 'equals' },
        { label: 'Not equals', value: 'notEquals' },
        { label: 'Truthy', value: 'truthy' },
        { label: 'Falsy', value: 'falsy' }
    ];
    readonly scenarioOptions: Array<SelectOption<MockScenarioPreset>> = [
        { label: 'Balanced', value: 'balanced' },
        { label: 'Edge', value: 'edge' },
        { label: 'Chaos', value: 'chaos' }
    ];

    readonly seed = signal('devworkspace-seed');
    readonly indent = signal(2);
    readonly autoPreview = signal(true);
    readonly datasets = signal<MockDatasetDefinition[]>([]);
    readonly fields = signal<MockFieldDefinition[]>([]);
    readonly activeDatasetId = signal<number | null>(null);
    readonly selectedScenario = signal<MockScenarioPreset>('balanced');
    readonly outputText = signal('');
    readonly statusMessage = signal('Build relational fixture datasets with nested objects, arrays, references, conditions, and seeded output.');

    readonly activeDataset = computed(() => this.datasets().find((dataset) => dataset.id === this.activeDatasetId()) ?? null);
    readonly activeFields = computed(() => {
        const datasetId = this.activeDatasetId();
        return datasetId == null ? [] : this.fields().filter((field) => field.datasetId === datasetId).sort((left, right) => left.id - right.id);
    });
    readonly outputMetrics = computed(() => calculateTextMetrics(this.outputText()));
    readonly shellStats = computed(() => [
        { icon: 'pi pi-sitemap', label: `${this.datasets().length} datasets linked` },
        { icon: 'pi pi-box', label: `${this.fields().length} fields across graph` },
        { icon: 'pi pi-refresh', label: `${this.selectedScenario()} scenario injection` }
    ]);

    private nextDatasetId = 100;
    private nextFieldId = 1000;

    constructor(
        private mockDataGeneratorService: MockDataGeneratorService,
        private clipboardService: ClipboardService,
        private textFileService: TextFileService,
        private messageService: MessageService
    ) {
        this.loadPreset('commerce');
    }

    loadPreset(kind: 'commerce' | 'crm') {
        const preset = kind === 'commerce' ? this.mockDataGeneratorService.createCommercePreset() : this.mockDataGeneratorService.createCrmPreset();
        this.datasets.set(preset.datasets);
        this.fields.set(preset.fields);
        this.activeDatasetId.set(preset.datasets[0]?.id ?? null);
        this.selectedScenario.set('balanced');
        this.seed.set(kind === 'commerce' ? 'commerce-seed' : 'crm-seed');
        this.syncCounters();
        this.runPreview();
    }

    applyScenario(scenario: MockScenarioPreset) {
        const next = this.mockDataGeneratorService.applyScenario(this.fields(), this.datasets(), scenario);
        this.fields.set(next.fields);
        this.datasets.set(next.datasets);
        this.selectedScenario.set(scenario);
        this.runPreview();
    }

    addDataset() {
        const id = this.nextDatasetId++;
        const nextDataset: MockDatasetDefinition = {
            id,
            key: `dataset${this.datasets().length + 1}`,
            label: `Dataset ${this.datasets().length + 1}`,
            count: 10
        };
        this.datasets.update((datasets) => [...datasets, nextDataset]);
        this.activeDatasetId.set(id);
        this.runPreview();
    }

    removeDataset(id: number) {
        const datasets = this.datasets().filter((dataset) => dataset.id !== id);
        this.datasets.set(datasets);
        this.fields.update((fields) => fields.filter((field) => field.datasetId !== id));
        if (this.activeDatasetId() === id) {
            this.activeDatasetId.set(datasets[0]?.id ?? null);
        }
        this.runPreview();
    }

    updateDataset<K extends keyof MockDatasetDefinition>(id: number, key: K, value: MockDatasetDefinition[K]) {
        this.datasets.update((datasets) => datasets.map((dataset) => (dataset.id === id ? { ...dataset, [key]: value } : dataset)));
        this.runPreview();
    }

    addField(shape: MockFieldShape = 'scalar') {
        const datasetId = this.activeDatasetId();
        if (datasetId == null) {
            return;
        }

        const field: MockFieldDefinition = {
            id: this.nextFieldId++,
            datasetId,
            parentId: null,
            name: shape === 'object' ? `group${this.activeFields().length + 1}` : shape === 'array' ? `items${this.activeFields().length + 1}` : `field${this.activeFields().length + 1}`,
            shape,
            type: shape === 'scalar' ? 'sentence' : 'sentence',
            sourceMode: 'generated',
            nullable: false,
            nullRate: 0,
            omitRate: 0,
            invalidRate: 0,
            unique: false,
            min: 0,
            max: 100,
            arrayMin: 1,
            arrayMax: 3,
            distribution: 'uniform',
            conditionOperator: 'equals',
            referenceDatasetId: null
        };

        this.fields.update((fields) => [...fields, field]);
        this.runPreview();
    }

    removeField(id: number) {
        const childIds = new Set([id]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const field of this.fields()) {
                if (field.parentId != null && childIds.has(field.parentId) && !childIds.has(field.id)) {
                    childIds.add(field.id);
                    changed = true;
                }
            }
        }

        this.fields.update((fields) => fields.filter((field) => !childIds.has(field.id)));
        this.runPreview();
    }

    updateField<K extends keyof MockFieldDefinition>(id: number, key: K, value: MockFieldDefinition[K]) {
        this.fields.update((fields) =>
            fields.map((field) => {
                if (field.id !== id) {
                    return field;
                }

                const next = { ...field, [key]: value };
                if (key === 'shape' && value !== 'scalar') {
                    next.sourceMode = 'generated';
                }
                if (key === 'shape' && value === 'object') {
                    next.arrayMin = 1;
                    next.arrayMax = 3;
                }
                return next;
            })
        );
        this.runPreview();
    }

    getParentOptions(datasetId: number, fieldId: number): Array<SelectOption<number | null>> {
        const options = this.fields()
            .filter((field) => field.datasetId === datasetId && field.id !== fieldId && (field.shape === 'object' || field.shape === 'array'))
            .map((field) => ({
                label: `${field.name} (${field.shape})`,
                value: field.id
            }));
        return [{ label: 'Root', value: null }, ...options];
    }

    getDatasetReferenceOptions(currentDatasetId: number): Array<SelectOption<number | null>> {
        return this.datasets()
            .filter((dataset) => dataset.id !== currentDatasetId)
            .map((dataset) => ({ label: dataset.key, value: dataset.id }));
    }

    generate() {
        try {
            const result = this.mockDataGeneratorService.generate({
                seed: this.seed(),
                indent: this.indent(),
                datasets: this.datasets(),
                fields: this.fields()
            });

            this.outputText.set(result.jsonText);
            this.statusMessage.set(`Generated ${this.datasets().length} dataset payload with ${this.fields().length} configured fields under the ${this.selectedScenario()} scenario.`);
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'Failed to generate advanced mock data.';
            this.statusMessage.set(detail);
            this.messageService.add({ severity: 'error', summary: 'Mock Data Generator', detail });
        }
    }

    async copyOutput() {
        const copied = await this.clipboardService.copyText(this.outputText());
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? 'Generated dataset graph copied to clipboard.' : 'Clipboard access is unavailable in this context.'
        });
    }

    downloadOutput() {
        const ok = this.textFileService.downloadText('mock-datasets.json', this.outputText(), 'application/json;charset=utf-8');
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Generated datasets downloaded.' : 'File download is unavailable in this context.'
        });
    }

    trackById(_: number, item: { id: number }) {
        return item.id;
    }

    onSeedChange(value: string) {
        this.seed.set(value);
        this.runPreview();
    }

    onIndentChange(value: number | null | undefined) {
        this.indent.set(value || 2);
        this.runPreview();
    }

    toggleAutoPreview(value: boolean) {
        this.autoPreview.set(value);
        if (value) {
            this.generate();
        }
    }

    private syncCounters() {
        this.nextDatasetId = Math.max(100, ...this.datasets().map((dataset) => dataset.id + 1));
        this.nextFieldId = Math.max(1000, ...this.fields().map((field) => field.id + 1));
    }

    private runPreview() {
        if (this.autoPreview()) {
            this.generate();
        }
    }
}
