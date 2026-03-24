import { Injectable } from '@angular/core';
import { SqlMergeFileItem, SqlMergeIntakeResult, SqlMergeOptions } from './sql-merge.models';

const SQL_EXTENSIONS = new Set(['.sql', '.txt', '.ddl', '.dml', '.prc', '.fn', '.view']);

@Injectable({ providedIn: 'root' })
export class SqlMergeFileIntakeService {
    async intake(files: File[], existingItems: SqlMergeFileItem[], options: SqlMergeOptions): Promise<SqlMergeIntakeResult> {
        const existingFingerprints = new Set(existingItems.map((item) => item.fingerprint));
        const accepted: SqlMergeFileItem[] = [];
        const rejected: Array<{ name: string; reason: string }> = [];
        let skippedDuplicates = 0;

        for (const file of files) {
            const fingerprint = this.buildFingerprint(file);

            if (options.duplicatePolicy === 'skip' && (existingFingerprints.has(fingerprint) || accepted.some((item) => item.fingerprint === fingerprint))) {
                skippedDuplicates += 1;
                continue;
            }

            const content = await file.text();
            const extension = this.getExtension(file.name);
            const issues: string[] = [];
            let status: SqlMergeFileItem['status'] = 'ready';

            if (content.includes('\0')) {
                rejected.push({ name: file.name, reason: 'Binary-like content detected. Only text files are supported.' });
                continue;
            }

            if (!SQL_EXTENSIONS.has(extension)) {
                if (options.nonSqlPolicy === 'block') {
                    rejected.push({ name: file.name, reason: `Unsupported extension ${extension || '(none)'}.` });
                    continue;
                }

                status = 'warning';
                issues.push(`Non-standard extension ${extension || '(none)'}.`);
            }

            const normalizedContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
            if (!normalizedContent.trim()) {
                status = 'warning';
                issues.push('File is empty.');
            }

            accepted.push({
                id: `${fingerprint}::${existingItems.length + accepted.length}`,
                file,
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                fingerprint,
                content: normalizedContent,
                status,
                issues,
                selected: false
            });
        }

        return {
            accepted,
            rejected,
            skippedDuplicates
        };
    }

    buildFingerprint(file: File): string {
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? '';
        return [file.name, file.size, file.lastModified, relativePath].join('::');
    }

    private getExtension(fileName: string): string {
        const dotIndex = fileName.lastIndexOf('.');
        return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
    }
}
