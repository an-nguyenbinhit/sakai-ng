import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo flex items-center gap-3" routerLink="/">
                <span class="layout-topbar-logo-icon">
                    <i class="pi pi-wrench"></i>
                </span>
                <div class="flex flex-col leading-none gap-0.5">
                    <span class="font-bold text-surface-800 dark:text-surface-100 text-base tracking-tight">Dev Tools</span>
                    <span class="text-xs text-surface-400 font-normal hidden sm:block">Developer Utilities</span>
                </div>
            </a>
        </div>

        <nav class="layout-topbar-nav">
            <a routerLink="/" routerLinkActive="topnav-active" [routerLinkActiveOptions]="{ exact: true }" class="topnav-item">
                <i class="pi pi-home"></i>
                <span>Home</span>
            </a>
            <a routerLink="/code-compare" routerLinkActive="topnav-active" class="topnav-item">
                <i class="pi pi-code"></i>
                <span>Code Compare</span>
            </a>
            <a routerLink="/code-formatter" routerLinkActive="topnav-active" class="topnav-item">
                <i class="pi pi-align-left"></i>
                <span>Code Formatter</span>
            </a>
            <a routerLink="/json-tools" routerLinkActive="topnav-active" class="topnav-item">
                <i class="pi pi-database"></i>
                <span>JSON Tools</span>
            </a>
            <a routerLink="/regex-tester" routerLinkActive="topnav-active" class="topnav-item">
                <i class="pi pi-search"></i>
                <span>Regex Tester</span>
            </a>
            <a routerLink="/encode-decode" routerLinkActive="topnav-active" class="topnav-item">
                <i class="pi pi-lock"></i>
                <span>Encode / Decode</span>
            </a>
            <a routerLink="/dummy-file-generator" routerLinkActive="topnav-active" class="topnav-item">
                <i class="pi pi-file-plus"></i>
                <span>Dummy File Generator</span>
            </a>
        </nav>

        <div class="layout-topbar-actions">
            <div class="layout-topbar-menu lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                        <span>Dark Mode</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);

    toggleDarkMode() {
        this.layoutService.toggleDarkTheme();
    }
}
