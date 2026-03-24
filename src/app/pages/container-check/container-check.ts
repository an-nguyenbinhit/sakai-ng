import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { TextFileService } from '@/app/shared/services/text-file.service';
import { calculateTextMetrics } from '@/app/shared/utils/text-metrics';
import { BatchRowResult, BatchValidationResult, ContainerCheckService, ContainerValidationResult, GeneratedContainerKind, SampleCase, ValidationIssue } from './container-check.service';

const MAX_BATCH_PREVIEW_ROWS = 150;

@Component({
    selector: 'app-container-check',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './container-check.html',
    styleUrl: './container-check.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContainerCheck {
    readonly samples: SampleCase[];
    readonly singleInput;
    readonly calculatorBaseInput;
    readonly batchInput;
    readonly randomCount;
    readonly activeSampleLabel;
    readonly singleResult;
    readonly batchResult;
    readonly normalizedPreview;
    readonly calculatorPreview;
    readonly calculatorWeightedSteps;
    readonly calculatorResult;
    readonly visibleBatchRows;
    readonly batchMetrics;
    readonly shellStats;

    constructor(
        private containerCheckService: ContainerCheckService,
        private clipboardService: ClipboardService,
        private textFileService: TextFileService,
        private messageService: MessageService
    ) {
        this.samples = this.containerCheckService.samples;
        this.singleInput = signal(this.samples[0].input);
        this.calculatorBaseInput = signal(this.samples[0].input.slice(0, 10));
        this.batchInput = signal(this.buildDefaultBatchInput(this.samples));
        this.randomCount = signal(12);
        this.activeSampleLabel = signal(this.samples[0].label);
        this.singleResult = signal<ContainerValidationResult>(this.containerCheckService.validate(this.samples[0].input));
        this.batchResult = signal<BatchValidationResult>(this.containerCheckService.validateBatch(this.batchInput()));
        this.normalizedPreview = computed(() => this.containerCheckService.normalize(this.singleInput()));
        this.calculatorPreview = computed(() => this.containerCheckService.normalize(this.calculatorBaseInput()));
        this.calculatorWeightedSteps = computed(() => this.containerCheckService.getWeightedSteps(this.calculatorBaseInput()));
        this.calculatorResult = computed(() => {
            const normalized = this.containerCheckService.normalize(this.calculatorBaseInput());

            if (!normalized) {
                return { fullCode: '', checkDigit: null as number | null, error: 'Enter owner code, equipment category, and six serial digits.' };
            }

            if (!/^[A-Z]{4}\d{6}$/.test(normalized)) {
                return { fullCode: '', checkDigit: null as number | null, error: 'Calculator input must normalize to 4 letters and 6 digits.' };
            }

            const checkDigit = this.containerCheckService.calculateCheckDigit(normalized);
            return {
                fullCode: `${normalized}${checkDigit}`,
                checkDigit,
                error: ''
            };
        });
        this.visibleBatchRows = computed(() => this.batchResult().rows.slice(0, MAX_BATCH_PREVIEW_ROWS));
        this.batchMetrics = computed(() => calculateTextMetrics(this.batchInput()));
        this.shellStats = computed(() => [
            { icon: 'pi pi-check-circle', label: `${this.batchResult().validCount} valid rows in current batch` },
            { icon: 'pi pi-calculator', label: 'ISO 6346 check digit trace included' },
            { icon: 'pi pi-desktop', label: 'Offline validation with OCR-friendly hints' }
        ]);
    }

    runSingleValidation() {
        this.singleResult.set(this.containerCheckService.validate(this.singleInput()));
    }

    runBatchValidation() {
        this.batchResult.set(this.containerCheckService.validateBatch(this.batchInput()));
    }

    onSingleInputChange(value: string) {
        this.singleInput.set(value);
        this.runSingleValidation();
    }

    onCalculatorInputChange(value: string) {
        this.calculatorBaseInput.set(value);
    }

    onBatchInputChange(value: string) {
        this.batchInput.set(value);
        this.runBatchValidation();
    }

    onRandomCountChange(value: string) {
        const parsed = Number(value);
        this.randomCount.set(Number.isFinite(parsed) ? parsed : 1);
    }

    loadSample(sample: SampleCase) {
        this.activeSampleLabel.set(sample.label);
        this.singleInput.set(sample.input);
        this.runSingleValidation();
        this.calculatorBaseInput.set(this.containerCheckService.normalize(sample.input).slice(0, 10));
    }

    async copySingleContainer() {
        const normalized = this.singleResult().normalizedInput;
        if (!normalized) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unavailable',
                detail: 'No normalized container number is available yet.'
            });
            return;
        }

        await this.copyTextWithToast(normalized, 'Container number copied.', 'Unable to copy container number.');
    }

    async copySingleResult() {
        const result = this.singleResult();
        const payload = [
            `Input: ${this.singleInput()}`,
            `Normalized: ${result.normalizedInput || '(empty)'}`,
            `Status: ${result.isValid ? 'VALID' : 'INVALID'}`,
            `Expected check digit: ${result.expectedCheckDigit ?? 'n/a'}`,
            `Issues: ${result.issues.length ? result.issues.map((issue) => `[${issue.severity}] ${issue.message}`).join(' | ') : 'None'}`
        ].join('\n');

        await this.copyTextWithToast(payload, 'Validation result copied.', 'Unable to copy validation result.');
    }

    async copyCalculatorResult() {
        const result = this.calculatorResult();
        if (!result.fullCode) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unavailable',
                detail: result.error || 'No calculated code is available yet.'
            });
            return;
        }

        await this.copyTextWithToast(result.fullCode, 'Calculated container number copied.', 'Unable to copy calculated code.');
    }

    async copyBatchRow(row: BatchRowResult) {
        const value = row.normalized || row.raw;
        await this.copyTextWithToast(value, 'Container number copied.', 'Unable to copy container number.');
    }

    async copySample(sample: SampleCase) {
        await this.copyTextWithToast(this.containerCheckService.normalize(sample.input), 'Sample container copied.', 'Unable to copy sample container.');
    }

    async copyBatch(kind: 'valid' | 'invalid') {
        const rows = this.batchResult().rows.filter((row) => row.isValid === (kind === 'valid'));
        const text = rows.map((row) => row.normalized || row.raw).join('\n');

        if (!text) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unavailable',
                detail: `No ${kind} rows are available in the current batch.`
            });
            return;
        }

        await this.copyTextWithToast(text, `${kind === 'valid' ? 'Valid' : 'Invalid'} rows copied.`, `Unable to copy ${kind} rows.`);
    }

    downloadBatchCsv() {
        const result = this.batchResult();
        if (!result.rows.length) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unavailable',
                detail: 'Run batch validation before exporting CSV.'
            });
            return;
        }

        const ok = this.textFileService.downloadText('container-check-batch.csv', this.buildBatchCsv(result.rows), 'text/csv;charset=utf-8');
        this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: ok ? 'Downloaded' : 'Unavailable',
            detail: ok ? 'Batch validation CSV downloaded.' : 'File download is unavailable in this context.'
        });
    }

    issueTone(issue: ValidationIssue): string {
        switch (issue.severity) {
            case 'error':
                return 'issue-chip--error';
            case 'warning':
                return 'issue-chip--warning';
            default:
                return 'issue-chip--info';
        }
    }

    trackBySample(_: number, sample: SampleCase) {
        return sample.label;
    }

    trackByBatchRow(_: number, row: BatchRowResult) {
        return `${row.raw}-${row.normalized}`;
    }

    isInvalidSample(sample: SampleCase): boolean {
        return !this.containerCheckService.validate(sample.input).isValid;
    }

    generateBatch(kind: GeneratedContainerKind) {
        const rows = this.containerCheckService.generateRandomList(this.randomCount(), kind);
        this.batchInput.set(rows.join('\n'));
        this.runBatchValidation();
        this.messageService.add({
            severity: 'success',
            summary: 'Generated',
            detail:
                kind === 'valid'
                    ? `Generated ${rows.length} valid container numbers.`
                    : kind === 'invalid'
                      ? `Generated ${rows.length} invalid container numbers.`
                      : `Generated ${rows.length} mixed container numbers.`
        });
    }

    private buildDefaultBatchInput(samples: SampleCase[]): string {
        return samples.slice(0, 6).map((sample) => sample.input).join('\n');
    }

    private buildBatchCsv(rows: BatchRowResult[]): string {
        const header = ['raw', 'normalized', 'isValid', 'expectedCheckDigit', 'actualCheckDigit', 'summary'];
        const lines = rows.map((row) =>
            [row.raw, row.normalized, String(row.isValid), row.expectedCheckDigit ?? '', row.actualCheckDigit ?? '', row.summary]
                .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                .join(',')
        );

        return [header.join(','), ...lines].join('\n');
    }

    private async copyTextWithToast(text: string, successDetail: string, failDetail: string) {
        const copied = await this.clipboardService.copyText(text);
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? successDetail : failDetail
        });
    }
}
