import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { ParsedUrlState, TransportEncoding, UrlSegment, UrlToolsService } from './url-tools.service';

type UrlToolsTab = 'parser' | 'encoders';

@Component({
    selector: 'app-url-tools',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './url-tools.html',
    styleUrl: './url-tools.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UrlTools {
    readonly tabs: Array<{ key: UrlToolsTab; label: string }> = [
        { key: 'parser', label: 'URL Parser' },
        { key: 'encoders', label: 'Transport Encoders' }
    ];

    readonly encoders = [
        { label: 'Base64', value: 'base64' },
        { label: 'URL', value: 'url' },
        { label: 'HTML entities', value: 'html' },
        { label: 'JSON string', value: 'json' }
    ];

    readonly activeTab = signal<UrlToolsTab>('parser');
    readonly urlInput = signal('https://devworkspace.app/tools?tab=url&lang=en#preview');
    readonly urlState = signal<ParsedUrlState>({
        origin: 'https://devworkspace.app',
        pathname: '/tools',
        hash: 'preview',
        params: [
            { key: 'tab', value: 'url' },
            { key: 'lang', value: 'en' }
        ]
    });
    readonly builtUrl = signal('');
    readonly urlError = signal('');
    readonly transportInput = signal('email=user@example.com&scope=read write');
    readonly transportOutput = signal('');
    readonly transportMode = signal<TransportEncoding>('url');
    readonly transportError = signal('');

    readonly shellStats = [
        { icon: 'pi pi-link', label: 'Parse URLs into editable fields' },
        { icon: 'pi pi-list', label: 'Query parameter builder' },
        { icon: 'pi pi-lock', label: 'Base64, URL, HTML, and JSON transport modes' }
    ];

    constructor(
        private clipboardService: ClipboardService,
        private messageService: MessageService,
        private urlToolsService: UrlToolsService
    ) {
        this.parseUrl();
        this.encode();
    }

    setTab(tab: UrlToolsTab) {
        this.activeTab.set(tab);
    }

    updateOrigin(value: string) {
        this.urlState.update((state) => ({ ...state, origin: value }));
    }

    updatePathname(value: string) {
        this.urlState.update((state) => ({ ...state, pathname: value }));
    }

    updateHash(value: string) {
        this.urlState.update((state) => ({ ...state, hash: value }));
    }

    addParam() {
        this.urlState.update((state) => ({
            ...state,
            params: [...state.params, { key: '', value: '' }]
        }));
    }

    async copyBuiltUrl() {
        const copied = await this.clipboardService.copyText(this.builtUrl());
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? 'Built URL copied to clipboard.' : 'Clipboard access is unavailable in this context.'
        });
    }

    decode() {
        try {
            this.transportOutput.set(this.urlToolsService.decode(this.transportInput(), this.transportMode()));
            this.transportError.set('');
        } catch (error) {
            this.transportOutput.set('');
            this.transportError.set(error instanceof Error ? error.message : 'Failed to decode value.');
        }
    }

    encode() {
        try {
            this.transportOutput.set(this.urlToolsService.encode(this.transportInput(), this.transportMode()));
            this.transportError.set('');
        } catch (error) {
            this.transportOutput.set('');
            this.transportError.set(error instanceof Error ? error.message : 'Failed to encode value.');
        }
    }

    parseUrl() {
        try {
            const parsed = this.urlToolsService.parseUrl(this.urlInput());
            this.urlState.set(parsed);
            this.builtUrl.set(this.urlToolsService.buildUrl(parsed));
            this.urlError.set('');
        } catch (error) {
            this.urlError.set(error instanceof Error ? error.message : 'Failed to parse URL.');
        }
    }

    rebuildUrl() {
        try {
            this.builtUrl.set(this.urlToolsService.buildUrl(this.urlState()));
            this.urlError.set('');
        } catch (error) {
            this.urlError.set(error instanceof Error ? error.message : 'Failed to build URL.');
        }
    }

    removeParam(index: number) {
        this.urlState.update((state) => ({
            ...state,
            params: state.params.filter((_, currentIndex) => currentIndex !== index)
        }));
        this.rebuildUrl();
    }

    updateParam(index: number, patch: Partial<UrlSegment>) {
        this.urlState.update((state) => ({
            ...state,
            params: state.params.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item))
        }));
    }
}
