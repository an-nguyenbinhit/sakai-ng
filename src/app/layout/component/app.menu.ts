import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { TOOL_NAVIGATION_GROUPS } from '@/app/core/tooling/tool-definitions';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    model: any[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Workspace',
                items: [
                    {
                        label: 'Home',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/'],
                        path: '/'
                    }
                ]
            },
            ...TOOL_NAVIGATION_GROUPS.map((group) => ({
                label: group.category.label,
                items: group.tools.map((tool) => ({
                    label: tool.label,
                    icon: `pi pi-fw ${tool.icon.replace('pi ', '')}`,
                    routerLink: tool.route ? [tool.route] : undefined,
                    path: tool.route ?? undefined,
                    disabled: !tool.route,
                    badge: tool.status === 'planned' ? tool.badge || 'Planned' : undefined,
                    description: tool.description,
                    class: tool.route ? '' : 'menu-item-disabled'
                }))
            }))
        ];
    }
}
