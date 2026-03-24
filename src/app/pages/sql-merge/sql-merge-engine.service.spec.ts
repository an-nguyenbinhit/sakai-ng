import { SqlMergeEngineService } from './sql-merge-engine.service';
import { SqlMergeFileItem, SqlMergeOptions } from './sql-merge.models';
import { SQL_MERGE_DEFAULT_HEADER_TEMPLATE } from './sql-merge.samples';

describe('SqlMergeEngineService', () => {
    let service: SqlMergeEngineService;
    let options: SqlMergeOptions;

    const makeItem = (name: string, content: string, size = content.length): SqlMergeFileItem => ({
        id: name,
        file: new File([content], name),
        name,
        size,
        lastModified: Date.UTC(2026, 0, 1, 0, 0, 0),
        fingerprint: `${name}-${size}`,
        content,
        status: 'ready',
        issues: [],
        selected: false
    });

    beforeEach(() => {
        service = new SqlMergeEngineService();
        options = {
            includeHeaders: true,
            includeFileStats: true,
            separatorLines: 2,
            trimTrailingWhitespace: false,
            ensureTrailingNewline: true,
            includeGoSeparator: 'preserve',
            headerTemplate: SQL_MERGE_DEFAULT_HEADER_TEMPLATE,
            outputFileName: 'merged-output.sql',
            duplicatePolicy: 'skip',
            nonSqlPolicy: 'warn-and-allow'
        };
    });

    it('merges files in current order', () => {
        const result = service.merge([makeItem('001.sql', 'SELECT 1;'), makeItem('002.sql', 'SELECT 2;')], options);

        expect(result.content.indexOf('001.sql')).toBeLessThan(result.content.indexOf('002.sql'));
        expect(result.content.indexOf('SELECT 1;')).toBeLessThan(result.content.indexOf('SELECT 2;'));
    });

    it('renders header placeholders', () => {
        const result = service.merge([makeItem('demo.sql', 'SELECT 1;')], options);

        expect(result.content).toContain('File 1: demo.sql');
        expect(result.content).toContain('Size: 9 bytes');
        expect(result.content).toContain('Modified: 2026-01-01T00:00:00.000Z');
    });

    it('uses configured separator line count', () => {
        const result = service.merge([makeItem('a.sql', 'SELECT 1;'), makeItem('b.sql', 'SELECT 2;')], { ...options, separatorLines: 3 });

        expect(result.content).toContain('SELECT 1;\n\n\n-- =============================================');
    });

    it('forces GO between files when requested', () => {
        const result = service.merge([makeItem('a.sql', 'SELECT 1;'), makeItem('b.sql', 'SELECT 2;')], { ...options, includeGoSeparator: 'force-between-files' });

        expect(result.content).toContain('SELECT 1;\nGO\n\n-- =============================================');
        expect(result.forcedGoCount).toBe(2);
    });

    it('strips standalone GO lines when policy is off', () => {
        const result = service.merge([makeItem('a.sql', 'SELECT 1;\nGO\nSELECT 2;')], { ...options, includeGoSeparator: 'off' });

        expect(result.content).not.toContain('\nGO\n');
    });

    it('trims trailing whitespace when enabled', () => {
        const result = service.merge([makeItem('a.sql', 'SELECT 1;    \nSELECT 2; \t')], { ...options, trimTrailingWhitespace: true });

        expect(result.content).toContain('SELECT 1;\nSELECT 2;');
        expect(result.content).not.toContain('SELECT 1;    ');
    });

    it('normalizes CRLF endings and ensures trailing newline', () => {
        const result = service.merge([makeItem('a.sql', 'SELECT 1;\r\nSELECT 2;')], options);

        expect(result.content).toContain('SELECT 1;\nSELECT 2;');
        expect(result.content.endsWith('\n')).toBeTrue();
    });
});
