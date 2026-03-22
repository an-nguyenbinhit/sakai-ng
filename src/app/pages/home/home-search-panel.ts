import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-home-search-panel',
    standalone: true,
    template: `<section class="search-panel">
        <div class="search-wrap">
            <i class="pi pi-search search-icon"></i>
            <input
                type="text"
                placeholder="Search by tool, workflow, tag, or category..."
                [value]="query()"
                aria-label="Search tools"
                (input)="onInput($event)"
            />
            @if (query()) {
                <button class="clear-btn" type="button" title="Clear" aria-label="Clear search" (click)="clearQuery.emit()">
                    <i class="pi pi-times"></i>
                </button>
            }
        </div>
        <p class="search-caption">Search matches label, description, tags, keywords, and category name.</p>
    </section>`
})
export class HomeSearchPanel {
    readonly query = input.required<string>();
    readonly queryChange = output<string>();
    readonly clearQuery = output<void>();

    onInput(event: Event) {
        const target = event.target as HTMLInputElement | null;
        this.queryChange.emit(target?.value ?? '');
    }
}
