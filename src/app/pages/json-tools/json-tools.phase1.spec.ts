import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { JsonTools } from './json-tools';

function build() {
    const msgSvc = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    const layoutSvc = { isDarkTheme: signal(false) };
    TestBed.configureTestingModule({});
    const comp = TestBed.runInInjectionContext(() => new JsonTools(msgSvc, layoutSvc as any));
    return { comp };
}

describe('JsonTools Phase 1', () => {
    let component: JsonTools;

    beforeEach(() => {
        component = build().comp;
    });

    it('runs JSONPath query without changing formatted output', () => {
        component.inputCode.set('{"items":[{"id":1},{"id":2}]}');
        component.outputCode.set('formatted-output');
        component.query.set('$.items[*].id');

        component.runJsonPathQuery();

        expect(component.queryResults()).toContain('1');
        expect(component.queryResults()).toContain('2');
        expect(component.outputCode()).toBe('formatted-output');
    });

    it('validates payload against schema and reports success', () => {
        component.inputCode.set('{"name":"Alice"}');
        component.schemaInput.set('{"type":"object","required":["name"],"properties":{"name":{"type":"string"}}}');

        component.validateAgainstSchema();

        expect(component.validationPassed()).toBeTrue();
        expect(component.validationErrors().length).toBe(0);
    });

    it('reports schema validation errors with paths', () => {
        component.inputCode.set('{"name":123}');
        component.schemaInput.set('{"type":"object","properties":{"name":{"type":"string"}}}');

        component.validateAgainstSchema();

        expect(component.validationPassed()).toBeFalse();
        expect(component.validationErrors().length).toBeGreaterThan(0);
    });
});
