import { Component, inject, effect, viewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileCompareState } from '../../services/file-compare-state.service';
import { DiffLineType } from '../../models/diff.models';

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
    template: `
        <div class="relative flex flex-col h-full">
            <div class="text-xs text-center text-surface-400 py-1 select-none">Map</div>
            <div class="relative flex-1 cursor-pointer" (click)="onMinimapClick($event)">
                <canvas
                    #minimapCanvas
                    class="w-full h-full block rounded-sm border border-surface-200 dark:border-surface-700"
                    aria-label="Diff overview minimap. Click to navigate."
                    role="button"
                    tabindex="0"
                ></canvas>
                <!-- Viewport indicator -->
                <div
                    class="absolute left-0 right-0 bg-primary/20 border border-primary/40 pointer-events-none transition-all duration-100"
                    [style.top.%]="indicatorTop() * 100"
                    [style.height.%]="indicatorHeight() * 100"
                ></div>
            </div>
        </div>
    `
})
export class DiffMinimap {
    private state = inject(FileCompareState);

    minimapCanvas = viewChild<ElementRef<HTMLCanvasElement>>('minimapCanvas');

    indicatorTop = computed(() => this.state.scrollRatio());
    indicatorHeight = computed(() => {
        const result = this.state.diffResult();
        if (!result) return 1;
        // Estimate based on viewport vs total lines
        const totalLines = result.inlineRows.length || 1;
        const visibleLines = Math.min(40, totalLines); // approx
        return Math.min(1, visibleLines / totalLines);
    });

    private isDark = false;

    constructor() {
        this.isDark = document.documentElement.classList.contains('app-dark');

        effect(() => {
            const result = this.state.diffResult();
            if (result) {
                // Use setTimeout to ensure canvas is in DOM
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

        const lines = result.inlineRows;
        const containerHeight = canvas.parentElement?.clientHeight ?? 400;
        const containerWidth = canvas.parentElement?.clientWidth ?? 48;

        canvas.width = containerWidth;
        canvas.height = Math.max(containerHeight, 50);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colorMap = this.isDark ? DARK_COLOR_MAP : COLOR_MAP;
        const lineH = canvas.height / lines.length;

        lines.forEach((line, i) => {
            const color = colorMap[line.type];
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
