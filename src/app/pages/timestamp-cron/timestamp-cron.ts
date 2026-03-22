import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolPageShell } from '@/app/shared/components/tool-page-shell/tool-page-shell';
import { BrowserService } from '@/app/shared/services/browser.service';
import { ClipboardService } from '@/app/shared/services/clipboard.service';
import { TimestampCronService, TimestampSnapshot, TimezonePreview } from './timestamp-cron.service';

type TimestampCronTab = 'timestamp' | 'cron';

@Component({
    selector: 'app-timestamp-cron',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, ToolPageShell],
    providers: [MessageService],
    templateUrl: './timestamp-cron.html',
    styleUrl: './timestamp-cron.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimestampCron {
    readonly tabs: Array<{ key: TimestampCronTab; label: string }> = [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'cron', label: 'Cron' }
    ];

    readonly activeTab = signal<TimestampCronTab>('timestamp');
    readonly timezones = ['UTC', 'Asia/Bangkok', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].map((value) => ({ label: value, value }));

    readonly timestampInput = signal('1704067200');
    readonly dateInput = signal('2026-03-22T09:00');
    readonly timestampSnapshot = signal<TimestampSnapshot | null>(null);
    readonly timezonePreviews = signal<TimezonePreview[]>([]);
    readonly timestampError = signal('');

    readonly cronExpression = signal('0 9 * * 1-5');
    readonly cronTimezone = signal('UTC');
    readonly cronDescription = signal('');
    readonly cronRuns = signal<string[]>([]);
    readonly cronError = signal('');

    readonly shellStats = [
        { icon: 'pi pi-clock', label: 'Epoch seconds and milliseconds' },
        { icon: 'pi pi-globe', label: 'Timezone preview cards' },
        { icon: 'pi pi-calendar', label: 'Cron explanation and next runs' }
    ];

    constructor(
        private browserService: BrowserService,
        private clipboardService: ClipboardService,
        private messageService: MessageService,
        private timestampCronService: TimestampCronService
    ) {
        this.analyzeTimestamp();
        this.explainCron();
    }

    setTab(tab: TimestampCronTab) {
        this.activeTab.set(tab);
    }

    analyzeDate() {
        try {
            const snapshot = this.timestampCronService.fromDateInput(this.dateInput());
            this.timestampSnapshot.set(snapshot);
            this.timezonePreviews.set(this.timestampCronService.getTimezonePreviews(new Date(snapshot.iso)));
            this.timestampError.set('');
        } catch (error) {
            this.timestampError.set(error instanceof Error ? error.message : 'Failed to interpret date.');
        }
    }

    analyzeTimestamp() {
        try {
            const snapshot = this.timestampCronService.fromTimestamp(this.timestampInput());
            this.timestampSnapshot.set(snapshot);
            this.timezonePreviews.set(this.timestampCronService.getTimezonePreviews(new Date(snapshot.iso)));
            this.timestampError.set('');
        } catch (error) {
            this.timestampError.set(error instanceof Error ? error.message : 'Failed to interpret timestamp.');
        }
    }

    async copyIso() {
        const iso = this.timestampSnapshot()?.iso;
        if (!iso) {
            return;
        }

        const copied = await this.clipboardService.copyText(iso);
        this.messageService.add({
            severity: copied ? 'success' : 'warn',
            summary: copied ? 'Copied' : 'Unavailable',
            detail: copied ? 'ISO timestamp copied.' : 'Clipboard access is unavailable in this context.'
        });
    }

    explainCron() {
        try {
            this.cronDescription.set(this.timestampCronService.describeCron(this.cronExpression()));
            this.cronRuns.set(this.timestampCronService.getNextRuns(this.cronExpression(), this.cronTimezone()));
            this.cronError.set('');
        } catch (error) {
            this.cronError.set(error instanceof Error ? error.message : 'Failed to parse cron expression.');
            this.cronRuns.set([]);
        }
    }

    useNow() {
        if (!this.browserService.isBrowser) {
            return;
        }

        const now = new Date();
        this.timestampInput.set(String(Math.floor(now.getTime() / 1000)));
        this.dateInput.set(now.toISOString().slice(0, 16));
        this.analyzeTimestamp();
    }
}
