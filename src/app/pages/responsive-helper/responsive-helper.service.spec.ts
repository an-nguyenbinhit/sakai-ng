import { ResponsiveHelperService } from './responsive-helper.service';

describe('ResponsiveHelperService', () => {
    let service: ResponsiveHelperService;

    beforeEach(() => {
        service = new ResponsiveHelperService();
    });

    it('resolves the active breakpoint for a viewport width', () => {
        const result = service.analyzeViewport('tailwind', 1024, 768);

        expect(result.activeBreakpoint.label).toBe('lg');
        expect(result.orientation).toBe('landscape');
    });

    it('clamps impossible viewport values into a safe range', () => {
        const result = service.analyzeViewport('bootstrap', 120, 9000);

        expect(result.width).toBe(320);
        expect(result.height).toBe(2160);
    });

    it('generates CSS, SCSS, and Tailwind snippets from a preset', () => {
        const snippets = service.generateSnippets('material', '.layout-shell');

        expect(snippets.css).toContain('@media (min-width: 600px)');
        expect(snippets.scss).toContain('$breakpoints:');
        expect(snippets.tailwind).toContain('grid-cols-1');
    });
});
