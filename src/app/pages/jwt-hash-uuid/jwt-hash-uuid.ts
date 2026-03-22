import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { BrowserService } from '@/app/shared/services/browser.service';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import * as CryptoJS from 'crypto-js';
import { nanoid } from 'nanoid';
import { ulid } from 'ulid';

type JwtHashUuidTab = 'jwt' | 'hash' | 'ids';
type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

@Component({
    selector: 'app-jwt-hash-uuid',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './jwt-hash-uuid.html',
    styleUrl: './jwt-hash-uuid.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class JwtHashUuid {
    readonly tabs: Array<{ key: JwtHashUuidTab; label: string }> = [
        { key: 'jwt', label: 'JWT Inspector' },
        { key: 'hash', label: 'Hash Generator' },
        { key: 'ids', label: 'ID Generator' }
    ];

    readonly hashAlgorithms = [
        { label: 'MD5', value: 'md5' },
        { label: 'SHA-1', value: 'sha1' },
        { label: 'SHA-256', value: 'sha256' },
        { label: 'SHA-512', value: 'sha512' }
    ];

    readonly activeTab = signal<JwtHashUuidTab>('jwt');
    readonly jwtToken = signal('');
    readonly jwtHeader = signal('');
    readonly jwtPayload = signal('');
    readonly jwtSignature = signal('');
    readonly jwtError = signal('');
    readonly hashInput = signal('DevWorkspace');
    readonly hashOutput = signal('');
    readonly hashAlgorithm = signal<HashAlgorithm>('sha256');
    readonly hashFileName = signal('');
    readonly idQuantity = signal(3);
    readonly generatedIds = signal<string[]>([]);

    readonly shellStats = [
        { icon: 'pi pi-shield', label: 'JWT inspection without network calls' },
        { icon: 'pi pi-lock', label: 'MD5 + SHA family hashing' },
        { icon: 'pi pi-hashtag', label: 'UUID, ULID, and Nano ID generation' }
    ];

    constructor(
        private browserService: BrowserService,
        private clipboardService: ClipboardService,
        private messageService: MessageService
    ) {
        this.loadJwtSample();
        this.hashText();
        this.generateIds('uuid');
    }

    setTab(tab: JwtHashUuidTab) {
        this.activeTab.set(tab);
    }

    async copyValue(value: string, label: string) {
        const copied = await this.clipboardService.copyText(value);
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? `${label} copied to clipboard.` : 'Clipboard access is unavailable in this context.'
        });
    }

    decodeJwt() {
        const token = this.jwtToken().trim();
        this.jwtError.set('');
        this.jwtHeader.set('');
        this.jwtPayload.set('');
        this.jwtSignature.set('');

        if (!token) {
            this.jwtError.set('Paste a token first.');
            return;
        }

        const parts = token.split('.');
        if (parts.length < 2) {
            this.jwtError.set('A JWT must include at least header and payload segments.');
            return;
        }

        try {
            this.jwtHeader.set(JSON.stringify(JSON.parse(this.decodeBase64Url(parts[0])), null, 2));
            this.jwtPayload.set(JSON.stringify(JSON.parse(this.decodeBase64Url(parts[1])), null, 2));
            this.jwtSignature.set(parts[2] ?? '(unsigned or omitted)');
        } catch (error) {
            this.jwtError.set(error instanceof Error ? error.message : 'Failed to decode token.');
        }
    }

    async hashFile(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        const buffer = await file.arrayBuffer();
        const wordArray = CryptoJS.lib.WordArray.create(buffer as never);
        this.hashOutput.set(this.hashWordArray(wordArray, this.hashAlgorithm()));
        this.hashFileName.set(file.name);
    }

    hashText() {
        this.hashOutput.set(this.hashWordArray(this.hashInput(), this.hashAlgorithm()));
        this.hashFileName.set('');
    }

    generateIds(kind: 'uuid' | 'ulid' | 'nanoid') {
        const nextItems = Array.from({ length: Math.max(1, Math.floor(this.idQuantity())) }, () => {
            if (kind === 'ulid') return ulid();
            if (kind === 'nanoid') return nanoid();
            return this.browserService.nativeWindow?.crypto?.randomUUID?.() ?? ulid();
        });

        this.generatedIds.set(nextItems);
    }

    loadJwtSample() {
        this.jwtToken.set(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtd29ya3NwYWNlIiwibmFtZSI6IkRldiBXb3Jrc3BhY2UiLCJyb2xlIjoiZGV2ZWxvcGVyIiwiaWF0IjoxNzA0MDY3MjAwfQ.signature'
        );
        this.decodeJwt();
    }

    private decodeBase64Url(value: string): string {
        if (!this.browserService.isBrowser) {
            throw new Error('JWT decoding is available in the browser runtime only.');
        }

        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        return decodeURIComponent(Array.from(atob(padded)).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    }

    private hashWordArray(value: CryptoJS.lib.WordArray | string, algorithm: HashAlgorithm): string {
        switch (algorithm) {
            case 'md5':
                return CryptoJS.MD5(value).toString();
            case 'sha1':
                return CryptoJS.SHA1(value).toString();
            case 'sha256':
                return CryptoJS.SHA256(value).toString();
            case 'sha512':
                return CryptoJS.SHA512(value).toString();
            default:
                return '';
        }
    }
}
