import { Injectable } from '@angular/core';

export type MockFieldShape = 'scalar' | 'object' | 'array';
export type MockFieldType =
    | 'firstName'
    | 'lastName'
    | 'fullName'
    | 'email'
    | 'company'
    | 'word'
    | 'title'
    | 'sentence'
    | 'number'
    | 'boolean'
    | 'date'
    | 'uuid'
    | 'enum'
    | 'slug'
    | 'pattern';
export type MockFieldSourceMode = 'generated' | 'template' | 'reference';
export type MockDistribution = 'uniform' | 'sequence' | 'boundary';
export type MockConditionOperator = 'equals' | 'notEquals' | 'truthy' | 'falsy';
export type MockScenarioPreset = 'balanced' | 'edge' | 'chaos';

export interface MockDatasetDefinition {
    id: number;
    key: string;
    label: string;
    count: number;
}

export interface MockFieldDefinition {
    id: number;
    datasetId: number;
    parentId: number | null;
    name: string;
    shape: MockFieldShape;
    type: MockFieldType;
    sourceMode: MockFieldSourceMode;
    nullable: boolean;
    nullRate: number;
    omitRate: number;
    invalidRate: number;
    unique: boolean;
    min?: number;
    max?: number;
    arrayMin?: number;
    arrayMax?: number;
    optionsText?: string;
    template?: string;
    referenceDatasetId?: number | null;
    referenceFieldPath?: string;
    conditionPath?: string;
    conditionOperator?: MockConditionOperator;
    conditionValue?: string;
    distribution?: MockDistribution;
}

export interface MockGeneratorConfig {
    seed: string;
    indent: number;
    datasets: MockDatasetDefinition[];
    fields: MockFieldDefinition[];
}

export interface MockGeneratorResult {
    payload: Record<string, unknown>;
    jsonText: string;
}

interface GenerationContext {
    fields: MockFieldDefinition[];
    childMap: Map<number | null, MockFieldDefinition[]>;
    rootRecord: Record<string, unknown>;
    scopeRecord: Record<string, unknown>;
    datasetIndex: number;
    recordsByDataset: Map<number, Record<string, unknown>[]>;
    uniqueTracker: Map<number, Set<string>>;
    rng: () => number;
}

const OMIT_FIELD = Symbol('omit-field');

@Injectable({ providedIn: 'root' })
export class MockDataGeneratorService {
    private readonly firstNames = ['Linh', 'Minh', 'An', 'Maya', 'Kai', 'Olivia', 'Noah', 'Ava', 'Emma', 'Leo', 'Mia', 'Luca'];
    private readonly lastNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Ng', 'Garcia', 'Smith', 'Patel', 'Kim', 'Chen', 'Brown', 'Taylor'];
    private readonly companies = ['Acme Labs', 'Northwind', 'Sakai Digital', 'Blue Orbit', 'Summit Forge', 'Pixel Harbor', 'Atlas Cloud', 'Bright Path'];
    private readonly domains = ['example.dev', 'workspace.app', 'mockmail.test', 'fixture.local', 'devtools.io'];
    private readonly words = [
        'portable',
        'mock',
        'seeded',
        'fixture',
        'payload',
        'browser',
        'preview',
        'record',
        'schema',
        'typed',
        'stable',
        'release',
        'latency',
        'secure',
        'compact',
        'sample',
        'insight',
        'stream',
        'event',
        'sync'
    ];

