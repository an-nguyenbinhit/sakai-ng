import { Injectable } from '@angular/core';

export type TransportEncoding = 'base64' | 'url' | 'html' | 'json';

export interface UrlSegment {
    key: string;
    value: string;
}

export interface ParsedUrlState {
    origin: string;
    pathname: string;
    hash: string;
    params: UrlSegment[];
}

@Injectable({ providedIn: 'root' })
export class UrlToolsService {
    parseUrl(input: string): ParsedUrlState {
        const parsed = new URL(input);
        return {
            origin: `${parsed.protocol}//${parsed.host}`,
            pathname: parsed.pathname,
            hash: parsed.hash.replace(/^#/, ''),
            params: Array.from(parsed.searchParams.entries()).map(([key, value]) => ({ key, value }))
        };
    }

    buildUrl(state: ParsedUrlState): string {
        const url = new URL(state.origin);
        url.pathname = state.pathname || '/';
        url.hash = state.hash || '';
        url.search = '';
        state.params
            .filter((entry) => entry.key.trim().length)
            .forEach((entry) => {
                url.searchParams.append(entry.key, entry.value);
            });
        return url.toString();
    }

    encode(input: string, mode: TransportEncoding): string {
        switch (mode) {
            case 'base64':
                return btoa(unescape(encodeURIComponent(input)));
            case 'url':
                return encodeURIComponent(input);
            case 'html':
                return input.replace(/[\u00A0-\u9999<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
            case 'json':
                return JSON.stringify(input);
            default:
                return input;
        }
    }

    decode(input: string, mode: TransportEncoding): string {
        switch (mode) {
            case 'base64':
                return decodeURIComponent(escape(atob(input)));
            case 'url':
                return decodeURIComponent(input);
            case 'html':
                return input.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
            case 'json': {
                const parsed = JSON.parse(input);
                return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
            }
            default:
                return input;
        }
    }
}
