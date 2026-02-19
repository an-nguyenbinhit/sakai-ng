import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { FileCompareState } from '../../services/file-compare-state.service';

@Component({
    selector: 'p-diff-summary',
    standalone: true,
    imports: [CommonModule, BadgeModule, DividerModule],
    template: `
        @if (summary()) {
            <div class="flex flex-wrap items-center gap-4 px-4 py-2 bg-surface-50 dark:bg-surface-800 rounded-border border border-surface-200 dark:border-surface-700 text-sm">
                <div class="flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                        +{{ summary()!.totalAdded }} added
                    </span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                        -{{ summary()!.totalRemoved }} removed
                    </span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                        ~{{ summary()!.totalModified }} modified
                    </span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                        {{ summary()!.totalUnchanged }} unchanged
                    </span>
                </div>

                <p-divider layout="vertical" styleClass="!m-0 !h-4" />

                <div class="flex items-center gap-1.5">
                    <div class="w-24 h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-primary rounded-full transition-all"
                            [style.width.%]="summary()!.similarityPercent"
                        ></div>
                    </div>
                    <span class="text-surface-600 dark:text-surface-300 font-medium">
                        {{ summary()!.similarityPercent }}% similar
                    </span>
                </div>

                <div class="ml-auto text-xs text-surface-400">
                    Total: {{ summary()!.total }} lines
                </div>
            </div>
        }
    `
})
export class DiffSummary {
    private state = inject(FileCompareState);

    summary = computed(() => {
        const result = this.state.diffResult();
        if (!result) return null;
        return {
            totalAdded: result.totalAdded,
            totalRemoved: result.totalRemoved,
            totalModified: result.totalModified,
            totalUnchanged: result.totalUnchanged,
            similarityPercent: result.similarityPercent,
            total: result.totalAdded + result.totalRemoved + result.totalModified + result.totalUnchanged
        };
    });
}
