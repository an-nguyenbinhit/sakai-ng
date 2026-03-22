import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@/app/layout/service/layout.service';
import { TOOL_NAVIGATION_GROUPS } from '@/app/core/tooling/tool-definitions';

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
            <a routerLink="/" routerLinkActive="topnav-active" [routerLinkActiveOptions]="{ exact: true }" class="topnav-item topnav-item--home">
                <i class="pi pi-home"></i>
                <span>Home</span>
            </a>
            @for (group of navigationGroups; track group.category.key) {
                <div
                    class="topnav-group"
                    (mouseenter)="setActiveCategory(group.category.key)"
                    (mouseleave)="clearActiveCategory()"
                >
                    <button
                        type="button"
                        class="topnav-item topnav-item--category"
                        [class.topnav-active]="activeCategory() === group.category.key || isGroupActive(group.category.key)"
                        (click)="toggleCategory(group.category.key)"
                    >
                        <i [class]="group.category.icon"></i>
                        <span>{{ group.category.label }}</span>
                        <small>{{ group.tools.length }}</small>
                    </button>

                    @if (activeCategory() === group.category.key) {
                        <div class="topnav-panel">
                            <div class="topnav-panel__head">
                                <div>
                                    <p>{{ group.category.label }}</p>
                                    <h3>{{ group.category.description }}</h3>
                                </div>
                                <span>{{ liveCount(group.tools) }} live / {{ plannedCount(group.tools) }} planned</span>
                            </div>

                            <div class="topnav-panel__grid">
                                @for (tool of group.tools; track tool.label) {
                                    @if (tool.route) {
                                        <a class="topnav-tool" [routerLink]="tool.route" (click)="clearActiveCategory()">
                                            <div class="topnav-tool__row">
                                                <i [class]="tool.icon"></i>
                                                <strong>{{ tool.label }}</strong>
                                            </div>
                                            <span class="topnav-tool__badge">{{ tool.badge || (tool.status === 'new' ? 'New' : 'Live') }}</span>
                                            <p>{{ tool.description }}</p>
                                        </a>
                                    } @else {
                                        <div class="topnav-tool topnav-tool--planned">
                                            <div class="topnav-tool__row">
                                                <i [class]="tool.icon"></i>
                                                <strong>{{ tool.label }}</strong>
                                            </div>
                                            <span class="topnav-tool__badge">{{ tool.badge || 'Planned' }}</span>
                                            <p>{{ tool.description }}</p>
                                        </div>
                                    }
                                }
                            </div>
                        </div>
                    }
                </div>
            }
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
    layoutService = inject(LayoutService);
    readonly navigationGroups = TOOL_NAVIGATION_GROUPS;
    readonly activeCategory = signal<string | null>(null);

    toggleDarkMode() {
        this.layoutService.toggleDarkTheme();
    }

    setActiveCategory(categoryKey: string) {
        this.activeCategory.set(categoryKey);
    }

    clearActiveCategory() {
        this.activeCategory.set(null);
    }

    toggleCategory(categoryKey: string) {
        this.activeCategory.update((current) => (current === categoryKey ? null : categoryKey));
    }

    liveCount(tools: Array<{ route: string | null }>) {
        return tools.filter((tool) => !!tool.route).length;
    }

    plannedCount(tools: Array<{ route: string | null }>) {
        return tools.filter((tool) => !tool.route).length;
    }

    isGroupActive(categoryKey: string) {
        const group = this.navigationGroups.find((item) => item.category.key === categoryKey);
        const activePath = this.layoutService.layoutState().activePath;

        return group?.tools.some((tool) => !!tool.route && activePath === tool.route) ?? false;
    }
}