    generate(config: MockGeneratorConfig): MockGeneratorResult {
        const rng = this.createRng(config.seed || 'devworkspace');
        const uniqueTracker = new Map<number, Set<string>>();
        const recordsByDataset = new Map<number, Record<string, unknown>[]>();
        const sanitizedDatasets = config.datasets.filter((dataset) => dataset.key.trim()).map((dataset) => ({ ...dataset, count: this.normalizeCount(dataset.count) }));

        for (const dataset of sanitizedDatasets) {
            const datasetFields = config.fields
                .filter((field) => field.datasetId === dataset.id && field.name.trim())
                .sort((left, right) => left.id - right.id);
            const childMap = this.groupFieldsByParent(datasetFields);
            const records = Array.from({ length: dataset.count }, (_, index) => {
                const rootRecord: Record<string, unknown> = {};
                const context: GenerationContext = {
                    fields: datasetFields,
                    childMap,
                    rootRecord,
                    scopeRecord: rootRecord,
                    datasetIndex: index,
                    recordsByDataset,
                    uniqueTracker,
                    rng
                };

                this.populateObject(rootRecord, null, context);
                return rootRecord;
            });

            recordsByDataset.set(dataset.id, records);
        }

        const payload = Object.fromEntries(sanitizedDatasets.map((dataset) => [this.safeRootKey(dataset.key), recordsByDataset.get(dataset.id) ?? []]));
        return {
            payload,
            jsonText: JSON.stringify(payload, null, config.indent)
        };
    }

    createCommercePreset(): { datasets: MockDatasetDefinition[]; fields: MockFieldDefinition[] } {
        const datasets: MockDatasetDefinition[] = [
            { id: 1, key: 'users', label: 'Users', count: 12 },
            { id: 2, key: 'products', label: 'Products', count: 10 },
            { id: 3, key: 'orders', label: 'Orders', count: 18 }
        ];

        const fields: MockFieldDefinition[] = [
            this.field(101, 1, 'id', { type: 'uuid', unique: true }),
            this.field(102, 1, 'firstName', { type: 'firstName' }),
            this.field(103, 1, 'lastName', { type: 'lastName' }),
            this.field(104, 1, 'fullName', { sourceMode: 'template', template: '{{firstName}} {{lastName}}' }),
            this.field(105, 1, 'email', { sourceMode: 'template', unique: true, template: '{{firstName|lower}}.{{lastName|lower}}@example.dev' }),
            this.field(106, 1, 'company', { type: 'company' }),
            this.field(107, 1, 'status', { type: 'enum', optionsText: 'active|70\npending|20\ndisabled|10' }),
            this.field(108, 1, 'profile', { shape: 'object' }),
            this.field(109, 1, 'createdAt', { type: 'date' }, 108),
            this.field(110, 1, 'bio', { type: 'sentence', nullable: true, nullRate: 0.2 }, 108),

            this.field(201, 2, 'id', { type: 'uuid', unique: true }),
            this.field(202, 2, 'sku', { type: 'pattern', unique: true, optionsText: 'SKU-{YY}-{####}' }),
            this.field(203, 2, 'title', { type: 'title' }),
            this.field(204, 2, 'slug', { sourceMode: 'template', unique: true, template: '{{title|slug}}' }),
            this.field(205, 2, 'category', { type: 'enum', optionsText: 'components|35\naccessories|25\nnetwork|20\nstorage|20' }),
            this.field(206, 2, 'price', { type: 'number', min: 15, max: 220, distribution: 'boundary' }),
            this.field(207, 2, 'inventory', { type: 'number', min: 0, max: 120 }),
            this.field(208, 2, 'attributes', { shape: 'object' }),
            this.field(209, 2, 'isActive', { type: 'boolean' }, 208),
            this.field(210, 2, 'description', { type: 'sentence', nullable: true, nullRate: 0.1 }, 208),

            this.field(301, 3, 'id', { type: 'pattern', unique: true, optionsText: 'ORD-{YYYY}-{#####}' }),
            this.field(302, 3, 'userId', { sourceMode: 'reference', referenceDatasetId: 1, referenceFieldPath: 'id' }),
            this.field(303, 3, 'status', { type: 'enum', optionsText: 'draft|10\nconfirmed|35\nshipped|30\ndelivered|20\ncancelled|5' }),
            this.field(304, 3, 'channel', { type: 'enum', optionsText: 'web|60\nmobile|25\npartner|15' }),
            this.field(305, 3, 'notes', { type: 'sentence', nullable: true, nullRate: 0.3 }),
            this.field(306, 3, 'shipping', { shape: 'object' }),
            this.field(307, 3, 'city', { type: 'enum', optionsText: 'Bangkok\nHanoi\nSingapore\nTokyo\nBerlin' }, 306),
            this.field(308, 3, 'carrier', { type: 'company' }, 306),
            this.field(309, 3, 'deliveredAt', { type: 'date', conditionPath: 'status', conditionOperator: 'equals', conditionValue: 'delivered' }),
            this.field(310, 3, 'items', { shape: 'array', arrayMin: 1, arrayMax: 4 }),
            this.field(311, 3, 'productId', { sourceMode: 'reference', referenceDatasetId: 2, referenceFieldPath: 'id' }, 310),
            this.field(312, 3, 'sku', { sourceMode: 'reference', referenceDatasetId: 2, referenceFieldPath: 'sku' }, 310),
            this.field(313, 3, 'quantity', { type: 'number', min: 1, max: 5, distribution: 'sequence' }, 310),
            this.field(314, 3, 'unitPrice', { sourceMode: 'reference', referenceDatasetId: 2, referenceFieldPath: 'price' }, 310),
            this.field(315, 3, 'metadata', { shape: 'object' }),
            this.field(316, 3, 'priority', { type: 'enum', optionsText: 'low|50\nnormal|35\nhigh|15' }, 315),
            this.field(317, 3, 'requestId', { type: 'uuid', unique: true }, 315)
        ];

        return { datasets, fields };
    }

