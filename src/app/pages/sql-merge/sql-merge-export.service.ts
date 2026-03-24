import { Injectable } from '@angular/core';
import { TextFileService } from '@/app/shared/services/text-file.service';
import { SqlMergeResult } from './sql-merge.models';

@Injectable({ providedIn: 'root' })
export class SqlMergeExportService {
    constructor(private textFileService: TextFileService) {}

    exportSql(filename: string, content: string): boolean {
        return this.textFileService.downloadText(filename, content, 'text/sql;charset=utf-8');
    }

    exportManifest(filename: string, result: SqlMergeResult): boolean {
        const payload = JSON.stringify(
            {
                totalFiles: result.totalFiles,
                mergedBytes: result.mergedBytes,
                skippedDuplicates: result.skippedDuplicates,
                warnings: result.warnings,
                manifest: result.manifest
            },
            null,
            2
        );

        return this.textFileService.downloadText(filename, payload, 'application/json;charset=utf-8');
    }
}
