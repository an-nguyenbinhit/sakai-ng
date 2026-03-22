import { MessageService } from 'primeng/api';
import { RegexTester } from './regex-tester';

describe('RegexTester', () => {
    let component: RegexTester;

    beforeEach(() => {
        const messageService = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
        const sanitizer = {
            bypassSecurityTrustHtml: (value: string) => value
        };
        component = new RegexTester(messageService, sanitizer as any);
    });

    it('captures regex groups for each match', () => {
        component.pattern.set('(foo)-(bar)');
        component.testString.set('foo-bar');

        component.evaluateRegex();

        expect(component.matches().length).toBe(1);
        expect(component.matches()[0].captureGroups.length).toBe(2);
        expect(component.matches()[0].captureGroups[0].value).toBe('foo');
        expect(component.matches()[0].captureGroups[1].value).toBe('bar');
    });

    it('builds replacement preview from pattern, text, and replacement string', () => {
        component.pattern.set('(foo)-(bar)');
        component.testString.set('foo-bar');
        component.replacementString.set('$2-$1');

        component.evaluateRegex();

        expect(component.replacementPreview()).toBe('bar-foo');
    });

    it('supports named groups when available', () => {
        component.pattern.set('(?<first>foo)-(?<second>bar)');
        component.testString.set('foo-bar');

        component.evaluateRegex();

        expect(component.matches()[0].namedGroups['first']).toBe('foo');
        expect(component.matches()[0].namedGroups['second']).toBe('bar');
    });
});
