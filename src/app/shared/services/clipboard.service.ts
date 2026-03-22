import { Injectable } from '@angular/core';
import { BrowserService } from './browser.service';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
    constructor(private browserService: BrowserService) {}

    async copyText(text: string): Promise<boolean> {
        if (!text || !this.browserService.isBrowser) {
            return false;
        }

        const nativeWindow = this.browserService.nativeWindow;
        const clipboard = nativeWindow?.navigator?.clipboard;

        if (clipboard && nativeWindow?.isSecureContext) {
            try {
                await clipboard.writeText(text);
                return true;
            } catch {
                return false;
            }
        }

        const textarea = nativeWindow?.document.createElement('textarea');
        if (!textarea || !nativeWindow) {
            return false;
        }

        textarea.value = text;
        textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        nativeWindow.document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const result = nativeWindow.document.execCommand('copy');
            nativeWindow.document.body.removeChild(textarea);
            return result;
        } catch {
            nativeWindow.document.body.removeChild(textarea);
            return false;
        }
    }
}