    createCrmPreset(): { datasets: MockDatasetDefinition[]; fields: MockFieldDefinition[] } {
        const datasets: MockDatasetDefinition[] = [
            { id: 11, key: 'accounts', label: 'Accounts', count: 8 },
            { id: 12, key: 'contacts', label: 'Contacts', count: 16 },
            { id: 13, key: 'tickets', label: 'Tickets', count: 22 }
        ];

        const fields: MockFieldDefinition[] = [
            this.field(1101, 11, 'id', { type: 'uuid', unique: true }),
            this.field(1102, 11, 'name', { type: 'company', unique: true }),
            this.field(1103, 11, 'segment', { type: 'enum', optionsText: 'startup|30\nsmb|40\nenterprise|30' }),
            this.field(1104, 11, 'billing', { shape: 'object' }),
            this.field(1105, 11, 'plan', { type: 'enum', optionsText: 'starter\nteam\nenterprise' }, 1104),
            this.field(1106, 11, 'renewalAt', { type: 'date' }, 1104),

            this.field(1201, 12, 'id', { type: 'uuid', unique: true }),
            this.field(1202, 12, 'accountId', { sourceMode: 'reference', referenceDatasetId: 11, referenceFieldPath: 'id' }),
            this.field(1203, 12, 'firstName', { type: 'firstName' }),
            this.field(1204, 12, 'lastName', { type: 'lastName' }),
            this.field(1205, 12, 'fullName', { sourceMode: 'template', template: '{{firstName}} {{lastName}}' }),
            this.field(1206, 12, 'email', { sourceMode: 'template', unique: true, template: '{{firstName|lower}}.{{lastName|lower}}@crm.local' }),
            this.field(1207, 12, 'traits', { shape: 'array', arrayMin: 1, arrayMax: 3 }),
            this.field(1208, 12, 'value', { type: 'enum', optionsText: 'decision-maker\nadmin\nchampion\nfinance' }, 1207),

            this.field(1301, 13, 'id', { type: 'pattern', unique: true, optionsText: 'TCK-{######}' }),
            this.field(1302, 13, 'contactId', { sourceMode: 'reference', referenceDatasetId: 12, referenceFieldPath: 'id' }),
            this.field(1303, 13, 'subject', { type: 'title' }),
            this.field(1304, 13, 'subjectSlug', { sourceMode: 'template', template: '{{subject|slug}}' }),
            this.field(1305, 13, 'priority', { type: 'enum', optionsText: 'low|40\nmedium|40\nhigh|20' }),
            this.field(1306, 13, 'status', { type: 'enum', optionsText: 'open|50\npending|25\nresolved|20\nclosed|5' }),
            this.field(1307, 13, 'resolvedAt', { type: 'date', conditionPath: 'status', conditionOperator: 'equals', conditionValue: 'resolved' }),
            this.field(1308, 13, 'activity', { shape: 'array', arrayMin: 2, arrayMax: 5 }),
            this.field(1309, 13, 'value', { type: 'sentence', nullable: true, nullRate: 0.1 }, 1308)
        ];

        return { datasets, fields };
    }

