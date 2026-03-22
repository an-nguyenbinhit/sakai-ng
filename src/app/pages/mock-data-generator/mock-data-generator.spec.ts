import { MessageService } from 'primeng/api';
import { MockDataGeneratorService } from './mock-data-generator.service';
import { MockDataGenerator } from './mock-data-generator';

describe('MockDataGenerator', () => {
    let component: MockDataGenerator;
    let messageService: jasmine.SpyObj<MessageService>;

    beforeEach(() => {
        messageService = jasmine.createSpyObj<MessageService>('MessageService', ['add']);

        component = new MockDataGenerator(
            new MockDataGeneratorService(),
            { copyText: jasmine.createSpy('copyText').and.resolveTo(true) } as any,
            { downloadText: jasmine.createSpy('downloadText').and.returnValue(true) } as any,
            messageService
        );
    });

    it('clears the full workspace back to defaults', () => {
        component.addDataset();
        component.addField('scalar');
        component.onSeedChange('custom-seed');
        component.onIndentChange(4);
        component.generate();

        component.clearAll();

        expect(component.seed()).toBe('devworkspace-seed');
        expect(component.indent()).toBe(2);
        expect(component.selectedScenario()).toBe('balanced');
        expect(component.autoPreview()).toBeTrue();
        expect(component.datasets()).toEqual([]);
        expect(component.fields()).toEqual([]);
        expect(component.activeDatasetId()).toBeNull();
        expect(component.outputText()).toBe('');
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Cleared' }));
    });

    it('clears all datasets and schema together', () => {
        component.addDataset();
        component.addField('scalar');
        component.generate();

        component.clearDatasets();

        expect(component.datasets()).toEqual([]);
        expect(component.fields()).toEqual([]);
        expect(component.activeDatasetId()).toBeNull();
        expect(component.outputText()).toBe('');
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Datasets Cleared' }));
    });

    it('clears only the active dataset schema', () => {
        component.clearAll();
        component.addDataset();
        const firstDatasetId = component.activeDatasetId();
        component.addField('scalar');
        component.addDataset();
        component.addField('scalar');
        component.activeDatasetId.set(firstDatasetId);

        component.clearActiveDatasetFields();

        expect(component.fields().filter((field) => field.datasetId === firstDatasetId)).toEqual([]);
        expect(component.fields().some((field) => field.datasetId !== firstDatasetId)).toBeTrue();
        expect(component.outputText()).toBe('');
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Schema Cleared' }));
    });

    it('clears preview without touching configured schema', () => {
        component.generate();
        const datasetCount = component.datasets().length;
        const fieldCount = component.fields().length;

        component.clearPreview();

        expect(component.outputText()).toBe('');
        expect(component.datasets().length).toBe(datasetCount);
        expect(component.fields().length).toBe(fieldCount);
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Preview Cleared' }));
    });
});
