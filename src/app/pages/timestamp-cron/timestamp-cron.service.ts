import { Injectable } from '@angular/core';
import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export interface TimestampSnapshot {
    iso: string;
    unixSeconds: number;
    unixMilliseconds: number;
    local: string;
}

export interface TimezonePreview {
    timezone: string;
    value: string;
}

@Injectable({ providedIn: 'root' })
export class TimestampCronService {
    readonly timezones = ['UTC', 'Asia/Bangkok', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

    fromTimestamp(input: string): TimestampSnapshot {
        const trimmed = input.trim();
        if (!trimmed) {
            throw new Error('Enter a timestamp value first.');
        }

        const numeric = Number(trimmed);
        if (Number.isNaN(numeric)) {
            throw new Error('Timestamp must be a valid number.');
        }

        const milliseconds = trimmed.length <= 10 ? numeric * 1000 : numeric;
        return this.buildSnapshot(new Date(milliseconds));
    }

    fromDateInput(input: string): TimestampSnapshot {
        if (!input) {
            throw new Error('Choose a date and time first.');
        }
        return this.buildSnapshot(new Date(input));
    }

    getTimezonePreviews(date: Date): TimezonePreview[] {
        return this.timezones.map((timezone) => ({
            timezone,
            value: new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'long',
                timeZone: timezone
            }).format(date)
        }));
    }

    describeCron(expression: string) {
        const trimmed = expression.trim();
        if (!trimmed) {
            throw new Error('Enter a cron expression first.');
        }

        return cronstrue.toString(trimmed, { throwExceptionOnParseError: true });
    }

    getNextRuns(expression: string, timezone: string, count = 5): string[] {
        const interval = CronExpressionParser.parse(expression.trim(), { tz: timezone, currentDate: new Date() });
        return interval.take(count).map((value) => value.toDate().toISOString());
    }

    private buildSnapshot(date: Date): TimestampSnapshot {
        if (Number.isNaN(date.getTime())) {
            throw new Error('Date value is invalid.');
        }

        return {
            iso: date.toISOString(),
            unixSeconds: Math.floor(date.getTime() / 1000),
            unixMilliseconds: date.getTime(),
            local: new Intl.DateTimeFormat(undefined, {
                dateStyle: 'full',
                timeStyle: 'long'
            }).format(date)
        };
    }
}
