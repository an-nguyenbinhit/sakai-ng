import { ColorToolsService } from './color-tools.service';

describe('ColorToolsService', () => {
    let service: ColorToolsService;

    beforeEach(() => {
        service = new ColorToolsService();
    });

    it('normalizes short HEX values', () => {
        expect(service.normalizeHex('#0fA')).toBe('#00ffaa');
    });

    it('inspects colors into multiple color spaces', () => {
        const result = service.inspectColor('#3b82f6');

        expect(result.rgbString).toBe('rgb(59 130 246)');
        expect(result.hslString).toBe('hsl(217 91% 60%)');
        expect(result.oklchString.startsWith('oklch(')).toBeTrue();
    });

    it('calculates WCAG contrast ratios', () => {
        expect(service.getContrastRatio('#000000', '#ffffff').ratio).toBe(21);
    });

    it('builds gradient CSS with evenly spaced stops', () => {
        const result = service.buildLinearGradient('#000000', '#ffffff', 90, 3);

        expect(result.css).toBe('linear-gradient(90deg, #000000 0%, #808080 50%, #ffffff 100%)');
        expect(result.stops.length).toBe(3);
    });
});
