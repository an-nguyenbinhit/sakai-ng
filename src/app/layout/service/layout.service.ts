import { Injectable, effect, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private readonly storageKey = 'devworkspace.darkTheme';

    platformId = inject(PLATFORM_ID);
    document = inject(DOCUMENT);

    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    });

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: true,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    theme = computed(() => (this.layoutConfig().darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor() {
        this.restoreDarkThemePreference();
        this.toggleDarkMode(this.layoutConfig());

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });

        effect(() => {
            this.persistDarkThemePreference(this.layoutConfig().darkTheme);
        });
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        const supportsViewTransition = 'startViewTransition' in this.document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        this.document.startViewTransition(() => {
            this.toggleDarkMode(config);
        });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            this.document.documentElement.classList.add('app-dark');
        } else {
            this.document.documentElement.classList.remove('app-dark');
        }
    }

    toggleDarkTheme() {
        this.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    isDesktop() {
        return isPlatformBrowser(this.platformId) ? window.innerWidth > 991 : true;
    }

    isMobile() {
        return !this.isDesktop();
    }

    private restoreDarkThemePreference() {
        const storage = this.getStorage();
        const persisted = storage?.getItem(this.storageKey);

        if (persisted !== 'true' && persisted !== 'false') {
            return;
        }

        this.layoutConfig.update((state) => ({
            ...state,
            darkTheme: persisted === 'true'
        }));
    }

    private persistDarkThemePreference(isDarkTheme: boolean) {
        const storage = this.getStorage();
        storage?.setItem(this.storageKey, String(isDarkTheme));
    }

    private getStorage(): Storage | null {
        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }

        try {
            return this.document.defaultView?.localStorage ?? null;
        } catch {
            return null;
        }
    }
}
