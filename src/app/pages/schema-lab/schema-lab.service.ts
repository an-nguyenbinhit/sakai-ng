import { Injectable } from '@angular/core';
import Ajv, { ErrorObject } from 'ajv';

type ScalarKind = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'any';

type SchemaNode =
    | { kind: ScalarKind }
    | { kind: 'array'; items: SchemaNode }
    | { kind: 'object'; properties: Record<string, SchemaNode>; required: string[] }
    | { kind: 'union'; variants: SchemaNode[] };

export interface SchemaLabValidationResult {
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
}

@Injectable({ providedIn: 'root' })
export class SchemaLabService {
    private readonly ajv = new Ajv({ allErrors: true, strict: false });

    inferSchemaFromText(input: string): string {
        const parsed = JSON.parse(input);
        const descriptor = this.inferNode(parsed);
        return JSON.stringify(this.toJsonSchema(descriptor), null, 2);
    }

    generateTypeScriptFromText(input: string, rootName = 'RootSchema'): string {
        const parsed = JSON.parse(input);
        const descriptor = this.inferNode(parsed);
        const typeBody = this.toTsType(descriptor, 0);
        const safeName = this.toPascalCase(rootName);

        if (descriptor.kind === 'object') {
            return `export interface ${safeName} ${typeBody}\n`;
        }

        return `export type ${safeName} = ${typeBody};\n`;
    }

    generateZodFromText(input: string, rootName = 'rootSchema'): string {
        const parsed = JSON.parse(input);
        const descriptor = this.inferNode(parsed);
        const schemaName = this.toCamelCase(rootName);
        const typeName = this.toPascalCase(rootName);

        return `import { z } from 'zod';\n\nexport const ${schemaName} = ${this.toZodSchema(descriptor, 0)};\n\nexport type ${typeName} = z.infer<typeof ${schemaName}>;\n`;
    }

    validate(payloadText: string, schemaText: string): SchemaLabValidationResult {
        const payload = JSON.parse(payloadText);
        const schema = JSON.parse(schemaText);
        const validate = this.ajv.compile(schema);
        const valid = validate(payload);

        return {
            valid: Boolean(valid),
            errors: valid ? [] : this.mapErrors(validate.errors ?? [])
        };
    }

    private inferNode(value: unknown): SchemaNode {
        if (value === null) {
            return { kind: 'null' };
        }

        if (Array.isArray(value)) {
            if (!value.length) {
                return { kind: 'array', items: { kind: 'any' } };
            }

            const merged = value.map((item) => this.inferNode(item)).reduce((acc, item) => this.mergeNodes(acc, item));
            return { kind: 'array', items: merged };
        }

        if (typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>);
            return {
                kind: 'object',
                properties: Object.fromEntries(entries.map(([key, child]) => [key, this.inferNode(child)])),
                required: entries.map(([key]) => key)
            };
        }

        if (typeof value === 'number') {
            return { kind: Number.isInteger(value) ? 'integer' : 'number' };
        }

        if (typeof value === 'string') {
            return { kind: 'string' };
        }

        if (typeof value === 'boolean') {
            return { kind: 'boolean' };
        }

