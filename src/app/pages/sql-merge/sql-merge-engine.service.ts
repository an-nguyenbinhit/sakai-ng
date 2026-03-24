import { Injectable } from '@angular/core';
import { SqlMergeFileItem, SqlMergeOptions, SqlMergeResult } from './sql-merge.models';

@Injectable({ providedIn: 'root' })
export class SqlMergeEngineService {
    merge(items: SqlMergeFileItem[], options: SqlMergeOptions, skippedDuplicates = 0): SqlMergeResult {
        const warnings = items.flatMap((item) => item.issues.map((issue) => `${item.name}: ${issue}`));
        let forcedGoCount = 0;
        const blocks = items.map((item, index) => {
            const block = this.buildFileBlock(item, index, options);
            if (options.includeGoSeparator === 'force-between-files' && this.shouldAppendGo(item.content, options)) {
                forcedGoCount += 1;
            }
            return block;
        });
        const separator = '\n'.repeat(Math.max(1, options.separatorLines));
        const mergedContent = blocks.join(separator);
        const content = options.ensureTrailingNewline ? this.ensureTrailingNewline(mergedContent) : mergedContent;

        return {
            content,
            totalFiles: items.length,
            mergedBytes: new Blob([content]).size,
            skippedDuplicates,
            forcedGoCount,
            warnings,
            manifest: items.map((item, index) => ({
                name: item.name,
                size: item.size,
                order: index + 1,
                fingerprint: item.fingerprint
            }))
        };
    }

    private buildFileBlock(item: SqlMergeFileItem, index: number, options: SqlMergeOptions): string {
        const content = this.prepareContent(item.content, options);
        const parts: string[] = [];

        if (options.includeHeaders) {
            parts.push(this.renderHeader(item, index, options));
        }

        parts.push(content);

        if (options.includeGoSeparator === 'force-between-files' && this.shouldAppendGo(item.content, options)) {
            parts.push('GO');
        }

        return parts.filter((part) => part.length > 0).join('\n');
    }

    private prepareContent(content: string, options: SqlMergeOptions): string {
        let next = content.replace(/\r\n?/g, '\n');

        if (options.includeGoSeparator === 'off') {
            next = next.replace(/^\s*GO\s*$/gim, '').replace(/\n{3,}/g, '\n\n');
        }

        if (options.trimTrailingWhitespace) {
            next = next.replace(/[ \t]+$/gm, '');
        }

        return next.trimEnd();
    }

    private shouldAppendGo(content: string, options: SqlMergeOptions): boolean {
        const prepared = this.prepareContent(content, options);
        const trimmed = prepared.trimEnd();
        return Boolean(trimmed && !/\nGO\s*$/i.test(trimmed));
    }

    private renderHeader(item: SqlMergeFileItem, index: number, options: SqlMergeOptions): string {
        const modified = item.lastModified ? new Date(item.lastModified).toISOString() : 'n/a';
        const values: Record<string, string> = {
            index: String(index + 1),
            fileName: item.name,
            sizeBytes: options.includeFileStats ? String(item.size) : '-',
            lastModifiedIso: options.includeFileStats ? modified : '-'
        };

        return options.headerTemplate.replace(/\{\{\s*(index|fileName|sizeBytes|lastModifiedIso)\s*\}\}/g, (_, token: keyof typeof values) => values[token] ?? '');
    }

    private ensureTrailingNewline(content: string): string {
        if (!content) {
            return '\n';
        }

        return content.endsWith('\n') ? content : `${content}\n`;
    }
}
