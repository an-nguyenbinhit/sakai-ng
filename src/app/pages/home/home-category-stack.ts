import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolCategoryDefinition, ToolDefinition } from '@/app/core/tooling/tool-definitions';

interface HomeCategorySection {
    category: ToolCategoryDefinition;
    tools: ToolDefinition[];
}

@Component({
    selector: 'app-home-category-stack',
    standalone: true,
    imports: [RouterModule],
    template: `<section class="category-stack">
        <div class="section-heading">
            <div class="section-heading__copy">
                <h2>
                    @if (isSearchActive()) {
                        {{ filteredCount() }} result{{ filteredCount() !== 1 ? 's' : '' }} for "{{ query() }}"
                    } @else {
                        Tool categories
                    }
                </h2>
                <p>Live tools are clickable. Planned modules stay visible here until their route ships.</p>
            </div>
        </div>

        @for (section of sections(); track section.category.key) {
            @if (section.tools.length) {
                <article class="category-block">
                    <div class="category-header">
                        <div class="category-header__copy">
                            <p class="category-eyebrow">{{ section.category.label }}</p>
                            <h3>{{ section.category.description }}</h3>
                        </div>
                        <i [class]="section.category.icon"></i>
                    </div>

                    <div class="tool-grid">
                        @for (tool of section.tools; track tool.label) {
                            @if (tool.route) {
                                <a class="tool-card" [routerLink]="tool.route">
                                    <div class="tool-card__header">
                                        <div class="tool-card__icon">
                                            <i [class]="tool.icon"></i>
                                        </div>
                                        <div class="tool-card__meta">
                                            <span class="tool-card__status">{{ tool.badge || (tool.status === 'new' ? 'New' : 'Live') }}</span>
                                            <span class="tool-card__offline">{{ tool.supportsOffline ? 'Offline-ready' : 'Online' }}</span>
                                        </div>
                                    </div>

                                    <div class="tool-card__body">
                                        <h4>{{ tool.label }}</h4>
                                        <p>{{ tool.description }}</p>
                                    </div>

                                    <div class="tool-card__tags">
                                        @for (tag of tool.tags; track tag) {
                                            <span class="tool-tag">{{ tag }}</span>
                                        }
                                        @if (tool.supportsFiles) {
                                            <span class="tool-tag tool-tag--accent">Files</span>
                                        }
                                    </div>
                                </a>
                            } @else {
                                <div class="tool-card tool-card--planned">
                                    <div class="tool-card__header">
                                        <div class="tool-card__icon">
                                            <i [class]="tool.icon"></i>
                                        </div>
                                        <div class="tool-card__meta">
                                            <span class="tool-card__status">{{ tool.badge || 'Planned' }}</span>
                                            <span class="tool-card__offline">{{ tool.supportsOffline ? 'Offline-ready' : 'Online' }}</span>
                                        </div>
                                    </div>

                                    <div class="tool-card__body">
                                        <h4>{{ tool.label }}</h4>
                                        <p>{{ tool.description }}</p>
                                    </div>

                                    <div class="tool-card__tags">
                                        @for (tag of tool.tags; track tag) {
                                            <span class="tool-tag">{{ tag }}</span>
                                        }
                                    </div>
                                </div>
                            }
                        }
                    </div>
                </article>
            }
        }

        @if (filteredCount() === 0) {
            <div class="empty-state">
                <i class="pi pi-search-minus"></i>
                <div>
                    <p class="m-0 font-medium text-surface-500">No tools found</p>
                    <p class="m-0 mt-1 text-sm text-surface-400">Try a different keyword or clear the search.</p>
                </div>
                <button class="empty-state__button" type="button" (click)="clearQuery.emit()">Clear search</button>
            </div>
        }
    </section>`
})
export class HomeCategoryStack {
    readonly sections = input.required<HomeCategorySection[]>();
    readonly isSearchActive = input.required<boolean>();
    readonly filteredCount = input.required<number>();
    readonly query = input.required<string>();
    readonly clearQuery = output<void>();
}
