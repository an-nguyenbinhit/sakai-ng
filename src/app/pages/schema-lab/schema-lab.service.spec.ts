import { SchemaLabService } from './schema-lab.service';

describe('SchemaLabService', () => {
    let service: SchemaLabService;

    beforeEach(() => {
        service = new SchemaLabService();
    });

    it('infers object schema from a sample payload', () => {
        const result = JSON.parse(service.inferSchemaFromText('{"name":"DevWorkspace","flags":["schema"],"version":21}'));

        expect(result.type).toBe('object');
        expect(result.properties.name.type).toBe('string');
        expect(result.properties.flags.type).toBe('array');
        expect(result.properties.version.type).toBe('integer');
    });

    it('validates payloads against a schema', () => {
        const result = service.validate('{"enabled":true}', '{"type":"object","properties":{"enabled":{"type":"boolean"}},"required":["enabled"],"additionalProperties":false}');

        expect(result.valid).toBeTrue();
        expect(result.errors).toEqual([]);
    });

    it('generates TypeScript and Zod output from sample json', () => {
        const ts = service.generateTypeScriptFromText('{"user":{"id":1,"email":"a@example.com"}}', 'ApiResponse');
        const zod = service.generateZodFromText('{"user":{"id":1,"email":"a@example.com"}}', 'apiResponseSchema');

        expect(ts).toContain('export interface ApiResponse');
        expect(ts).toContain('user: {');
        expect(zod).toContain("import { z } from 'zod';");
        expect(zod).toContain('export const apiResponseSchema = z.object({');
    });
});
