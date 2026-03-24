import { Injectable } from '@angular/core';

export interface BreakpointRange {
    label: string;
    minWidth: number;
    maxWidth: number | null;
    note: string;
}

export interface BreakpointPreset {
    id: string;
    label: string;
    source: string;
    description: string;
    breakpoints: BreakpointRange[];
}

export interface ViewportAnalysis {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape' | 'square';
    activeBreakpoint: BreakpointRange;
    notes: string[];
}

export interface ResponsiveSnippetBundle {
    css: string;
    scss: string;
    tailwind: string;
}

@Injectable({ providedIn: 'root' })
export class ResponsiveHelperService {
    readonly presets: BreakpointPreset[] = [
        {
            id: 'tailwind',
            label: 'Tailwind',
            source: 'Tailwind CSS',
            description: 'Default mobile-first breakpoints used by Tailwind utility prefixes.',
            breakpoints: [
                { label: 'base', minWidth: 0, maxWidth: 639, note: 'Single-column defaults, stacked controls, and touch-first spacing.' },
                { label: 'sm', minWidth: 640, maxWidth: 767, note: 'Small tablet portrait layouts and denser navigation become viable.' },
                { label: 'md', minWidth: 768, maxWidth: 1023, note: 'Tablet and small laptop layouts can introduce side panels or 2-column grids.' },
                { label: 'lg', minWidth: 1024, maxWidth: 1279, note: 'Desktop navigation, split workspaces, and persistent filters are reasonable.' },
                { label: 'xl', minWidth: 1280, maxWidth: 1535, note: 'Wider content rails, larger tables, and denser toolbars fit comfortably.' },
                { label: '2xl', minWidth: 1536, maxWidth: null, note: 'Large desktop canvases can support multi-pane workflows and wider content limits.' }
            ]
        },
        {
            id: 'bootstrap',
            label: 'Bootstrap',
            source: 'Bootstrap 5',
            description: 'Container-oriented breakpoints common in dashboard and marketing layouts.',
            breakpoints: [
                { label: 'xs', minWidth: 0, maxWidth: 575, note: 'Phone-first layout with full-width sections and minimal chrome.' },
                { label: 'sm', minWidth: 576, maxWidth: 767, note: 'Large phones can fit tighter spacing and 2-up utility rows.' },
                { label: 'md', minWidth: 768, maxWidth: 991, note: 'Tablet layouts can reveal secondary actions and side-by-side forms.' },
                { label: 'lg', minWidth: 992, maxWidth: 1199, note: 'Desktop cards and split panes become stable without crowding.' },
                { label: 'xl', minWidth: 1200, maxWidth: 1399, note: 'Wide content containers and multi-column tools remain readable.' },
                { label: 'xxl', minWidth: 1400, maxWidth: null, note: 'High-density workspaces can add summary rails or inspector panes.' }
            ]
        },
        {
            id: 'material',
            label: 'Material',
            source: 'Material Design',
            description: 'Layout tiers aligned with common adaptive UI breakpoints.',
            breakpoints: [
                { label: 'compact', minWidth: 0, maxWidth: 599, note: 'Prioritize core actions, bottom sheets, and simplified navigation.' },
                { label: 'medium', minWidth: 600, maxWidth: 839, note: 'Adaptive surfaces can expose more content without abandoning touch targets.' },
                { label: 'expanded', minWidth: 840, maxWidth: 1199, note: 'Navigation rail, dual-pane layouts, and richer filtering are practical.' },
                { label: 'large', minWidth: 1200, maxWidth: 1599, note: 'Desktop-first shells can stabilize with persistent side panels.' },
                { label: 'extra-large', minWidth: 1600, maxWidth: null, note: 'Very wide canvases benefit from width caps and stronger visual grouping.' }
            ]
        }
    ];

    getPreset(presetId: string): BreakpointPreset {
        return this.presets.find((preset) => preset.id === presetId) ?? this.presets[0];
    }

    analyzeViewport(presetId: string, width: number, height: number): ViewportAnalysis {
        const safeWidth = this.normalizeViewport(width, 320, 3840);
        const safeHeight = this.normalizeViewport(height, 320, 2160);
        const preset = this.getPreset(presetId);
        const activeBreakpoint = preset.breakpoints.find((breakpoint) => this.isWidthWithinRange(safeWidth, breakpoint)) ?? preset.breakpoints[0];
        const orientation = safeWidth === safeHeight ? 'square' : safeWidth > safeHeight ? 'landscape' : 'portrait';

        return {
            width: safeWidth,
            height: safeHeight,
            orientation,
            activeBreakpoint,
            notes: this.buildViewportNotes(preset, safeWidth, safeHeight, orientation, activeBreakpoint)
        };
    }

