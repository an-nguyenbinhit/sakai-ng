import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CodeFormatter } from './code-formatter';

function build() {
    const msgSvc = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    const layoutSvc = { isDarkTheme: signal(false) };
    TestBed.configureTestingModule({});
    const comp = TestBed.runInInjectionContext(() => new CodeFormatter(msgSvc, layoutSvc as any));
    return { comp, msgSvc };
}

describe('CodeFormatter Phase 1', () => {
    let component: CodeFormatter;

    beforeEach(() => {
        component = build().comp;
    });

    it('detects JSON from pasted content when language is not locked', () => {
        component.onInputChange('{"name":"devworkspace"}');
        expect(component.selectedLanguage()).toBe('json');
        expect(component.warnings().some((item) => item.code === 'LANGUAGE_DETECTED')).toBeTrue();
    });

    it('keeps manually selected language when detection runs later', () => {
        component.selectedLanguage.set('html');
        component.onLanguageChange();
        component.onInputChange('{"name":"devworkspace"}');
        expect(component.selectedLanguage()).toBe('html');
    });

    it('applies JSON fallback formatting when primary formatter fails', async () => {
        component.selectedLanguage.set('json');
        component.inputCode.set('{"name":"demo"}');
        spyOn<any>(component, 'callPrettierFormat').and.rejectWith(new Error('Primary formatter failed'));

        await component.formatCode();

        expect(component.outputCode()).toContain('"name": "demo"');
        expect(component.warnings().some((item) => item.code === 'JSON_FALLBACK')).toBeTrue();
    });
});
