import { DataConverterService } from './data-converter.service';

describe('DataConverterService', () => {
    let service: DataConverterService;

    beforeEach(() => {
        service = new DataConverterService();
    });

    it('converts JSON to YAML', () => {
        const result = service.convert('{"name":"DevWorkspace","active":true}', 'json', 'yaml');
        expect(result).toContain('name: DevWorkspace');
        expect(result).toContain('active: true');
    });

    it('parses CSV rows into JSON records', () => {
        const result = service.convert('name,role\nAna,Frontend\nBao,Backend', 'csv', 'json');
        expect(JSON.parse(result)).toEqual([
            { name: 'Ana', role: 'Frontend' },
            { name: 'Bao', role: 'Backend' }
        ]);
    });

    it('escapes a raw string for JSON string transport', () => {
        expect(service.escapeJsonString('line 1\nline 2')).toBe('line 1\\nline 2');
    });
});
