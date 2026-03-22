import { QueryPlaygroundService } from './query-playground.service';

describe('QueryPlaygroundService', () => {
    let service: QueryPlaygroundService;

    beforeEach(() => {
        service = new QueryPlaygroundService();
    });

    it('returns JSONPath matches with paths', () => {
        const result = service.execute('jsonpath', '{ "services": [{ "name": "query-playground", "enabled": true }, { "name": "schema-lab", "enabled": false }] }', '$.services[?(@.enabled === true)].name', 'detailed');

        expect(result.matchCount).toBe(1);
        expect(result.outputText).toContain('query-playground');
        expect(result.outputText).toContain("$['services'][0]['name']");
    });

    it('returns XPath text matches', () => {
        const result = service.execute('xpath', '<workspace><service enabled="true"><name>query-playground</name></service><service enabled="false"><name>schema-lab</name></service></workspace>', '//service[@enabled="true"]/name/text()', 'detailed');

        expect(result.matchCount).toBe(1);
        expect(result.outputText).toContain('query-playground');
        expect(result.outputText).toContain('/workspace[1]/service[1]/name[1]/text()');
    });

    it('throws for invalid JSON input', () => {
        expect(() => service.execute('jsonpath', '{ invalid', '$.name', 'detailed')).toThrowError(/Invalid JSON input/);
    });

    it('returns only values when values mode is selected', () => {
        const result = service.execute('jsonpath', '{ "items": [{ "id": 1 }, { "id": 2 }] }', '$.items[*].id', 'values');

        expect(result.outputText).toBe('[\n  1,\n  2\n]');
    });

    it('returns only paths when paths mode is selected', () => {
        const result = service.execute('jsonpath', '{ "items": [{ "id": 1 }, { "id": 2 }] }', '$.items[*].id', 'paths');

        expect(result.outputText).toContain("$['items'][0]['id']");
        expect(result.outputText).not.toContain('"value"');
    });
});