    generateSnippets(presetId: string, selector: string): ResponsiveSnippetBundle {
        const preset = this.getPreset(presetId);
        const safeSelector = selector.trim() || '.responsive-shell';
        const mediaBreakpoints = preset.breakpoints.filter((breakpoint) => breakpoint.minWidth > 0);

        const css = [
            `${safeSelector} {`,
            '    display: grid;',
            '    gap: 1rem;',
            '    grid-template-columns: 1fr;',
            '}',
            ...mediaBreakpoints.map((breakpoint) =>
                ['',
                `@media (min-width: ${breakpoint.minWidth}px) {`,
                `    ${safeSelector} {`,
                `        /* ${breakpoint.label}: ${breakpoint.note} */`,
                `        grid-template-columns: repeat(${this.getSuggestedColumns(breakpoint.minWidth)}, minmax(0, 1fr));`,
                '    }',
                '}'].join('\n')
            )
        ].join('\n');

        const scss = [
            '$breakpoints: (',
            ...preset.breakpoints.map((breakpoint) => `    ${this.toScssKey(breakpoint.label)}: ${breakpoint.minWidth}px,`),
            ');',
            '',
            '@mixin respond-up($name) {',
            '    @media (min-width: map-get($breakpoints, $name)) {',
            '        @content;',
            '    }',
            '}',
            '',
            `${safeSelector} {`,
            '    display: grid;',
            '    gap: 1rem;',
            '',
            ...mediaBreakpoints.map((breakpoint) => `    @include respond-up(${this.toScssKey(breakpoint.label)}) { grid-template-columns: repeat(${this.getSuggestedColumns(breakpoint.minWidth)}, minmax(0, 1fr)); }`)
            ,'}'
        ].join('\n');

        const tailwind = [
            `<!-- ${preset.label} breakpoint plan -->`,
            `<section class="grid grid-cols-1 gap-4 ${mediaBreakpoints.map((breakpoint) => `${this.toTailwindVariant(preset.id, breakpoint.label, breakpoint.minWidth)}:grid-cols-${Math.min(this.getSuggestedColumns(breakpoint.minWidth), 4)}`).join(' ')}">`,
            '    <!-- responsive content -->',
            '</section>'
        ].join('\n');

        return { css, scss, tailwind };
    }

    private buildViewportNotes(
        preset: BreakpointPreset,
        width: number,
        height: number,
        orientation: ViewportAnalysis['orientation'],
        activeBreakpoint: BreakpointRange
    ): string[] {
        const notes = [
            `${preset.label} is currently in the ${activeBreakpoint.label} range at ${width}px.`,
            activeBreakpoint.note
        ];

        if (width < 640) {
            notes.push('Prefer a single primary action per row and keep labels visible instead of icon-only controls.');
        } else if (width < 1024) {
            notes.push('Two-column forms, compact tables, and collapsible side panels are usually safe here.');
        } else {
            notes.push('Persistent navigation and side-by-side workspaces fit, but cap long reading widths to avoid scanning fatigue.');
        }

        if (orientation === 'landscape' && height < 700) {
            notes.push('Landscape with limited height needs tighter vertical spacing and sticky actions.');
        }

        if (orientation === 'portrait' && width >= 768) {
            notes.push('Tablet portrait often benefits from drawer-based secondary navigation instead of fixed sidebars.');
        }

        return notes;
    }

    private normalizeViewport(value: number, min: number, max: number): number {
        const numericValue = Number.isFinite(value) ? Math.round(value) : min;
        return Math.min(Math.max(numericValue, min), max);
    }

    private isWidthWithinRange(width: number, breakpoint: BreakpointRange): boolean {
        if (breakpoint.maxWidth === null) {
            return width >= breakpoint.minWidth;
        }

        return width >= breakpoint.minWidth && width <= breakpoint.maxWidth;
    }

    private getSuggestedColumns(minWidth: number): number {
        if (minWidth >= 1280) {
            return 4;
        }

        if (minWidth >= 768) {
            return 3;
        }

        return 2;
    }

    private toScssKey(label: string): string {
        return label.toLowerCase().replace(/\s+/g, '-');
    }

    private toTailwindVariant(presetId: string, label: string, minWidth: number): string {
        if (presetId === 'tailwind') {
            return label;
        }

        return `min-[${minWidth}px]`;
    }
}