    applyScenario(fields: MockFieldDefinition[], datasets: MockDatasetDefinition[], scenario: MockScenarioPreset): { fields: MockFieldDefinition[]; datasets: MockDatasetDefinition[] } {
        const datasetMultiplier = scenario === 'balanced' ? 1 : scenario === 'edge' ? 1.35 : 1.7;
        const nextDatasets = datasets.map((dataset) => ({
            ...dataset,
            count: this.normalizeCount(Math.round(dataset.count * datasetMultiplier))
        }));

        const nextFields = fields.map((field) => {
            const baseNullRate = field.nullable ? Math.max(field.nullRate, 0.12) : field.nullRate;

            return {
                ...field,
                nullRate: scenario === 'balanced' ? baseNullRate : scenario === 'edge' ? Math.max(baseNullRate, 0.22) : Math.max(baseNullRate, 0.35),
                omitRate: scenario === 'balanced' ? field.omitRate : scenario === 'edge' ? Math.max(field.omitRate, 0.06) : Math.max(field.omitRate, 0.12),
                invalidRate:
                    field.shape === 'scalar'
                        ? scenario === 'balanced'
                            ? field.invalidRate
                            : scenario === 'edge'
                              ? Math.max(field.invalidRate, this.isSensitiveScalar(field.type) ? 0.08 : 0.03)
                              : Math.max(field.invalidRate, this.isSensitiveScalar(field.type) ? 0.16 : 0.07)
                        : 0,
                unique: field.unique
            };
        });

        return { fields: nextFields, datasets: nextDatasets };
    }

    private field(id: number, datasetId: number, name: string, overrides: Partial<MockFieldDefinition>, parentId: number | null = null): MockFieldDefinition {
        return {
            id,
            datasetId,
            parentId,
            name,
            shape: overrides.shape ?? 'scalar',
            type: overrides.type ?? 'sentence',
            sourceMode: overrides.sourceMode ?? 'generated',
            nullable: overrides.nullable ?? false,
            nullRate: overrides.nullRate ?? 0,
            omitRate: overrides.omitRate ?? 0,
            invalidRate: overrides.invalidRate ?? 0,
            unique: overrides.unique ?? false,
            min: overrides.min,
            max: overrides.max,
            arrayMin: overrides.arrayMin,
            arrayMax: overrides.arrayMax,
            optionsText: overrides.optionsText,
            template: overrides.template,
            referenceDatasetId: overrides.referenceDatasetId ?? null,
            referenceFieldPath: overrides.referenceFieldPath,
            conditionPath: overrides.conditionPath,
            conditionOperator: overrides.conditionOperator ?? 'equals',
            conditionValue: overrides.conditionValue,
            distribution: overrides.distribution ?? 'uniform'
        };
    }

    private populateObject(target: Record<string, unknown>, parentId: number | null, context: GenerationContext) {
        const children = context.childMap.get(parentId) ?? [];
        for (const field of children) {
            const key = field.name.trim();
            if (!key) {
                continue;
            }

            const value = this.buildFieldValue(field, context);
            if (value !== OMIT_FIELD) {
                target[key] = value;
            }
        }
    }

