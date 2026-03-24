import { ContainerCheckService } from './container-check.service';

describe('ContainerCheckService', () => {
    let service: ContainerCheckService;

    beforeEach(() => {
        service = new ContainerCheckService();
    });

    it('normalizes lowercase input with separators', () => {
        expect(service.normalize('csqu-305438-3')).toBe('CSQU3054383');
    });

    it('calculates the expected ISO 6346 check digit for a valid base code', () => {
        expect(service.calculateCheckDigit('CSQU305438')).toBe(3);
    });

    it('maps remainder 10 to check digit 0', () => {
        expect(service.calculateCheckDigit('MSCU000006')).toBe(0);
    });

    it('validates a correct full container number', () => {
        const result = service.validate('CSQU3054383');

        expect(result.isValid).toBeTrue();
        expect(result.expectedCheckDigit).toBe(3);
        expect(result.issues.some((issue) => issue.severity === 'error')).toBeFalse();
    });

    it('flags mismatched check digits', () => {
        const result = service.validate('CSQU3054381');

        expect(result.isValid).toBeFalse();
        expect(result.issues.some((issue) => issue.code === 'check-digit-mismatch')).toBeTrue();
    });

    it('rejects malformed values and surfaces OCR hints', () => {
        const result = service.validate('MSCU66O9878');

        expect(result.isValid).toBeFalse();
        expect(result.issues.some((issue) => issue.code === 'invalid-serial-number')).toBeTrue();
        expect(result.issues.some((issue) => issue.code === 'serial-ocr-hint')).toBeTrue();
    });

    it('warns when category is structurally valid but non-standard freight equipment', () => {
        const result = service.validate('MSCJ1234569');

        expect(result.isValid).toBeTrue();
        expect(result.issues.some((issue) => issue.code === 'non-standard-freight-category')).toBeTrue();
    });

    it('validates batch input while skipping blank lines', () => {
        const result = service.validateBatch('CSQU3054383\n\nCSQU3054381\n');

        expect(result.total).toBe(2);
        expect(result.validCount).toBe(1);
        expect(result.invalidCount).toBe(1);
        expect(result.rows[0].normalized).toBe('CSQU3054383');
        expect(result.rows[1].summary).toContain('Check digit mismatch');
    });

    it('generates the requested number of valid random container numbers', () => {
        const rows = service.generateRandomList(5, 'valid');

        expect(rows.length).toBe(5);
        expect(rows.every((row) => service.validate(row).isValid)).toBeTrue();
    });

    it('generates invalid random container numbers for QC scenarios', () => {
        const rows = service.generateRandomList(8, 'invalid');

        expect(rows.length).toBe(8);
        expect(rows.every((row) => !service.validate(row).isValid)).toBeTrue();
    });
});
