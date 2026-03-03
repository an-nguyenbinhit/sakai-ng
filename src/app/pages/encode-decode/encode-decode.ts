import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-encode-decode',
    standalone: true,
    imports: [CommonModule, FormsModule, TextareaModule, ButtonModule, ToastModule, SelectButtonModule],
    providers: [MessageService],
    templateUrl: './encode-decode.html'
})
export class EncodeDecode {
    inputString: string = '';
    outputString: string = '';
    operation: 'Base64' | 'URL' | 'HTML' = 'Base64';

    operations = [
        { label: 'Base64', value: 'Base64' },
        { label: 'URL', value: 'URL' },
        { label: 'HTML', value: 'HTML' }
    ];

    constructor(private messageService: MessageService) {}

    encode() {
        if (!this.inputString) return;
        try {
            if (this.operation === 'Base64') {
                this.outputString = btoa(unescape(encodeURIComponent(this.inputString)));
            } else if (this.operation === 'URL') {
                this.outputString = encodeURIComponent(this.inputString);
            } else if (this.operation === 'HTML') {
                this.outputString = this.encodeHTML(this.inputString);
            }
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'Encoding Error', detail: e.message || 'Operation failed' });
        }
    }

    decode() {
        if (!this.inputString) return;
        try {
            if (this.operation === 'Base64') {
                this.outputString = decodeURIComponent(escape(atob(this.inputString)));
            } else if (this.operation === 'URL') {
                this.outputString = decodeURIComponent(this.inputString);
            } else if (this.operation === 'HTML') {
                this.outputString = this.decodeHTML(this.inputString);
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
        if (!this.outputString) return;
        navigator.clipboard.writeText(this.outputString).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Result copied to clipboard' });
        });
    }

    clearInputs() {
        this.inputString = '';
        this.outputString = '';
    }
}
