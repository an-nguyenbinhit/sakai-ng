import { TimestampCronService } from './timestamp-cron.service';

describe('TimestampCronService', () => {
    let service: TimestampCronService;

    beforeEach(() => {
        service = new TimestampCronService();
    });

    it('builds a timestamp snapshot from unix seconds', () => {
        const result = service.fromTimestamp('1704067200');
        expect(result.unixMilliseconds).toBe(1704067200000);
        expect(result.iso).toContain('2024-01-01T00:00:00.000Z');
    });

    it('describes a cron expression in plain language', () => {
        expect(service.describeCron('*/15 * * * *')).toContain('15');
    });

    it('returns next cron runs', () => {
        const runs = service.getNextRuns('0 9 * * 1-5', 'UTC', 2);
        expect(runs.length).toBe(2);
    });
}
