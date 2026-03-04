import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-encode-decode',
    standalone: true,
    imports: [CommonModule, FormsModule, TextareaModule, ButtonModule, ToastModule, SelectButtonModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './encode-decode.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EncodeDecode {
    inputString = signal<string>('');
    outputString = signal<string>('');
    operation = signal<'Base64' | 'URL' | 'HTML'>('Base64');

    operations = [
        { label: 'Base64', value: 'Base64' },
        { label: 'URL', value: 'URL' },
        { label: 'HTML', value: 'HTML' }
    ];

    constructor(private messageService: MessageService) { }

    encode() {
        const input = this.inputString();
        if (!input) return;
        try {
            const op = this.operation();
            if (op === 'Base64') {
                this.outputString.set(btoa(unescape(encodeURIComponent(input))));
            } else if (op === 'URL') {
                this.outputString.set(encodeURIComponent(input));
            } else if (op === 'HTML') {
                this.outputString.set(this.encodeHTML(input));
            }
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'Encoding Error', detail: e.message || 'Operation failed' });
        }
    }

    decode() {
        const input = this.inputString();
        if (!input) return;
        try {
            const op = this.operation();
            if (op === 'Base64') {
                this.outputString.set(decodeURIComponent(escape(atob(input))));
            } else if (op === 'URL') {
                this.outputString.set(decodeURIComponent(input));
            } else if (op === 'HTML') {
                this.outputString.set(this.decodeHTML(input));
            }
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'Decoding Error', detail: 'Invalid input format for decoding' });
        }
    }

    encodeHTML(str: string): string {
        return str.replace(/[\u00A0-\u9999<>\&"']/g, (i) => {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }

    decodeHTML(str: string): string {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
    }

    copyToClipboard() {
        const output = this.outputString();
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Result copied to clipboard' });
        });
    }

    clearInputs() {
        this.inputString.set('');
        this.outputString.set('');
    }
}
