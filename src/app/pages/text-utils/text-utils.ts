import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { TextFileService } from '@/app/shared/services/text-file.service';
import { calculateTextMetrics } from '@/app/shared/utils/text-metrics';
import { TextUtilsService } from './text-utils.service';

@Component({
    selector: 'app-text-utils',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './text-utils.html',
    styleUrl: './text-utils.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextUtils {
    readonly inputText = signal('alpha\nbeta\nbeta\nGamma Line\n\n  padded text');
    readonly outputText = signal('');

    readonly inputMetrics = computed(() => calculateTextMetrics(this.inputText()));
    readonly outputMetrics = computed(() => calculateTextMetrics(this.outputText()));
    readonly shellStats = computed(() => [
        { icon: 'pi pi-align-left', label: `${this.inputMetrics().lines} source lines` },
        { icon: 'pi pi-hashtag', label: `${this.inputMetrics().words} words` },
        { icon: 'pi pi-bolt', label: 'Single-click text transforms' }
    ]);

    constructor(
        private textUtilsService: TextUtilsService,
        private clipboardService: ClipboardService,
        private textFileService: TextFileService,
        private messageService: MessageService
    ) {
        this.outputText.set(this.inputText());
    }

    async copyOutput() {
        const copied = await this.clipboardService.copyText(this.outputText());
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? 'Output copied to clipboard.' : 'Clipboard access is unavailable in this context.'
        });
    }

    async importFile(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        const content = await this.textFileService.readText(file);
        this.inputText.set(content);
        this.outputText.set(content);
    }

    downloadOutput() {
        const ok = this.textFileService.downloadText('text-utils-output.txt', this.outputText());
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Output downloaded.' : 'File download is unavailable in this context.'
        });
    }

    apply(transform: 'upper' | 'lower' | 'title' | 'trim' | 'dedupe' | 'sort-asc' | 'sort-desc' | 'blank' | 'slugify') {
        const value = this.inputText();
        const nextValue =
            transform === 'upper'
                ? this.textUtilsService.toUpperCase(value)
                : transform === 'lower'
                  ? this.textUtilsService.toLowerCase(value)
                  : transform === 'title'
                    ? this.textUtilsService.toTitleCase(value)
                    : transform === 'trim'
                      ? this.textUtilsService.trimLines(value)
                      : transform === 'dedupe'
                        ? this.textUtilsService.dedupeLines(value)
                        : transform === 'sort-asc'
                          ? this.textUtilsService.sortLines(value)
                          : transform === 'sort-desc'
                            ? this.textUtilsService.sortLines(value, 'desc')
                            : transform === 'blank'
                              ? this.textUtilsService.removeBlankLines(value)
                              : this.textUtilsService.slugify(value);

        this.outputText.set(nextValue);
    }

    reset() {
        this.outputText.set(this.inputText());
    }

    useOutputAsInput() {
        this.inputText.set(this.outputText());
    }
}
