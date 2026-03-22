import { Injectable } from '@angular/core';
import { JSONPath } from 'jsonpath-plus';
import { TreeNode } from 'primeng/api';

export type QueryLanguage = 'jsonpath' | 'xpath';
export type QueryResultMode = 'values' | 'paths' | 'detailed';

export interface QueryExample {
    label: string;
    query: string;
}

export interface QueryPlaygroundExecution {
    language: QueryLanguage;
    matchCount: number;
    outputText: string;
    tree: TreeNode[];
}

interface JsonPathMatch {
    path?: string;
    value: unknown;
}

interface XPathMatch {
    path: string;
    value: unknown;
}

interface QueryOutputEntry {
    index: number;
    path: string;
    value: unknown;
}

@Injectable({ providedIn: 'root' })
export class QueryPlaygroundService {
    readonly examples: Record<QueryLanguage, QueryExample[]> = {
        jsonpath: [
            { label: 'All services', query: '$.services[*]' },
            { label: 'Enabled tools', query: '$.services[?(@.enabled === true)].name' },
            { label: 'First owner', query: '$.meta.owners[0]' }
        ],
        xpath: [
            { label: 'All service nodes', query: '//service' },
            { label: 'Enabled service names', query: '//service[@enabled="true"]/name/text()' },
            { label: 'Primary owner', query: '/workspace/meta/owners/owner[1]/text()' }
        ]
    };

    execute(language: QueryLanguage, input: string, query: string, resultMode: QueryResultMode): QueryPlaygroundExecution {
        if (!query.trim()) {
            throw new Error('Enter a query before running the playground.');
        }

        return language === 'jsonpath' ? this.executeJsonPath(input, query, resultMode) : this.executeXPath(input, query, resultMode);
    }

    private executeJsonPath(input: string, query: string, resultMode: QueryResultMode): QueryPlaygroundExecution {
        let payload: null | boolean | number | string | object | any[];

        try {
            payload = JSON.parse(input);
        } catch (error) {
            throw new Error(error instanceof Error ? `Invalid JSON input: ${error.message}` : 'Invalid JSON input.');
        }

        let matches: JsonPathMatch[];
        try {
            matches = JSONPath({
                path: query,
                json: payload,
                resultType: 'all',
                wrap: true
            }) as unknown as JsonPathMatch[];
        } catch (error) {
            throw new Error(error instanceof Error ? `JSONPath query failed: ${error.message}` : 'JSONPath query failed.');
        }

        return {
            language: 'jsonpath',
            matchCount: matches.length,
            outputText: this.formatOutput(
                matches.map((match, index) => ({
                    index: index + 1,
                    path: match.path ?? '$',
                    value: match.value
                })),
                resultMode
            ),
            tree: this.buildResultNodes(
                matches.map((match, index) => ({
                    label: `Match ${index + 1}`,
                    path: match.path ?? '$',
                    value: match.value
                }))
            )
        };
    }

    private executeXPath(input: string, query: string, resultMode: QueryResultMode): QueryPlaygroundExecution {
        const parser = this.createDomParser();
        const xmlDocument = parser.parseFromString(input, 'application/xml');
        const parserError = xmlDocument.querySelector('parsererror');

        if (parserError) {
            throw new Error(`Invalid XML input: ${parserError.textContent?.trim() || 'Parser error.'}`);
        }

        const nativeXPathResult = this.getXPathResultCtor();

        let result: XPathResult;
        try {
            result = xmlDocument.evaluate(query, xmlDocument, null, nativeXPathResult.ANY_TYPE, null);
        } catch (error) {
            throw new Error(error instanceof Error ? `XPath query failed: ${error.message}` : 'XPath query failed.');
        }

        const matches = this.readXPathResult(result, nativeXPathResult);

        return {
            language: 'xpath',
            matchCount: matches.length,
            outputText: this.formatOutput(
                matches.map((match, index) => ({
                    index: index + 1,
                    path: match.path,
                    value: match.value
                })),
                resultMode
            ),
            tree: this.buildResultNodes(
                matches.map((match, index) => ({
                    label: `Match ${index + 1}`,
                    path: match.path,
                    value: match.value
                }))
            )
        };
    }

    private formatOutput(entries: QueryOutputEntry[], resultMode: QueryResultMode): string {
        if (resultMode === 'values') {
            return JSON.stringify(
                entries.map((entry) => entry.value),
                null,
                2
            );
        }

        if (resultMode === 'paths') {
            return JSON.stringify(
                entries.map((entry) => entry.path),
                null,
                2
            );
        }

        return JSON.stringify(entries, null, 2);
    }

    private buildResultNodes(matches: Array<{ label: string; path: string; value: unknown }>): TreeNode[] {
        if (!matches.length) {
            return [
                {
                    key: 'no-results',
                    label: 'No matches found'
                }
            ];
        }

        return matches.map((match, index) => ({
            key: `match-${index}`,
            label: `${match.label} - ${match.path}`,
            children: this.valueToTreeNodes(match.value, `match-${index}-value`)
        }));
    }