        return { kind: 'any' };
    }

    private mergeNodes(left: SchemaNode, right: SchemaNode): SchemaNode {
        if (this.signature(left) === this.signature(right)) {
            if (left.kind === 'object' && right.kind === 'object') {
                return this.mergeObjects(left, right);
            }

            if (left.kind === 'array' && right.kind === 'array') {
                return { kind: 'array', items: this.mergeNodes(left.items, right.items) };
            }

            return left;
        }

        if (left.kind === 'object' && right.kind === 'object') {
            return this.mergeObjects(left, right);
        }

        if (left.kind === 'array' && right.kind === 'array') {
            return { kind: 'array', items: this.mergeNodes(left.items, right.items) };
        }

        if (left.kind === 'integer' && right.kind === 'number') {
            return { kind: 'number' };
        }

        if (left.kind === 'number' && right.kind === 'integer') {
            return { kind: 'number' };
        }

        const variants = [left, right].flatMap((node) => (node.kind === 'union' ? node.variants : [node]));
        const deduped = variants.reduce<SchemaNode[]>((acc, node) => {
            const existing = acc.find((candidate) => this.signature(candidate) === this.signature(node));
            if (!existing) {
                acc.push(node);
            }
            return acc;
        }, []);

        return deduped.length === 1 ? deduped[0] : { kind: 'union', variants: deduped };
    }

    private mergeObjects(left: Extract<SchemaNode, { kind: 'object' }>, right: Extract<SchemaNode, { kind: 'object' }>): SchemaNode {
        const keys = new Set([...Object.keys(left.properties), ...Object.keys(right.properties)]);
        const properties: Record<string, SchemaNode> = {};

        for (const key of keys) {
            const leftValue = left.properties[key];
            const rightValue = right.properties[key];

            if (leftValue && rightValue) {
                properties[key] = this.mergeNodes(leftValue, rightValue);
                continue;
            }

            properties[key] = (leftValue ?? rightValue)!;
        }

        const required = left.required.filter((key) => right.required.includes(key));
        return { kind: 'object', properties, required };
    }

    private toJsonSchema(node: SchemaNode): Record<string, unknown> {
        switch (node.kind) {
            case 'string':
            case 'number':
            case 'integer':
            case 'boolean':
            case 'null':
                return { type: node.kind };
            case 'any':
                return {};
            case 'array':
                return { type: 'array', items: this.toJsonSchema(node.items) };
            case 'object':
                return {
                    type: 'object',
                    properties: Object.fromEntries(Object.entries(node.properties).map(([key, value]) => [key, this.toJsonSchema(value)])),
                    required: node.required,
                    additionalProperties: false
                };
            case 'union':
                return { anyOf: node.variants.map((variant) => this.toJsonSchema(variant)) };
        }
    }

    private toTsType(node: SchemaNode, depth: number): string {
        switch (node.kind) {
            case 'string':
            case 'number':
            case 'boolean':
                return node.kind;
            case 'integer':
                return 'number';
            case 'null':
                return 'null';
            case 'any':
                return 'unknown';
            case 'array':
                return `Array<${this.toTsType(node.items, depth)}>`;
            case 'union':
                return node.variants.map((variant) => this.toTsType(variant, depth)).join(' | ');
            case 'object': {
                const indent = this.indent(depth);
                const childIndent = this.indent(depth + 1);
                const lines = Object.entries(node.properties).map(([key, value]) => {
                    const optional = node.required.includes(key) ? '' : '?';
                    return `${childIndent}${this.quoteIfNeeded(key)}${optional}: ${this.toTsType(value, depth + 1)};`;
                });
                return `{\n${lines.join('\n')}\n${indent}}`;
            }
        }
    }

    private toZodSchema(node: SchemaNode, depth: number): string {
        switch (node.kind) {
            case 'string':
                return 'z.string()';
            case 'number':
                return 'z.number()';
            case 'integer':
                return 'z.number().int()';
            case 'boolean':
                return 'z.boolean()';
            case 'null':
                return 'z.null()';
            case 'any':
                return 'z.unknown()';
            case 'array':
                return `z.array(${this.toZodSchema(node.items, depth)})`;
            case 'union':
                return `z.union([${node.variants.map((variant) => this.toZodSchema(variant, depth)).join(', ')}])`;
            case 'object': {
                const indent = this.indent(depth);
                const childIndent = this.indent(depth + 1);
                const lines = Object.entries(node.properties).map(([key, value]) => {
                    const optional = node.required.includes(key) ? '' : '.optional()';
                    return `${childIndent}${this.quoteIfNeeded(key)}: ${this.toZodSchema(value, depth + 1)}${optional},`;
                });
                return `z.object({\n${lines.join('\n')}\n${indent}})`;
            }
        }
    }

    private signature(node: SchemaNode): string {
        switch (node.kind) {
            case 'array':
                return `array:${this.signature(node.items)}`;
            case 'object':
                return `object:${Object.entries(node.properties)
                    .map(([key, value]) => `${key}:${this.signature(value)}${node.required.includes(key) ? '!' : '?'}`)
                    .sort()
                    .join(',')}`;
            case 'union':
                return `union:${node.variants.map((variant) => this.signature(variant)).sort().join('|')}`;
            default:
                return node.kind;
        }
    }

    private mapErrors(errors: ErrorObject[]): Array<{ path: string; message: string }> {
        return errors.map((error) => ({
            path: error.instancePath || '$',
            message: error.message || 'Validation failed.'
        }));
    }

    private indent(depth: number): string {
        return '    '.repeat(depth);
    }

    private quoteIfNeeded(value: string): string {
        return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : JSON.stringify(value);
    }

    private toPascalCase(value: string): string {
        const normalized = value.replace(/[^A-Za-z0-9]+/g, ' ').trim() || 'RootSchema';
        return normalized
            .split(/\s+/)
            .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join('');
    }

    private toCamelCase(value: string): string {
        const pascal = this.toPascalCase(value);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
}
