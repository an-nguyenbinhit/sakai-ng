import { MessageService } from 'primeng/api';
import { SqlMerge } from './sql-merge';
import { SqlMergeEngineService } from './sql-merge-engine.service';
import { SqlMergeExportService } from './sql-merge-export.service';
import { SqlMergeFileIntakeService } from './sql-merge-file-intake.service';

describe('SqlMerge', () => {
    let component: SqlMerge;
    let messageService: jasmine.SpyObj<MessageService>;
    let exportService: jasmine.SpyObj<SqlMergeExportService>;
    const layoutService = { isDarkTheme: () => false } as any;

    beforeEach(() => {
        messageService = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
        exportService = jasmine.createSpyObj<SqlMergeExportService>('SqlMergeExportService', ['exportSql', 'exportManifest']);
        exportService.exportSql.and.returnValue(true);
        exportService.exportManifest.and.returnValue(true);

        component = new SqlMerge(new SqlMergeFileIntakeService(), new SqlMergeEngineService(), exportService, messageService, layoutService);
    });

    it('adds files from direct input', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);

        expect(component.items().length).toBe(1);
        expect(component.mergeResult().content).toContain('a.sql');
    });

    it('adds files from drag and drop', async () => {
        const file = new File(['SELECT 1;'], 'drag.sql');
        const dt = new DataTransfer();
        dt.items.add(file);
        const event = new DragEvent('drop', { dataTransfer: dt });

        await component.onDrop(event);

        expect(component.items().length).toBe(1);
        expect(component.isDragging()).toBeFalse();
    });

    it('removes selected items', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql'), new File(['SELECT 2;'], 'b.sql')]);
        component.toggleSelection(component.items()[0].id, true);

        component.removeSelected();

        expect(component.items().length).toBe(1);
        expect(component.items()[0].name).toBe('b.sql');
    });

    it('clears all items and resets duplicate counter', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);
        component.skippedDuplicates.set(2);

        component.clearAll();

        expect(component.items().length).toBe(0);
        expect(component.skippedDuplicates()).toBe(0);
    });

    it('reorders selected items upward and updates preview order', async () => {
        await component.addFiles([new File(['SELECT 1;'], '001.sql'), new File(['SELECT 2;'], '002.sql')]);
        component.toggleSelection(component.items()[1].id, true);

        component.moveSelected('top');

        expect(component.items()[0].name).toBe('002.sql');
        expect(component.mergeResult().content.indexOf('002.sql')).toBeLessThan(component.mergeResult().content.indexOf('001.sql'));
    });

    it('downloads merged sql through export service', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);

        component.downloadSql();

        expect(exportService.exportSql).toHaveBeenCalled();
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Downloaded' }));
    });

    it('keeps actions disabled while processing', async () => {
        component.isProcessing.set(true);

        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);

        expect(component.items().length).toBe(0);
    });

    it('stays SSR-safe when download is unavailable', async () => {
        exportService.exportSql.and.returnValue(false);
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);

        component.downloadSql();

        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Unavailable' }));
    });

    it('downloads edited preview content instead of the generated baseline', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);

        component.onPreviewTextChange('SELECT 99;');
        component.downloadSql();

        expect(exportService.exportSql).toHaveBeenCalledWith('merged-output.sql', 'SELECT 99;');
    });

    it('resets edited preview back to generated content', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);
        const generated = component.previewText();

        component.onPreviewTextChange('SELECT 99;');
        component.resetPreviewToGenerated();

        expect(component.previewText()).toBe(generated);
        expect(component.isPreviewEditing()).toBeFalse();
    });

    it('copies the current preview content', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);
        component.onPreviewTextChange('SELECT 99;');
        const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
        Object.defineProperty(globalThis.navigator, 'clipboard', {
            configurable: true,
            value: { writeText }
        });

        await component.copyPreview();

        expect(writeText).toHaveBeenCalledWith('SELECT 99;');
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Copied' }));
    });

    it('shows diagnostics only when there is something actionable or noteworthy', async () => {
        await component.addFiles([new File(['SELECT 1;'], 'a.sql')]);
        expect(component.hasDiagnostics()).toBeFalse();
        expect(component.previewBlocks().length).toBe(1);

        component.onPreviewTextChange('SELECT 99;');
        expect(component.hasDiagnostics()).toBeTrue();
        expect(component.previewBlocks().length).toBe(0);
        expect(component.diagnostics().some((item) => item.text.includes('manual edits'))).toBeTrue();
    });
});