    private buildFieldValue(field: MockFieldDefinition, context: GenerationContext): unknown {
        if (!this.shouldIncludeField(field, context)) {
            return OMIT_FIELD;
        }

        if (field.shape === 'object') {
            const nested: Record<string, unknown> = {};
            this.populateObject(nested, field.id, { ...context, scopeRecord: nested });
            return nested;
        }

        if (field.shape === 'array') {
            return this.buildArrayValue(field, context);
        }

        if (field.nullable && context.rng() < this.clampRate(field.nullRate)) {
            return null;
        }

        const rawValue = this.resolveScalarValue(field, context);
        const nextValue = context.rng() < this.clampRate(field.invalidRate) ? this.makeInvalidValue(field) : rawValue;

        if (!field.unique) {
            return nextValue;
        }

        return this.enforceUnique(
            field,
            context,
            () => {
                const freshRaw = this.resolveScalarValue(field, context);
                return context.rng() < this.clampRate(field.invalidRate) ? this.makeInvalidValue(field) : freshRaw;
            },
            nextValue
        );
    }

    private buildArrayValue(field: MockFieldDefinition, context: GenerationContext): unknown[] {
        const min = field.arrayMin ?? 1;
        const max = field.arrayMax ?? Math.max(min, 3);
        const length = this.randomInteger(min, max, context.rng);
        const children = context.childMap.get(field.id) ?? [];

        if (children.length === 1 && children[0].name === 'value' && children[0].shape === 'scalar') {
            return Array.from({ length }, (_, index) =>
                this.buildFieldValue(children[0], { ...context, datasetIndex: context.datasetIndex + index, scopeRecord: {} as Record<string, unknown> })
            ).filter((item) => item !== OMIT_FIELD);
        }

        return Array.from({ length }, () => {
            const item: Record<string, unknown> = {};
            this.populateObject(item, field.id, { ...context, scopeRecord: item });
            return item;
        });
    }

    private shouldIncludeField(field: MockFieldDefinition, context: GenerationContext): boolean {
        if (context.rng() < this.clampRate(field.omitRate)) {
            return false;
        }

        if (!field.conditionPath) {
            return true;
        }

        const value = this.resolvePath(field.conditionPath, context.scopeRecord, context.rootRecord);
        const normalizedTarget = this.normalizeConditionValue(field.conditionValue);
        switch (field.conditionOperator ?? 'equals') {
            case 'notEquals':
                return String(value ?? '') !== normalizedTarget;
            case 'truthy':
                return Boolean(value);
            case 'falsy':
                return !value;
            default:
                return String(value ?? '') === normalizedTarget;
        }
    }

