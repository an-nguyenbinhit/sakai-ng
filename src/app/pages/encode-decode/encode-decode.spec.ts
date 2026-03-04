/**
 * Unit tests for EncodeDecode component.
 *
 * Approach:
 *  - TestBed.runInInjectionContext() to instantiate without a full DOM+PrimeNG setup.
 *  - navigator.clipboard polyfilled once via beforeAll for copyToClipboard tests.
 *  - document.createElement('textarea') mocked for decodeHTML() tests.
 *  - done() callbacks for all Promise-based tests (copyToClipboard).
 */
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { EncodeDecode } from './encode-decode';

// ─────────────────────────────────────────────────────────────────────────────
// Clipboard polyfill — installed once globally, spy is reset per test.
// ─────────────────────────────────────────────────────────────────────────────
const mockClipboard = {
    writeText: (_text: string): Promise<void> => Promise.resolve()
};

beforeAll(() => {
    try {
        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            configurable: true,
            writable: true
        });
    } catch (_) {
        (navigator as any).clipboard = mockClipboard;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Factory helper
// ─────────────────────────────────────────────────────────────────────────────
function build() {
    const msgSvc = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    TestBed.configureTestingModule({});
    const comp = TestBed.runInInjectionContext(() => new EncodeDecode(msgSvc));
    return { comp, msgSvc };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('EncodeDecode', () => {
    let component: EncodeDecode;
    let mockMessageService: jasmine.SpyObj<MessageService>;

    beforeEach(() => {
        const ctx = build();
        component = ctx.comp;
        mockMessageService = ctx.msgSvc as any;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Initialisation
    // ─────────────────────────────────────────────────────────────────────────
    describe('Initialisation', () => {
        it('should have empty inputString', () => expect(component.inputString()).toBe(''));
        it('should have empty outputString', () => expect(component.outputString()).toBe(''));
        it('should default to Base64 operation', () => expect(component.operation()).toBe('Base64'));
        it('should expose 3 operations', () => expect(component.operations.length).toBe(3));
        it('should expose Base64 operation', () => {
            expect(component.operations.find((op) => op.value === 'Base64')).toBeTruthy();
        });
        it('should expose URL operation', () => {
            expect(component.operations.find((op) => op.value === 'URL')).toBeTruthy();
        });
        it('should expose HTML operation', () => {
            expect(component.operations.find((op) => op.value === 'HTML')).toBeTruthy();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. encode() — guard
    // ─────────────────────────────────────────────────────────────────────────
    describe('encode() — empty input guard', () => {
        it('does nothing when inputString is empty', () => {
            component.inputString.set('');
            component.operation.set('Base64');
            component.encode();
            expect(component.outputString()).toBe('');
            expect(mockMessageService.add).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. encode() — Base64
    // ─────────────────────────────────────────────────────────────────────────
    describe('encode() — Base64', () => {
        beforeEach(() => {
            component.operation.set('Base64');
        });

        it('encodes simple ASCII string', () => {
            component.inputString.set('Hello');
            component.encode();
            expect(component.outputString()).toBe(btoa('Hello'));
        });

        it('encodes string with spaces', () => {
            component.inputString.set('Hello World');
            component.encode();
            expect(component.outputString()).toBe(btoa(unescape(encodeURIComponent('Hello World'))));
        });

        it('encodes UTF-8 string', () => {
            component.inputString.set('xin chào');
            component.encode();
            expect(component.outputString()).toBe(btoa(unescape(encodeURIComponent('xin chào'))));
        });

        it('encodes numbers and symbols', () => {
            component.inputString.set('123!@#');
            component.encode();
            expect(component.outputString()).toBe(btoa('123!@#'));
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. encode() — URL
    // ─────────────────────────────────────────────────────────────────────────
    describe('encode() — URL', () => {
        beforeEach(() => {
            component.operation.set('URL');
        });

        it('encodes spaces as %20', () => {
            component.inputString.set('hello world');
            component.encode();
            expect(component.outputString()).toBe('hello%20world');
        });

        it('encodes special characters', () => {
            component.inputString.set('a=1&b=2');
            component.encode();
            expect(component.outputString()).toBe(encodeURIComponent('a=1&b=2'));
        });

        it('encodes Vietnamese characters', () => {
            component.inputString.set('Hà Nội');
            component.encode();
            expect(component.outputString()).toBe(encodeURIComponent('Hà Nội'));
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. encode() — HTML
    // ─────────────────────────────────────────────────────────────────────────
    describe('encode() — HTML', () => {
        beforeEach(() => {
            component.operation.set('HTML');
        });

        it('encodes <, >, & and " to HTML entities', () => {
            component.inputString.set('<div>&"test"</div>');
            component.encode();
            // All special chars are replaced with &#nn; numeric entities.
            // Raw angle brackets and quotes must not appear literally.
            expect(component.outputString()).not.toContain('<');
            expect(component.outputString()).not.toContain('>');
            expect(component.outputString()).not.toContain('"');
            // The encoded & itself becomes &#38; so the output contains &#
            expect(component.outputString()).toContain('&#');
        });

        it('produces numeric entity references', () => {
            component.inputString.set('<');
            component.encode();
            expect(component.outputString()).toBe('&#60;');
        });

        it('keeps plain alphanumeric unchanged when no special chars', () => {
            component.inputString.set('hello123');
            component.encode();
            expect(component.outputString()).toBe('hello123');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. decode() — guard
    // ─────────────────────────────────────────────────────────────────────────
    describe('decode() — empty input guard', () => {
        it('does nothing when inputString is empty', () => {
            component.inputString.set('');
            component.operation.set('Base64');
            component.decode();
            expect(component.outputString()).toBe('');
            expect(mockMessageService.add).not.toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. decode() — Base64
    // ─────────────────────────────────────────────────────────────────────────
    describe('decode() — Base64', () => {
        beforeEach(() => {
            component.operation.set('Base64');
        });

        it('round-trips ASCII encode → decode', () => {
            component.inputString.set('Hello World');
            component.encode();
            const encoded = component.outputString();
            component.inputString.set(encoded);
            component.decode();
            expect(component.outputString()).toBe('Hello World');
        });

        it('round-trips UTF-8 encode → decode', () => {
            component.inputString.set('xin chào');
            component.encode();
            const encoded = component.outputString();
            component.inputString.set(encoded);
            component.decode();
            expect(component.outputString()).toBe('xin chào');
        });

        it('shows error toast for invalid Base64', () => {
            component.inputString.set('!!!not-base64!!!');
            component.decode();
            expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', summary: 'Decoding Error' }));
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. decode() — URL
    // ─────────────────────────────────────────────────────────────────────────
    describe('decode() — URL', () => {
        beforeEach(() => {
            component.operation.set('URL');
        });

        it('decodes %20 back to space', () => {
            component.inputString.set('hello%20world');
            component.decode();
            expect(component.outputString()).toBe('hello world');
        });

        it('round-trips URL encode → decode', () => {
            component.inputString.set('a=1&b=2');
            component.encode();
            const encoded = component.outputString();
            component.inputString.set(encoded);
            component.decode();
            expect(component.outputString()).toBe('a=1&b=2');
        });

        it('shows error toast for invalid URL encoding', () => {
            component.inputString.set('%GG'); // invalid percent sequence
            component.decode();
            expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', summary: 'Decoding Error' }));
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. decode() — HTML (uses document.createElement('textarea'))
    // ─────────────────────────────────────────────────────────────────────────
    describe('decode() — HTML', () => {
        beforeEach(() => {
            component.operation.set('HTML');
        });

        it('delegates to decodeHTML()', () => {
            spyOn(component, 'decodeHTML').and.returnValue('decoded text');
            component.inputString.set('&#72;'); // H
            component.decode();
            expect(component.decodeHTML).toHaveBeenCalledWith('&#72;');
            expect(component.outputString()).toBe('decoded text');
        });

        it('decodeHTML() uses textarea to unescape &amp;', () => {
            const result = component.decodeHTML('&amp;');
            expect(result).toBe('&');
        });

        it('decodeHTML() unescapes &lt; and &gt;', () => {
            const result = component.decodeHTML('&lt;div&gt;');
            expect(result).toBe('<div>');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 10. encodeHTML() helper
    // ─────────────────────────────────────────────────────────────────────────
    describe('encodeHTML()', () => {
        it('converts & to &#38;', () => {
            expect(component.encodeHTML('&')).toBe('&#38;');
        });
        it('converts < to &#60;', () => {
            expect(component.encodeHTML('<')).toBe('&#60;');
        });
        it('converts > to &#62;', () => {
            expect(component.encodeHTML('>')).toBe('&#62;');
        });
        it('converts " to &#34;', () => {
            expect(component.encodeHTML('"')).toBe('&#34;');
        });
        it("converts ' to &#39;", () => {
            expect(component.encodeHTML("'")).toBe('&#39;');
        });
        it('leaves plain alphanumeric unchanged', () => {
            expect(component.encodeHTML('abc123')).toBe('abc123');
        });
        it('converts non-ASCII chars (e.g. é) to numeric entity', () => {
            const result = component.encodeHTML('é');
            expect(result).toBe('&#' + 'é'.charCodeAt(0) + ';');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 11. clearInputs()
    // ─────────────────────────────────────────────────────────────────────────
    describe('clearInputs()', () => {
        it('resets inputString to empty', () => {
            component.inputString.set('some text');
            component.clearInputs();
            expect(component.inputString()).toBe('');
        });
        it('resets outputString to empty', () => {
            component.outputString.set('SGVsbG8=');
            component.clearInputs();
            expect(component.outputString()).toBe('');
        });
        it('clears both at the same time', () => {
            component.inputString.set('input');
            component.outputString.set('output');
            component.clearInputs();
            expect(component.inputString()).toBe('');
            expect(component.outputString()).toBe('');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 12. copyToClipboard()
    // ─────────────────────────────────────────────────────────────────────────
    describe('copyToClipboard()', () => {
        let clipboardSpy: jasmine.Spy;

        beforeEach(() => {
            clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve() as any);
        });

        it('does NOT call clipboard API when outputString is empty', (done) => {
            component.outputString.set('');
            component.copyToClipboard();
            Promise.resolve().then(() => {
                expect(clipboardSpy).not.toHaveBeenCalled();
                done();
            });
        });

        it('calls clipboard API with outputString', (done) => {
            component.outputString.set('SGVsbG8=');
            component.copyToClipboard();
            Promise.resolve().then(() => {
                expect(clipboardSpy).toHaveBeenCalledWith('SGVsbG8=');
                done();
            });
        });

        it('shows success toast after copy', (done) => {
            component.outputString.set('SGVsbG8=');
            component.copyToClipboard();
            // Wait 2 microtasks: clipboard writeText resolves, then .then() callback runs
            Promise.resolve()
                .then(() => Promise.resolve())
                .then(() => {
                    expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success', summary: 'Copied' }));
                    done();
                });
        });

        it('shows success detail message', (done) => {
            component.outputString.set('data');
            component.copyToClipboard();
            Promise.resolve()
                .then(() => Promise.resolve())
                .then(() => {
                    expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ detail: 'Result copied to clipboard' }));
                    done();
                });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 13. encode() — error path
    // ─────────────────────────────────────────────────────────────────────────
    describe('encode() — error path', () => {
        it('shows error toast when encodeHTML throws', () => {
            component.operation.set('HTML');
            component.inputString.set('test');
            spyOn(component, 'encodeHTML').and.throwError('Unexpected error');
            component.encode();
            expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', summary: 'Encoding Error' }));
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 14. Full round-trip tests (encode then decode)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Full round-trip', () => {
        const testCases = ['Hello', 'Foo & Bar', '<script>', '中文テスト'];

        for (const text of testCases) {
            describe(`Base64 round-trip for "${text}"`, () => {
                it('recovers the original string', () => {
                    component.operation.set('Base64');
                    component.inputString.set(text);
                    component.encode();
                    const encoded = component.outputString();
                    expect(encoded.length).toBeGreaterThan(0);

                    component.inputString.set(encoded);
                    component.decode();
                    expect(component.outputString()).toBe(text);
                });
            });
        }

        describe('URL round-trip', () => {
            it('recovers the original URL-encoded string', () => {
                component.operation.set('URL');
                component.inputString.set('hello world?q=42&lang=vi');
                component.encode();
                const encoded = component.outputString();

                component.inputString.set(encoded);
                component.decode();
                expect(component.outputString()).toBe('hello world?q=42&lang=vi');
            });
        });
    });
});
