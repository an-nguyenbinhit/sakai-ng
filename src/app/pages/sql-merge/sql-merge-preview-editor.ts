import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';

@Component({
    selector: 'app-sql-merge-preview-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, EditorComponent],
    template: `
        <ngx-monaco-editor
            class="preview-editor"
            [options]="options()"
            [ngModel]="value()"
            (ngModelChange)="onValueChange()($event)"
            (onInit)="onEditorInit()($event)"
        ></ngx-monaco-editor>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }

            .preview-editor {
                display: block;
                width: 100%;
                height: 100%;
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlMergePreviewEditor {
    readonly value = input('');
    readonly options = input<Record<string, unknown>>({});
    readonly onValueChange = input<(value: string) => void>(() => undefined);
    readonly onEditorInit = input<(editor: any) => void>(() => undefined);
}