    private resolveScalarValue(field: MockFieldDefinition, context: GenerationContext): unknown {
        if (field.sourceMode === 'template') {
            return this.applyTemplate(field.template || '', context.scopeRecord, context.rootRecord);
        }

        if (field.sourceMode === 'reference') {
            return this.resolveReference(field, context);
        }

        switch (field.type) {
            case 'firstName':
                return this.pick(this.firstNames, context.rng);
            case 'lastName':
                return this.pick(this.lastNames, context.rng);
            case 'fullName': {
                const first = this.resolvePath('firstName', context.scopeRecord, context.rootRecord) ?? this.pick(this.firstNames, context.rng);
                const last = this.resolvePath('lastName', context.scopeRecord, context.rootRecord) ?? this.pick(this.lastNames, context.rng);
                return `${first} ${last}`;
            }
            case 'email': {
                const first = String(this.resolvePath('firstName', context.scopeRecord, context.rootRecord) ?? this.pick(this.firstNames, context.rng)).toLowerCase();
                const last = String(this.resolvePath('lastName', context.scopeRecord, context.rootRecord) ?? this.pick(this.lastNames, context.rng))
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '');
                return `${first}.${last}${context.datasetIndex + 1}@${this.pick(this.domains, context.rng)}`;
            }
            case 'company':
                return this.pick(this.companies, context.rng);
            case 'word':
                return this.pick(this.words, context.rng);
            case 'title':
                return this.createTitle(context.rng);
            case 'sentence':
                return this.createSentence(context.rng);
            case 'number':
                return this.createNumber(field, context);
            case 'boolean':
                return context.rng() >= 0.5;
            case 'date':
                return this.createIsoDate(context.datasetIndex, context.rng);
            case 'uuid':
                return this.createUuid(context.rng);
            case 'enum':
                return this.pickWeightedOption(field.optionsText, context.rng);
            case 'slug': {
                const base = String(this.resolvePath('title', context.scopeRecord, context.rootRecord) ?? this.createTitle(context.rng));
                return this.slugify(base);
            }
            case 'pattern':
                return this.resolvePattern(field.optionsText || 'PAT-{####}', context.datasetIndex, context.rng);
        }
    }

    private resolveReference(field: MockFieldDefinition, context: GenerationContext): unknown {
        const datasetId = field.referenceDatasetId ?? null;
        if (!datasetId) {
            return null;
        }

        const source = context.recordsByDataset.get(datasetId) ?? [];
        if (!source.length) {
            return null;
        }

        const selected = source[context.datasetIndex % source.length] ?? this.pick(source, context.rng);
        return this.resolvePath(field.referenceFieldPath || 'id', selected, selected);
    }

    private enforceUnique(field: MockFieldDefinition, context: GenerationContext, factory: () => unknown, initialValue: unknown): unknown {
        const seen = context.uniqueTracker.get(field.id) ?? new Set<string>();
        context.uniqueTracker.set(field.id, seen);

        let attempts = 0;
        let value = initialValue;
        let token = JSON.stringify(value);

        while (seen.has(token) && attempts < 20) {
            value = factory();
            token = JSON.stringify(value);
            attempts += 1;
        }

        seen.add(token);
        return value;
    }

    private makeInvalidValue(field: MockFieldDefinition): unknown {
        switch (field.type) {
            case 'email':
                return 'invalid-email';
            case 'uuid':
                return 'not-a-uuid';
            case 'date':
                return 'not-a-date';
            case 'number':
                return 'NaN';
            case 'boolean':
                return 'maybe';
            case 'enum':
                return 'unknown';
            default:
                return '###invalid###';
        }
    }

    private createTitle(rng: () => number): string {
        const wordCount = this.randomInteger(2, 5, rng);
        const words = Array.from({ length: wordCount }, () => this.pick(this.words, rng));
        return words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
    }

    private createSentence(rng: () => number): string {
        const wordCount = this.randomInteger(5, 11, rng);
        const tokens = Array.from({ length: wordCount }, () => this.pick(this.words, rng));
        const sentence = tokens.join(' ');
        return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
    }

    private createNumber(field: MockFieldDefinition, context: GenerationContext): number {
        const min = field.min ?? 0;
        const max = field.max ?? 1000;
        switch (field.distribution ?? 'uniform') {
            case 'sequence':
                return Math.min(max, min + context.datasetIndex);
            case 'boundary':
                return [min, max, min + 1, max - 1][context.datasetIndex % 4];
            default:
                return this.randomInteger(min, max, context.rng);
        }
    }

    private createIsoDate(index: number, rng: () => number): string {
        const base = Date.UTC(2026, 0, 1, 0, 0, 0);
        const dayOffset = this.randomInteger(0, 180, rng) + index;
        const minuteOffset = this.randomInteger(0, 1440, rng);
        return new Date(base + dayOffset * 86400000 + minuteOffset * 60000).toISOString();
    }

    private createUuid(rng: () => number): string {
        const bytes = Array.from({ length: 16 }, () => Math.floor(rng() * 256));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    private pickWeightedOption(value = '', rng: () => number): string {
        const options = value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [label, weightValue] = line.split('|').map((item) => item.trim());
                const weight = Number(weightValue);
                return { label, weight: Number.isFinite(weight) && weight > 0 ? weight : 1 };
            });

        if (!options.length) {
            return 'option';
        }

        const total = options.reduce((sum, option) => sum + option.weight, 0);
        let target = rng() * total;
        for (const option of options) {
            target -= option.weight;
            if (target <= 0) {
                return option.label;
            }
        }

        return options[options.length - 1].label;
    }

    private resolvePattern(pattern: string, index: number, rng: () => number): string {
        const now = new Date(Date.UTC(2026, 0, 1));
        const replacements: Record<string, string> = {
            '{YYYY}': String(now.getUTCFullYear()),
            '{YY}': String(now.getUTCFullYear()).slice(-2),
            '{seq}': String(index + 1),
            '{uuid8}': this.createUuid(rng).slice(0, 8)
        };

        let result = pattern;
        for (const [token, value] of Object.entries(replacements)) {
            result = result.replaceAll(token, value);
        }

        return result.replace(/\{(#+)\}/g, (_, hashes: string) => String(index + 1).padStart(hashes.length, '0'));
    }

    private applyTemplate(template: string, scopeRecord: Record<string, unknown>, rootRecord: Record<string, unknown>): string {
        return template.replace(/\{\{\s*([^}|]+?)(?:\|([^}]+))?\s*\}\}/g, (_, path: string, transform: string | undefined) => {
            const raw = this.resolvePath(path.trim(), scopeRecord, rootRecord);
            const value = raw == null ? '' : String(raw);
            return this.applyTransform(value, transform?.trim());
        });
    }

    private applyTransform(value: string, transform?: string): string {
        switch (transform) {
            case 'lower':
                return value.toLowerCase();
            case 'upper':
                return value.toUpperCase();
            case 'slug':
                return this.slugify(value);
            default:
                return value;
        }
    }

    private slugify(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private resolvePath(path: string, scopeRecord: Record<string, unknown>, rootRecord: Record<string, unknown>): unknown {
        const normalized = path.trim().replace(/^\$root\./, '');
        const fromScope = this.readPath(scopeRecord, normalized);
        return fromScope !== undefined ? fromScope : this.readPath(rootRecord, normalized);
    }

    private readPath(source: unknown, path: string): unknown {
        if (!path) {
            return source;
        }

        return path.split('.').reduce<unknown>((current, segment) => {
            if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
                return (current as Record<string, unknown>)[segment];
            }
            return undefined;
        }, source);
    }

    private groupFieldsByParent(fields: MockFieldDefinition[]): Map<number | null, MockFieldDefinition[]> {
        return fields.reduce((map, field) => {
            const current = map.get(field.parentId) ?? [];
            current.push(field);
            map.set(field.parentId, current);
            return map;
        }, new Map<number | null, MockFieldDefinition[]>());
    }

    private normalizeConditionValue(value?: string): string {
        return (value ?? '').trim();
    }

    private normalizeCount(value: number): number {
        if (!Number.isFinite(value)) {
            return 1;
        }

        return Math.max(1, Math.min(250, Math.floor(value)));
    }

    private clampRate(value: number): number {
        return Math.max(0, Math.min(1, value || 0));
    }

    private safeRootKey(value: string): string {
        const normalized = value.trim();
        return normalized || 'items';
    }

    private randomInteger(min: number, max: number, rng: () => number): number {
        const start = Math.min(min, max);
        const end = Math.max(min, max);
        return Math.floor(rng() * (end - start + 1)) + start;
    }

    private pick<T>(values: T[], rng: () => number): T {
        return values[Math.floor(rng() * values.length)];
    }

    private isSensitiveScalar(type: MockFieldType): boolean {
        return type === 'email' || type === 'uuid' || type === 'date' || type === 'pattern';
    }

    private createRng(seed: string): () => number {
        const seedHash = this.xmur3(seed);
        let state = seedHash();

        return () => {
            state |= 0;
            state = (state + 0x6d2b79f5) | 0;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    private xmur3(value: string): () => number {
        let hash = 1779033703 ^ value.length;
        for (let index = 0; index < value.length; index += 1) {
            hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
            hash = (hash << 13) | (hash >>> 19);
        }

        return () => {
            hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
            hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
            return (hash ^= hash >>> 16) >>> 0;
        };
    }
}
