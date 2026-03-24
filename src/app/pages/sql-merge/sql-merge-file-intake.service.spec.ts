import { SqlMergeFileIntakeService } from './sql-merge-file-intake.service';
import { SqlMergeOptions } from './sql-merge.models';
import { SQL_MERGE_DEFAULT_HEADER_TEMPLATE } from './sql-merge.samples';

describe('SqlMergeFileIntakeService', () => {
    let service: SqlMergeFileIntakeService;
    let options: SqlMergeOptions;

    beforeEach(() => {
        service = new SqlMergeFileIntakeService();
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

    it('skips duplicate fingerprints when policy is skip', async () => {
        const file = new File(['SELECT 1;'], 'a.sql', { lastModified: 1 });
        const result = await service.intake([file, file], [], options);

        expect(result.accepted.length).toBe(1);
        expect(result.skippedDuplicates).toBe(1);
    });

    it('allows duplicate fingerprints when policy is keep-both', async () => {
        const file = new File(['SELECT 1;'], 'a.sql', { lastModified: 1 });
        const result = await service.intake([file, file], [], { ...options, duplicatePolicy: 'keep-both' });

        expect(result.accepted.length).toBe(2);
    });

    it('warns on non-standard extension when allow policy is enabled', async () => {
        const file = new File(["UPDATE dbo.Users SET Name = N'Binh';"], 'notes.md');
        const result = await service.intake([file], [], options);

        expect(result.accepted[0].status).toBe('warning');
        expect(result.accepted[0].issues[0]).toContain('Non-standard extension');
    });

    it('blocks non-standard extension when block policy is enabled', async () => {
        const file = new File(["UPDATE dbo.Users SET Name = N'Binh';"], 'notes.md');
        const result = await service.intake([file], [], { ...options, nonSqlPolicy: 'block' });

        expect(result.accepted.length).toBe(0);
        expect(result.rejected[0].reason).toContain('Unsupported extension');
    });

    it('flags empty files as warnings', async () => {
        const file = new File([''], 'empty.sql');
        const result = await service.intake([file], [], options);

        expect(result.accepted[0].issues).toContain('File is empty.');
    });

    it('rejects binary-like content', async () => {
        const file = new File(['\0png'], 'image.png');
        const result = await service.intake([file], [], options);

        expect(result.accepted.length).toBe(0);
        expect(result.rejected[0].reason).toContain('Binary-like');
    });

    it('strips utf-8 bom from accepted text', async () => {
        const file = new File(['\uFEFFSELECT 1;'], 'bom.sql');
        const result = await service.intake([file], [], options);

        expect(result.accepted[0].content).toBe('SELECT 1;');
    });
});
