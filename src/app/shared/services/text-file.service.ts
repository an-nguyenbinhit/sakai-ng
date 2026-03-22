import { Injectable } from '@angular/core';
import { BrowserService } from './browser.service';

@Injectable({ providedIn: 'root' })
export class TextFileService {
    constructor(private browserService: BrowserService) {}

    async readText(file: File): Promise<string> {
        return file.text();
    }

    downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8'): boolean {
        if (!content || !this.browserService.isBrowser) {
            return false;
        }

        const nativeWindow = this.browserService.nativeWindow;
        if (!nativeWindow) {
            return false;
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = nativeWindow.document.createElement('a');
        link.href = url;
        link.download = filename;
        nativeWindow.document.body.appendChild(link);
        link.click();
        nativeWindow.document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    }
}
