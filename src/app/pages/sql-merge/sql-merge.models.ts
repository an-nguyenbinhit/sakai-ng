export type SqlMergeFileStatus = 'ready' | 'warning' | 'error';
export type SqlGoSeparatorPolicy = 'preserve' | 'force-between-files' | 'off';
export type SqlDuplicatePolicy = 'skip' | 'keep-both';
export type SqlNonSqlPolicy = 'warn-and-allow' | 'block';

export interface SqlMergeFileItem {
    id: string;
    file: File;
    name: string;
    size: number;
    lastModified: number;
    fingerprint: string;
    content: string;
    status: SqlMergeFileStatus;
    issues: string[];
    selected: boolean;
}

export interface SqlMergeOptions {
    includeHeaders: boolean;
    includeFileStats: boolean;
    separatorLines: number;
    trimTrailingWhitespace: boolean;
    ensureTrailingNewline: boolean;
    includeGoSeparator: SqlGoSeparatorPolicy;
    headerTemplate: string;
    outputFileName: string;
    duplicatePolicy: SqlDuplicatePolicy;
    nonSqlPolicy: SqlNonSqlPolicy;
}

export interface SqlMergeManifestItem {
    name: string;
    size: number;
    order: number;
    fingerprint: string;
}

export interface SqlMergeBlockMarker {
    name: string;
    order: number;
    startLine: number;
    endLine: number;
    toneIndex: number;
}

export interface SqlMergeResult {
    content: string;
    totalFiles: number;
    mergedBytes: number;
    skippedDuplicates: number;
    forcedGoCount: number;
    warnings: string[];
    blocks: SqlMergeBlockMarker[];
    manifest: SqlMergeManifestItem[];
}

export interface SqlMergeIntakeResult {
    accepted: SqlMergeFileItem[];
    rejected: Array<{ name: string; reason: string }>;
    skippedDuplicates: number;
}

export interface SqlMergeSampleDefinition {
    label: string;
    description: string;
    files: Array<{
        name: string;
        content: string;
        type?: string;
        lastModified?: number;
    }>;
}