    private valueToTreeNodes(value: unknown, keyPrefix: string): TreeNode[] {
        if (Array.isArray(value)) {
            if (!value.length) {
                return [{ key: `${keyPrefix}-empty`, label: '[]' }];
            }

            const limited: TreeNode[] = value.slice(0, 50).map((item, index) => ({
                key: `${keyPrefix}-${index}`,
                label: `[${index}]`,
                children: this.valueToTreeNodes(item, `${keyPrefix}-${index}`)
            }));

            if (value.length > 50) {
                limited.push({
                    key: `${keyPrefix}-more`,
                    label: `... ${value.length - 50} more items`
                });
            }

            return limited;
        }

        if (value && typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>);
            if (!entries.length) {
                return [{ key: `${keyPrefix}-empty`, label: '{}' }];
            }

            const limited: TreeNode[] = entries.slice(0, 50).map(([entryKey, entryValue], index) => ({
                key: `${keyPrefix}-${index}`,
                label: entryKey,
                children: this.valueToTreeNodes(entryValue, `${keyPrefix}-${index}`)
            }));

            if (entries.length > 50) {
                limited.push({
                    key: `${keyPrefix}-more`,
                    label: `... ${entries.length - 50} more keys`
                });
            }

            return limited;
        }

        return [
            {
                key: `${keyPrefix}-leaf`,
                label: this.formatPrimitive(value)
            }
        ];
    }

    private readXPathResult(result: XPathResult, nativeXPathResult: typeof XPathResult): XPathMatch[] {
        switch (result.resultType) {
            case nativeXPathResult.STRING_TYPE:
                return [{ path: '(string)', value: result.stringValue }];
            case nativeXPathResult.NUMBER_TYPE:
                return [{ path: '(number)', value: result.numberValue }];
            case nativeXPathResult.BOOLEAN_TYPE:
                return [{ path: '(boolean)', value: result.booleanValue }];
            case nativeXPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            case nativeXPathResult.ORDERED_NODE_ITERATOR_TYPE: {
                const matches: XPathMatch[] = [];
                let node = result.iterateNext();

                while (node) {
                    matches.push({
                        path: this.buildXPath(node),
                        value: this.serializeXPathNode(node)
                    });
                    node = result.iterateNext();
                }

                return matches;
            }
            case nativeXPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
            case nativeXPathResult.ORDERED_NODE_SNAPSHOT_TYPE: {
                const matches: XPathMatch[] = [];

                for (let index = 0; index < result.snapshotLength; index += 1) {
                    const node = result.snapshotItem(index);
                    if (!node) {
                        continue;
                    }

                    matches.push({
                        path: this.buildXPath(node),
                        value: this.serializeXPathNode(node)
                    });
                }

                return matches;
            }
            case nativeXPathResult.ANY_UNORDERED_NODE_TYPE:
            case nativeXPathResult.FIRST_ORDERED_NODE_TYPE:
                if (!result.singleNodeValue) {
                    return [];
                }

                return [
                    {
                        path: this.buildXPath(result.singleNodeValue),
                        value: this.serializeXPathNode(result.singleNodeValue)
                    }
                ];
            default:
                return [];
        }
    }

    private serializeXPathNode(node: Node): unknown {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                return this.serializeElement(node as Element);
            case Node.ATTRIBUTE_NODE:
                return { name: (node as Attr).name, value: (node as Attr).value };
            case Node.TEXT_NODE:
            case Node.CDATA_SECTION_NODE:
                return node.textContent ?? '';
            case Node.COMMENT_NODE:
                return `<!--${node.textContent ?? ''}-->`;
            default:
                return node.textContent ?? '';
        }
    }

    private serializeElement(element: Element): Record<string, unknown> {
        const attributes = Array.from(element.attributes).reduce<Record<string, string>>((acc, attribute) => {
            acc[`@${attribute.name}`] = attribute.value;
            return acc;
        }, {});

        const children = Array.from(element.childNodes).reduce<Record<string, unknown>>((acc, child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const textContent = child.textContent?.trim();
                if (textContent) {
                    acc['#text'] = textContent;
                }
                return acc;
            }

            if (child.nodeType !== Node.ELEMENT_NODE) {
                return acc;
            }

            const childElement = child as Element;
            const serializedChild = this.serializeElement(childElement);
            const existing = acc[childElement.tagName];

            if (existing === undefined) {
                acc[childElement.tagName] = serializedChild;
            } else if (Array.isArray(existing)) {
                existing.push(serializedChild);
            } else {
                acc[childElement.tagName] = [existing, serializedChild];
            }

            return acc;
        }, {});

        return {
            [element.tagName]: {
                ...attributes,
                ...children
            }
        };
    }

    private buildXPath(node: Node): string {
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            const owner = (node as Attr).ownerElement;
            return `${owner ? this.buildXPath(owner) : ''}/@${node.nodeName}`;
        }

        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
            const parent = node.parentNode;
            return `${parent ? this.buildXPath(parent) : ''}/text()`;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return node.nodeName;
        }

        const segments: string[] = [];
        let current: Node | null = node;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            const parent: Node | null = current.parentNode;
            const siblings = parent && parent.nodeType === Node.ELEMENT_NODE ? Array.from(parent.childNodes).filter((candidate: Node) => candidate.nodeType === Node.ELEMENT_NODE && candidate.nodeName === current?.nodeName) : [current];
            const index = siblings.findIndex((candidate) => candidate === current) + 1;
            segments.unshift(`/${current.nodeName}[${index}]`);
            current = parent && parent.nodeType === Node.ELEMENT_NODE ? parent : null;
        }

        return segments.join('') || '/';
    }

    private formatPrimitive(value: unknown): string {
        if (typeof value === 'string') {
            return JSON.stringify(value);
        }

        if (value === null) {
            return 'null';
        }

        return String(value);
    }

    private createDomParser(): DOMParser {
        if (typeof DOMParser === 'undefined') {
            throw new Error('XPath evaluation is only available in browser contexts.');
        }

        return new DOMParser();
    }

    private getXPathResultCtor(): typeof XPathResult {
        if (typeof XPathResult === 'undefined') {
            throw new Error('XPath evaluation is only available in browser contexts.');
        }

        return XPathResult;
    }
}
