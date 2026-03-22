import { TextUtilsService } from './text-utils.service';

describe('TextUtilsService', () => {
    let service: TextUtilsService;

    beforeEach(() => {
        service = new TextUtilsService();
    });

    it('dedupes repeated lines while preserving order', () => {
        expect(service.dedupeLines('a\na\nb\nb')).toBe('a\nb');
    });

    it('slugifies accented text', () => {
        expect(service.slugify('Xin Chao The Gioi!')).toBe('xin-chao-the-gioi');
    });

    it('sorts lines descending', () => {
        expect(service.sortLines('b\na\nc', 'desc')).toBe('c\nb\na');
    });
});
