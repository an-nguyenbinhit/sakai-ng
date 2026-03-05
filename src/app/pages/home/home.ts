import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Tool {
    label: string;
    description: string;
    route: string;
    icon: string;
    tags: string[];
    accentFrom: string;
    accentTo: string;
    iconBg: string;
    iconColor: string;
    glow: string;
    borderHover: string;
    tagBg: string;
    tagColor: string;
}

@Component({
    selector: 'p-home',
    standalone: true,
    imports: [RouterModule, FormsModule],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class Home {
    searchQuery = signal('');

    readonly tools: Tool[] = [
        {
            label: 'Code Compare',
            description: 'Diff two code snippets side-by-side with syntax highlighting and export.',
            route: '/code-compare',
            icon: 'pi pi-code',
            tags: ['Compare', 'Diff'],
            accentFrom: 'rgba(59,130,246,0.15)',
            accentTo: 'rgba(99,102,241,0.1)',
            iconBg: 'oklch(0.95 0.03 250)',
            iconColor: '#3b82f6',
            glow: 'rgba(59,130,246,0.35)',
            borderHover: '#3b82f6',
            tagBg: 'rgba(59,130,246,0.1)',
            tagColor: '#2563eb'
        },
        {
            label: 'Code Formatter',
            description: 'Format and beautify code across multiple languages instantly.',
            route: '/code-formatter',
            icon: 'pi pi-align-left',
            tags: ['Format', 'Beautify'],
            accentFrom: 'rgba(168,85,247,0.15)',
            accentTo: 'rgba(139,92,246,0.1)',
            iconBg: 'oklch(0.95 0.03 300)',
            iconColor: '#a855f7',
            glow: 'rgba(168,85,247,0.35)',
            borderHover: '#a855f7',
            tagBg: 'rgba(168,85,247,0.1)',
            tagColor: '#7c3aed'
        },
        {
            label: 'JSON Tools',
            description: 'Validate, format, diff and transform JSON data effortlessly.',
            route: '/json-tools',
            icon: 'pi pi-database',
            tags: ['Validate', 'Format'],
            accentFrom: 'rgba(245,158,11,0.15)',
            accentTo: 'rgba(251,191,36,0.1)',
            iconBg: 'oklch(0.96 0.04 90)',
            iconColor: '#f59e0b',
            glow: 'rgba(245,158,11,0.35)',
            borderHover: '#f59e0b',
            tagBg: 'rgba(245,158,11,0.1)',
            tagColor: '#d97706'
        },
        {
            label: 'Regex Tester',
            description: 'Test and debug regular expressions with live match highlighting.',
            route: '/regex-tester',
            icon: 'pi pi-search',
            tags: ['Regex', 'Debug'],
            accentFrom: 'rgba(244,63,94,0.15)',
            accentTo: 'rgba(251,113,133,0.1)',
            iconBg: 'oklch(0.96 0.03 10)',
            iconColor: '#f43f5e',
            glow: 'rgba(244,63,94,0.35)',
            borderHover: '#f43f5e',
            tagBg: 'rgba(244,63,94,0.1)',
            tagColor: '#e11d48'
        },
        {
            label: 'Encode / Decode',
            description: 'Encode and decode Base64, URL, HTML entities and more.',
            route: '/encode-decode',
            icon: 'pi pi-lock',
            tags: ['Encode', 'Decode'],
            accentFrom: 'rgba(20,184,166,0.15)',
            accentTo: 'rgba(13,148,136,0.1)',
            iconBg: 'oklch(0.95 0.04 180)',
            iconColor: '#14b8a6',
            glow: 'rgba(20,184,166,0.35)',
            borderHover: '#14b8a6',
            tagBg: 'rgba(20,184,166,0.1)',
            tagColor: '#0d9488'
        }
    ];

    filteredTools = computed(() => {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q) return this.tools;
        return this.tools.filter((t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)));
    });

    clearSearch() {
        this.searchQuery.set('');
    }

    onQueryChange(value: string) {
        this.searchQuery.set(value);
    }
}
