import { Component, input } from '@angular/core';

@Component({
    selector: 'app-home-hero',
    standalone: true,
    template: `<section class="hero-wrapper">
        <div class="hero-copy">
            <p class="hero-eyebrow">Developer Workspace</p>
            <h1>
                Frontend and data tools
                <span>grouped by real workflows</span>
            </h1>
            <p class="hero-description">
                DevWorkspace is shifting from a flat utility list into a browser-first public portal. Browse live tools, discover upcoming modules, and move through categories built around day-to-day engineering workflows.
            </p>
        </div>

        <div class="hero-panels">
            <div class="stat-chip">
                <i class="pi pi-th-large"></i>
                <span>{{ toolCount() }} tools listed</span>
            </div>
            <div class="stat-chip">
                <i class="pi pi-folder-open"></i>
                <span>{{ categoryCount() }} categories</span>
            </div>
            <div class="stat-chip">
                <i class="pi pi-wifi"></i>
                <span>Incremental hydration</span>
            </div>
            <div class="stat-chip">
                <i class="pi pi-shield"></i>
                <span>SSR + event replay</span>
            </div>
        </div>
    </section>`
})
export class HomeHero {
    readonly toolCount = input.required<number>();
    readonly categoryCount = input.required<number>();
}
