import { UrlToolsService } from './url-tools.service';

describe('UrlToolsService', () => {
    let service: UrlToolsService;

    beforeEach(() => {
        service = new UrlToolsService();
    });

    it('parses query parameters from a URL', () => {
        const result = service.parseUrl('https://example.com/docs?q=angular&lang=en#top');
        expect(result.params).toEqual([
            { key: 'q', value: 'angular' },
            { key: 'lang', value: 'en' }
        ]);
        expect(result.hash).toBe('top');
    });

    it('builds a URL from edited fields', () => {
        const result = service.buildUrl({
            origin: 'https://example.com',
            pathname: '/tools',
            hash: 'preview',
            params: [{ key: 'tab', value: 'url' }]
        });
        expect(result).toContain('/tools?tab=url#preview');
    });

    it('decodes JSON-string encoded text', () => {
        expect(service.decode('"hello"', 'json')).toBe('hello');
    });
});
