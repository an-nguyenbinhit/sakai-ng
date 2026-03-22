import { Injectable } from '@angular/core';
import YAML from 'yaml';
import * as TOML from 'toml';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export type DataFormat = 'json' | 'yaml' | 'toml' | 'xml' | 'csv' | 'tsv';

@Injectable({ providedIn: 'root' })
export class DataConverterService {
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        trimValues: false,
        parseTagValue: false,
        parseAttributeValue: false
    });

    private readonly xmlBuilder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
        suppressEmptyNode: false
    });

    parse(input: string, format: DataFormat): unknown {
        switch (format) {
            case 'json':
                return JSON.parse(input);
            case 'yaml':
                return YAML.parse(input);
            case 'toml':
                return TOML.parse(input);
            case 'xml':
                return this.xmlParser.parse(input);
            case 'csv':
                return this.parseDelimited(input, ',');
            case 'tsv':
                return this.parseDelimited(input, '\t');
            default:
                return input;
        }
    }

    serialize(value: unknown, format: DataFormat): string {
        switch (format) {
            case 'json':
                return JSON.stringify(value, null, 2);
            case 'yaml':
                return YAML.stringify(value);
            case 'toml':
                return this.stringifyToml(value);
            case 'xml':
                return this.xmlBuilder.build(value);
            case 'csv':
                return this.serializeDelimited(value, ',');
            case 'tsv':
                return this.serializeDelimited(value, '\t');
            default:
                return String(value ?? '');
        }
    }

    convert(input: string, inputFormat: DataFormat, outputFormat: DataFormat): string {
        const parsed = this.parse(input, inputFormat);
        return this.serialize(parsed, outputFormat);
    }

    formatJson(input: string): string {
        return JSON.stringify(JSON.parse(input), null, 2);
    }

    minifyJson(input: string): string {
        return JSON.stringify(JSON.parse(input));
    }

    escapeJsonString(input: string): string {
        return JSON.stringify(input).slice(1, -1);
    }

    stringifyJsonLiteral(input: string): string {
        return JSON.stringify(input);
    }

    private stringifyToml(value: unknown): string {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error('TOML output requires an object at the root level.');
        }
        return this.convertObjectToToml(value as Record<string, unknown>);
    }

    private convertObjectToToml(obj: Record<string, unknown>, path: string[] = []): string {
        const scalarLines: string[] = [];
        const tableLines: string[] = [];

        for (const [key, value] of Object.entries(obj)) {
            if (this.isScalar(value) || Array.isArray(value) && value.every((item) => this.isScalar(item))) {
                scalarLines.push(`${key} = ${this.formatTomlValue(value)}`);
                continue;
            }

            if (Array.isArray(value)) {
                value.forEach((entry) => {
                    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
                        throw new Error('Nested TOML arrays must contain objects or scalar arrays.');
                    }
                    const header = `[${[...path, key].join('.')}]`;
                    tableLines.push(header);
                    tableLines.push(this.convertObjectToToml(entry as Record<string, unknown>, [...path, key]).trim());
                });
                continue;
            }

            if (typeof value === 'object' && value !== null) {
                const header = `[${[...path, key].join('.')}]`;
                tableLines.push(header);
                tableLines.push(this.convertObjectToToml(value as Record<string, unknown>, [...path, key]).trim());
            }
        }

        return [...scalarLines, ...tableLines].filter(Boolean).join('\n').trim() + '\n';
    }

    private formatTomlValue(value: unknown): string {
        if (typeof value === 'string') {
            return JSON.stringify(value);
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        if (Array.isArray(value)) {
            return `[${value.map((item) => this.formatTomlValue(item)).join(', ')}]`;
        }
        if (value === null) {
            throw new Error('TOML does not support null values.');
        }
        throw new Error('Unsupported TOML value encountered.');
    }

    private parseDelimited(input: string, delimiter: string): Record<string, string>[] {
        const rows = this.parseDelimitedRows(input, delimiter).filter((row) => row.some((cell) => cell.trim() !== ''));
        if (!rows.length) {
            return [];
        }

        const [headers, ...records] = rows;
        return records.map((row) =>
            headers.reduce<Record<string, string>>((acc, header, index) => {
                acc[header || `column_${index + 1}`] = row[index] ?? '';
                return acc;
            }, {})
        );
    }

    private serializeDelimited(value: unknown, delimiter: string): string {
        if (!Array.isArray(value)) {
            throw new Error('CSV/TSV output requires an array of objects.');
        }

        const normalized = value as Array<Record<string, unknown>>;
        if (!normalized.length) {
            return '';
        }

        const headers = Array.from(new Set(normalized.flatMap((entry) => Object.keys(entry))));
        const rows = normalized.map((entry) =>
            headers
                .map((header) => {
                    const raw = entry[header] ?? '';
                    const stringValue = typeof raw === 'string' ? raw : JSON.stringify(raw);
                    return this.escapeDelimitedCell(stringValue, delimiter);
                })
                .join(delimiter)
        );

        return [headers.join(delimiter), ...rows].join('\n');
    }

    private parseDelimitedRows(input: string, delimiter: string): string[][] {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentValue = '';
        let inQuotes = false;

        for (let index = 0; index < input.length; index += 1) {
            const char = input[index];
            const next = input[index + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    currentValue += '"';
                    index += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === delimiter && !inQuotes) {
                currentRow.push(currentValue);
                currentValue = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') {
                    index += 1;
                }
                currentRow.push(currentValue);
                rows.push(currentRow);
                currentRow = [];
                currentValue = '';
                continue;
            }

            currentValue += char;
        }

        if (currentValue.length || currentRow.length) {
            currentRow.push(currentValue);
            rows.push(currentRow);
        }

        return rows;
    }

    private escapeDelimitedCell(value: string, delimiter: string): string {
        if (value.includes('"') || value.includes('\n') || value.includes('\r') || value.includes(delimiter)) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    private isScalar(value: unknown): boolean {
        return ['string', 'number', 'boolean'].includes(typeof value);
    }
}
