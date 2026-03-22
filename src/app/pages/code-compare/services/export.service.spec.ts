import { ExportService } from './export.service';

describe('ExportService', () => {
    let service: ExportService;
    let anchorMock: { href: string; download: string; style: { display: string }; click: jasmine.Spy };

    beforeEach(() => {
        service = new ExportService();
        anchorMock = {
            href: '',
            download: '',
            style: { display: '' },
            click: jasmine.createSpy('click')
        };

        spyOn(document, 'createElement').and.returnValue(anchorMock as any);
        spyOn(document.body, 'appendChild');
        spyOn(document.body, 'removeChild');
        spyOn(window.URL, 'createObjectURL').and.returnValue('blob:diff');
        spyOn(window.URL, 'revokeObjectURL');
    });

    it('exports unified diff as a .diff file', () => {
        service.exportUnifiedDiff(
            { name: 'left.ts', content: 'const a = 1;\n', encoding: 'UTF-8', language: 'ts', size: 1 },
            { name: 'right.ts', content: 'const a = 2;\n', encoding: 'UTF-8', language: 'ts', size: 1 },
            {
                ignoreWhitespace: true,
                ignoreCase: false,
                ignoreBlankLines: false,
                ignoreComments: false,
                trimLines: false,
                wordDiff: true,
                charDiff: false,
                contextLines: 3
            }
        );

        expect(anchorMock.download).toMatch(/\.diff$/);
        expect(anchorMock.click).toHaveBeenCalled();
        expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
});
