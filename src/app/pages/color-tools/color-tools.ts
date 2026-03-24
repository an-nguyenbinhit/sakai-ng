import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { ColorInspection, ColorToolsService } from './color-tools.service';

type ColorToolsTab = 'converter' | 'gradient' | 'contrast';

@Component({
    selector: 'app-color-tools',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './color-tools.html',
    styleUrl: './color-tools.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorTools {
    readonly tabs: Array<{ key: ColorToolsTab; label: string }> = [
        { key: 'converter', label: 'Color Converter' },
        { key: 'gradient', label: 'Gradient Builder' },
        { key: 'contrast', label: 'Contrast Checker' }
    ];

    readonly activeTab = signal<ColorToolsTab>('converter');
    readonly autoApply = signal(true);

    readonly converterInput = signal('#3b82f6');
    readonly converterColor = signal('#3b82f6');
    readonly converterError = signal('');

    readonly gradientStartInput = signal('#0f172a');
    readonly gradientStartColor = signal('#0f172a');
    readonly gradientEndInput = signal('#38bdf8');
    readonly gradientEndColor = signal('#38bdf8');
    readonly gradientAngle = signal(135);
    readonly gradientSteps = signal(5);
    readonly gradientError = signal('');

    readonly contrastForegroundInput = signal('#0f172a');
    readonly contrastForeground = signal('#0f172a');
    readonly contrastBackgroundInput = signal('#f8fafc');
    readonly contrastBackground = signal('#f8fafc');
    readonly contrastError = signal('');

    readonly shellStats = computed(() => [
        { icon: 'pi pi-palette', label: this.converterValue().hex },
        { icon: 'pi pi-sliders-h', label: `${this.gradientValue().stops.length} gradient stops` },
        { icon: 'pi pi-check-circle', label: `${this.contrastValue().ratio.toFixed(2)}:1 contrast ratio` }
    ]);

    readonly converterValue = computed<ColorInspection>(() => this.colorToolsService.inspectColor(this.converterColor()));
    readonly gradientValue = computed(() =>
        this.colorToolsService.buildLinearGradient(this.gradientStartColor(), this.gradientEndColor(), this.gradientAngle(), this.gradientSteps())
    );
    readonly contrastValue = computed(() => this.colorToolsService.getContrastRatio(this.contrastForeground(), this.contrastBackground()));

    constructor(
        private clipboardService: ClipboardService,
        private colorToolsService: ColorToolsService,
        private messageService: MessageService
    ) {}

    setTab(tab: ColorToolsTab) {
        this.activeTab.set(tab);
    }

    setAutoApply(value: boolean) {
        this.autoApply.set(value);

        if (value) {
            this.applyAllValidInputs();
        }
    }

    onConverterInputChange(value: string) {
        this.converterInput.set(value);
        this.tryAutoApply(value, this.converterColor, this.converterInput, this.converterError);
    }

    onGradientStartInputChange(value: string) {
        this.gradientStartInput.set(value);
        this.tryAutoApply(value, this.gradientStartColor, this.gradientStartInput, this.gradientError);
    }

    onGradientEndInputChange(value: string) {
        this.gradientEndInput.set(value);
        this.tryAutoApply(value, this.gradientEndColor, this.gradientEndInput, this.gradientError);
    }

    onContrastForegroundInputChange(value: string) {
        this.contrastForegroundInput.set(value);
        this.tryAutoApply(value, this.contrastForeground, this.contrastForegroundInput, this.contrastError);
    }

    onContrastBackgroundInputChange(value: string) {
        this.contrastBackgroundInput.set(value);
        this.tryAutoApply(value, this.contrastBackground, this.contrastBackgroundInput, this.contrastError);
    }

    applyConverterColor() {
        this.applyHexValue(this.converterInput(), this.converterColor, this.converterInput, this.converterError);
    }

    applyGradientStartColor() {
        this.applyHexValue(this.gradientStartInput(), this.gradientStartColor, this.gradientStartInput, this.gradientError);
    }

    applyGradientEndColor() {
        this.applyHexValue(this.gradientEndInput(), this.gradientEndColor, this.gradientEndInput, this.gradientError);
    }

    applyContrastForeground() {
        this.applyHexValue(this.contrastForegroundInput(), this.contrastForeground, this.contrastForegroundInput, this.contrastError);
    }

    applyContrastBackground() {
        this.applyHexValue(this.contrastBackgroundInput(), this.contrastBackground, this.contrastBackgroundInput, this.contrastError);
    }

    async copyValue(value: string, successDetail: string) {
        const copied = await this.clipboardService.copyText(value);
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? successDetail : 'Clipboard access is unavailable in this context.'
        });
    }

    updateGradientAngle(value: string) {
        this.gradientAngle.set(Number(value));
    }

    updateGradientSteps(value: string) {
        this.gradientSteps.set(Number(value));
    }

    trackStop(_: number, stop: { color: string; position: number }) {
        return `${stop.color}-${stop.position}`;
    }

    private applyHexValue(input: string, valueSignal: { set(value: string): void }, inputSignal: { set(value: string): void }, errorSignal: { set(value: string): void }) {
        try {
            const normalized = this.colorToolsService.normalizeHex(input);
            valueSignal.set(normalized);
            inputSignal.set(normalized);
            errorSignal.set('');
        } catch (error) {
            errorSignal.set(error instanceof Error ? error.message : 'Invalid HEX color.');
        }
    }

    private tryAutoApply(input: string, valueSignal: { set(value: string): void }, inputSignal: { set(value: string): void }, errorSignal: { set(value: string): void }) {
        if (!this.autoApply()) {
            return;
        }

        try {
            const normalized = this.colorToolsService.normalizeHex(input);
            valueSignal.set(normalized);
            inputSignal.set(normalized);
            errorSignal.set('');
        } catch {
            // Ignore partial invalid input while auto-apply is enabled.
        }
    }

    private applyAllValidInputs() {
        this.tryAutoApply(this.converterInput(), this.converterColor, this.converterInput, this.converterError);
        this.tryAutoApply(this.gradientStartInput(), this.gradientStartColor, this.gradientStartInput, this.gradientError);
        this.tryAutoApply(this.gradientEndInput(), this.gradientEndColor, this.gradientEndInput, this.gradientError);
        this.tryAutoApply(this.contrastForegroundInput(), this.contrastForeground, this.contrastForegroundInput, this.contrastError);
        this.tryAutoApply(this.contrastBackgroundInput(), this.contrastBackground, this.contrastBackgroundInput, this.contrastError);
    }
}
