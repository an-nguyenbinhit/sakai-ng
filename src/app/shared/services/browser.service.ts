import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class BrowserService {
    readonly isBrowser: boolean;

    constructor(
        @Inject(PLATFORM_ID) platformId: object,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    get nativeWindow(): Window | null {
        if (!this.isBrowser) {
            return null;
        }
        return this.document.defaultView;
    }
}
