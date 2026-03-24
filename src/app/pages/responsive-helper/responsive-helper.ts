import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { BreakpointPreset, ResponsiveHelperService } from './responsive-helper.service';

type SnippetTab = 'css' | 'scss' | 'tailwind';

@Component({
    selector: 'app-responsive-helper',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './responsive-helper.html',
    styleUrl: './responsive-helper.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveHelper {
    private readonly clipboardService = inject(ClipboardService);
    private readonly messageService = inject(MessageService);
    private readonly responsiveHelperService = inject(ResponsiveHelperService);

    readonly presets = this.responsiveHelperService.presets;
    readonly snippetTabs: Array<{ key: SnippetTab; label: string }> = [
        { key: 'css', label: 'CSS' },
        { key: 'scss', label: 'SCSS' },
        { key: 'tailwind', label: 'Tailwind' }
    ];

    readonly selectedPresetId = signal(this.presets[0].id);
    readonly viewportWidth = signal(1024);
    readonly viewportHeight = signal(768);
    readonly selectorInput = signal('.responsive-shell');
    readonly activeSnippetTab = signal<SnippetTab>('css');

    readonly selectedPreset = computed<BreakpointPreset>(() => this.responsiveHelperService.getPreset(this.selectedPresetId()));
    readonly viewportAnalysis = computed(() => this.responsiveHelperService.analyzeViewport(this.selectedPresetId(), this.viewportWidth(), this.viewportHeight()));
    readonly snippets = computed(() => this.responsiveHelperService.generateSnippets(this.selectedPresetId(), this.selectorInput()));

    readonly shellStats = computed(() => [
        { icon: 'pi pi-mobile', label: `${this.presets.length} preset libraries` },
        { icon: 'pi pi-window-maximize', label: `${this.viewportAnalysis().activeBreakpoint.label} active breakpoint` },
        { icon: 'pi pi-code', label: 'CSS, SCSS, Tailwind snippets' }
    ]);

    setPreset(presetId: string) {
        this.selectedPresetId.set(presetId);
    }

    setSnippetTab(tab: SnippetTab) {
        this.activeSnippetTab.set(tab);
    }

    updateViewportWidth(value: string) {
        this.viewportWidth.set(this.parseNumber(value, 1024));
    }

    updateViewportHeight(value: string) {
        this.viewportHeight.set(this.parseNumber(value, 768));
    }

    async copyText(value: string, detail: string) {
        const copied = await this.clipboardService.copyText(value);
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? detail : 'Clipboard access is unavailable in this context.'
        });
    }

    getBreakpointRangeLabel(minWidth: number, maxWidth: number | null): string {
        return maxWidth === null ? `${minWidth}px+` : `${minWidth}px - ${maxWidth}px`;
    }

    isBreakpointActive(minWidth: number, maxWidth: number | null): boolean {
        const width = this.viewportAnalysis().width;
        return maxWidth === null ? width >= minWidth : width >= minWidth && width <= maxWidth;
    }

    currentSnippet(): string {
        const snippets = this.snippets();

        switch (this.activeSnippetTab()) {
            case 'scss':
                return snippets.scss;
            case 'tailwind':
                return snippets.tailwind;
            default:
                return snippets.css;
        }
    }

    private parseNumber(value: string, fallback: number): number {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
}
