import { MockDataGeneratorService, MockFieldDefinition } from './mock-data-generator.service';

describe('MockDataGeneratorService', () => {
    let service: MockDataGeneratorService;

    beforeEach(() => {
        service = new MockDataGeneratorService();
    });

    it('returns stable output for the same seed and config', () => {
        const preset = service.createCommercePreset();
        const config = {
            seed: 'stable-seed',
            indent: 2,
            datasets: preset.datasets,
            fields: preset.fields
        };

        const first = service.generate(config);
        const second = service.generate(config);

        expect(first.jsonText).toBe(second.jsonText);
    });

    it('builds nested objects, arrays, and cross-dataset references', () => {
        const preset = service.createCommercePreset();
        const result = service.generate({
            seed: 'commerce-check',
            indent: 2,
            datasets: preset.datasets,
            fields: preset.fields
        });

        const payload = result.payload as Record<string, Array<Record<string, unknown>>>;
        const userIds = new Set(payload['users'].map((user) => user['id']));
        const productIds = new Set(payload['products'].map((product) => product['id']));
        const order = payload['orders'][0];
        const items = order['items'] as Array<Record<string, unknown>>;

        expect(order['shipping']).toEqual(jasmine.any(Object));
        expect(Array.isArray(items)).toBeTrue();
        expect(items.length).toBeGreaterThan(0);
        expect(userIds.has(order['userId'] as string)).toBeTrue();
        expect(productIds.has(items[0]['productId'] as string)).toBeTrue();
    });

    it('supports template related fields and conditional fields', () => {
        const datasets = [{ id: 1, key: 'records', label: 'Records', count: 4 }];
        const fields: MockFieldDefinition[] = [
            {
                id: 1,
                datasetId: 1,
                parentId: null,
                name: 'firstName',
                shape: 'scalar',
                type: 'firstName',
                sourceMode: 'generated',
                nullable: false,
                nullRate: 0,
                omitRate: 0,
                invalidRate: 0,
                unique: false,
                distribution: 'uniform'
            },
            {
                id: 2,
                datasetId: 1,
                parentId: null,
                name: 'email',
                shape: 'scalar',
                type: 'email',
                sourceMode: 'template',
                nullable: false,
                nullRate: 0,
                omitRate: 0,
                invalidRate: 0,
                unique: true,
                template: '{{firstName|lower}}@example.dev',
                distribution: 'uniform'
            },
            {
                id: 3,
                datasetId: 1,
                parentId: null,
                name: 'status',
                shape: 'scalar',
                type: 'enum',
                sourceMode: 'generated',
                nullable: false,
                nullRate: 0,
                omitRate: 0,
                invalidRate: 0,
                unique: false,
                optionsText: 'draft|1\ndelivered|5',
                distribution: 'uniform'
            },
            {
                id: 4,
                datasetId: 1,
                parentId: null,
                name: 'deliveredAt',
                shape: 'scalar',
                type: 'date',
                sourceMode: 'generated',
                nullable: false,
                nullRate: 0,
                omitRate: 0,
                invalidRate: 0,
                unique: false,
                conditionPath: 'status',
                conditionOperator: 'equals',
                conditionValue: 'delivered',
                distribution: 'uniform'
            }
        ];

        const result = service.generate({ seed: 'conditional-check', indent: 2, datasets, fields });
        const rows = result.payload['records'] as Array<Record<string, unknown>>;

        expect(rows.every((row) => String(row['email']).endsWith('@example.dev'))).toBeTrue();
        expect(rows.some((row) => row['status'] === 'delivered' && !!row['deliveredAt'])).toBeTrue();
    });

    it('applies edge scenario with higher invalid and omission rates', () => {
        const preset = service.createCrmPreset();
        const scenario = service.applyScenario(preset.fields, preset.datasets, 'edge');
        const emailField = scenario.fields.find((field) => field.name === 'email');
        const dataset = scenario.datasets.find((item) => item.key === 'tickets');

        expect(emailField?.invalidRate).toBeGreaterThan(0);
        expect(dataset?.count).toBeGreaterThan(preset.datasets.find((item) => item.key === 'tickets')!.count);
    });
});
