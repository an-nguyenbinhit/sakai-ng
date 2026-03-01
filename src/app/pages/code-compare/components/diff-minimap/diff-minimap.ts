import { Component, inject, effect, viewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeCompareState } from '../../services/code-compare-state.service';
import { DiffLineType, SideBySideRow } from '../../models/diff.models';

const COLOR_MAP: Record<DiffLineType, string> = {
    added: '#86efac',     // green-300
    removed: '#fca5a5',   // red-300
    modified: '#fde047',  // yellow-300
    unchanged: 'transparent',
    fold: '#e2e8f0'       // surface-200
};

const DARK_COLOR_MAP: Record<DiffLineType, string> = {
    added: '#166534',     // green-800
    removed: '#991b1b',   // red-800
    modified: '#854d0e',  // yellow-800
    unchanged: 'transparent',
    fold: '#334155'       // surface-700
};

@Component({
    selector: 'p-diff-minimap',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './diff-minimap.html',
    styleUrl: './diff-minimap.scss'
})
export class DiffMinimap {
    private state = inject(CodeCompareState);

    minimapCanvas = viewChild<ElementRef<HTMLCanvasElement>>('minimapCanvas');

    indicatorTop = computed(() => this.state.scrollRatio());
    indicatorHeight = computed(() => {
        const result = this.state.diffResult();
        if (!result) return 1;
        const isSideBySide = this.state.viewMode() === 'side-by-side';
        const totalLines = (isSideBySide ? result.sideBySideRows.length : result.inlineRows.length) || 1;
        const visibleLines = Math.min(40, totalLines);
        return Math.min(1, visibleLines / totalLines);
    });

    private isDark = false;

    constructor() {
        this.isDark = document.documentElement.classList.contains('app-dark');

        effect(() => {
            const result = this.state.diffResult();
            const _mode = this.state.viewMode(); // redraw when view mode changes
            if (result) {
                setTimeout(() => this.drawMinimap(), 0);
            }
        });
    }

    private drawMinimap(): void {
        const canvasRef = this.minimapCanvas();
        if (!canvasRef) return;
        const canvas = canvasRef.nativeElement;
        const result = this.state.diffResult();
        if (!result) return;

        const isSideBySide = this.state.viewMode() === 'side-by-side';
        const lineTypes: DiffLineType[] = isSideBySide
            ? result.sideBySideRows.map((row: SideBySideRow) =>
                  row.left.type !== 'unchanged' ? row.left.type : row.right.type
              )
            : result.inlineRows.map(l => l.type);

        const containerHeight = canvas.parentElement?.clientHeight ?? 400;
        const containerWidth = canvas.parentElement?.clientWidth ?? 48;

        canvas.width = containerWidth;
        canvas.height = Math.max(containerHeight, 50);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colorMap = this.isDark ? DARK_COLOR_MAP : COLOR_MAP;
        const lineH = canvas.height / lineTypes.length;

        lineTypes.forEach((type, i) => {
            const color = colorMap[type];
            if (color === 'transparent') return;
            ctx.fillStyle = color;
            ctx.fillRect(0, i * lineH, canvas.width, Math.max(lineH, 1));
        });
    }

    onMinimapClick(event: MouseEvent): void {
        const canvasRef = this.minimapCanvas();
        if (!canvasRef) return;
        const canvas = canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const ratio = clickY / rect.height;
        this.state.setScrollRatio(Math.max(0, Math.min(1, ratio)));
    }
}
