import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TOOL_CATEGORIES, TOOL_DEFINITIONS, ToolCategoryDefinition, ToolDefinition } from '@/app/core/tooling/tool-definitions';

@Component({
    selector: 'p-home',
    standalone: true,
    imports: [RouterModule, FormsModule],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class Home {
    readonly tools = TOOL_DEFINITIONS;
    readonly categories = TOOL_CATEGORIES;

    readonly searchQuery = signal('');

    readonly filteredTools = computed(() => {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q) {
            return this.tools;
        }

        return this.tools.filter((tool) => {
            const category = this.categories.find((item) => item.key === tool.category);
            const haystack = [tool.label, tool.description, ...tool.tags, ...tool.keywords, category?.label ?? ''].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    });

    readonly isSearchActive = computed(() => !!this.searchQuery().trim());

    readonly categorySections = computed(() =>
        this.categories.map((category) => ({
            category,
            tools: this.filteredTools().filter((tool) => tool.category === category.key)
        }))
    );

    clearSearch() {
        this.searchQuery.set('');
    }

    onQueryChange(value: string) {
        this.searchQuery.set(value);
    }

    trackCategory(_: number, section: { category: ToolCategoryDefinition; tools: ToolDefinition[] }) {
        return section.category.key;
    }
}
