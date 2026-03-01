import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiffLine, WordToken } from '../../models/diff.models';

@Component({
    selector: 'p-diff-line',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './diff-line.html',
    styleUrl: './diff-line.scss'
})
export class DiffLineComponent {
    line = input.required<DiffLine>();
    searchQuery = input<string>('');

    hasTokens = computed(() => {
        const tokens = this.line().tokens;
        return tokens !== null && tokens.length > 0;
    });

    rowClass = computed(() => {
        const type = this.line().type;
        return {
            'bg-green-50 dark:bg-green-950': type === 'added',
            'bg-red-50 dark:bg-red-950': type === 'removed',
            'bg-yellow-50 dark:bg-yellow-950': type === 'modified',
            'bg-surface-0 dark:bg-surface-900': type === 'unchanged',
            'bg-surface-100 dark:bg-surface-800': type === 'fold',
            'border-b border-surface-100 dark:border-surface-800': type !== 'fold'
        };
    });

    gutterClass = computed(() => {
        const type = this.line().type;
        return {
            'bg-green-100 dark:bg-green-900': type === 'added',
            'bg-red-100 dark:bg-red-900': type === 'removed',
            'bg-yellow-100 dark:bg-yellow-900': type === 'modified',
            'bg-surface-50 dark:bg-surface-800': type === 'unchanged',
            'bg-surface-100 dark:bg-surface-700': type === 'fold'
        };
    });

    markerClass = computed(() => {
        const type = this.line().type;
        return {
            'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900': type === 'added',
            'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900': type === 'removed',
            'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900': type === 'modified',
            'text-surface-400 bg-surface-50 dark:bg-surface-800': type === 'unchanged',
            'bg-surface-100 dark:bg-surface-700': type === 'fold'
        };
    });

    marker = computed(() => {
        switch (this.line().type) {
            case 'added': return '+';
            case 'removed': return '-';
            case 'modified': return '~';
            default: return '';
        }
    });

    highlightedContent = computed(() => {
        const html = this.line().highlightedHtml || '&nbsp;';
        const query = this.searchQuery();
        if (!query || !html) return html;

        // Highlight search matches within pre-escaped content
        const escapedQuery = this.escapeRegex(this.escapeHtml(query));
        return html.replace(
            new RegExp(`(${escapedQuery})`, 'gi'),
            '<mark class="bg-yellow-300 dark:bg-yellow-600 rounded">$1</mark>'
        );
    });

    tokenClass(token: WordToken): Record<string, boolean> {
        return {
            'bg-green-200 dark:bg-green-800 rounded-sm': token.type === 'added',
            'bg-red-200 dark:bg-red-800 line-through rounded-sm': token.type === 'removed'
        };
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
