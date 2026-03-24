import { MessageService } from 'primeng/api';
import { ContainerCheck } from './container-check';
import { ContainerCheckService } from './container-check.service';

describe('ContainerCheck', () => {
    let component: ContainerCheck;
    let messageService: jasmine.SpyObj<MessageService>;

    beforeEach(() => {
        messageService = jasmine.createSpyObj<MessageService>('MessageService', ['add']);

        component = new ContainerCheck(
            new ContainerCheckService(),
            { copyText: jasmine.createSpy('copyText').and.resolveTo(true) } as any,
            { downloadText: jasmine.createSpy('downloadText').and.returnValue(true) } as any,
            messageService
        );
    });

    it('loads a valid sample by default', () => {
        expect(component.singleResult().isValid).toBeTrue();
        expect(component.singleResult().normalizedInput).toBe('CSQU3054383');
    });

    it('updates validation state when input changes to an invalid sample', () => {
        component.singleInput.set('CSQU3054381');

        component.runSingleValidation();

        expect(component.singleResult().isValid).toBeFalse();
        expect(component.singleResult().issues.some((issue) => issue.code === 'check-digit-mismatch')).toBeTrue();
    });

    it('loads sample metadata and refreshes the validation result', () => {
        const sample = component.samples.find((item) => item.label === 'OCR confusion');
        expect(sample).toBeDefined();

        component.loadSample(sample!);

        expect(component.activeSampleLabel()).toBe('OCR confusion');
        expect(component.singleResult().issues.some((issue) => issue.code === 'serial-ocr-hint')).toBeTrue();
    });

    it('recomputes batch summary counts from textarea input', () => {
        component.batchInput.set('CSQU3054383\nCSQU3054381');

        component.runBatchValidation();

        expect(component.batchResult().validCount).toBe(1);
        expect(component.batchResult().invalidCount).toBe(1);
    });

    it('generates a mixed random batch directly into the batch workspace', () => {
        component.randomCount.set(6);

        component.generateBatch('mixed');

        expect(component.batchResult().total).toBe(6);
        expect(component.batchResult().validCount).toBeGreaterThan(0);
        expect(component.batchResult().invalidCount).toBeGreaterThan(0);
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Generated' }));
    });
});
