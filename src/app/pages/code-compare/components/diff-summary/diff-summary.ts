import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CodeCompareState } from '../../services/code-compare-state.service';

@Component({
    selector: 'p-diff-summary',
    standalone: true,
    imports: [CommonModule, BadgeModule, ButtonModule, DividerModule, TooltipModule],
    templateUrl: './diff-summary.html',
    styleUrl: './diff-summary.scss'
})
export class DiffSummary {
    state = inject(CodeCompareState);
    showAllUnchanged = computed(() => this.state.showAllUnchanged());

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
