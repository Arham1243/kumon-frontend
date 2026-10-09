import dayjs from '@/plugins/dayjs';

export const PERIOD_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Custom', value: 'custom' },
    { label: 'Today', value: 'today' },
    { label: 'Current Month', value: 'current_month' },
    { label: 'Current Quarter', value: 'current_quarter' },
    { label: 'Current Half-Year', value: 'current_half_year' },
    { label: 'Current Year', value: 'current_year' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last Quarter', value: 'last_quarter' },
    { label: 'Last Half-Year', value: 'last_half_year' },
    { label: 'Last Year', value: 'last_year' }
];

export function calendarQuarterStart(input) {
    const d = dayjs(input);
    const m = d.month();
    const startM = Math.floor(m / 3) * 3;
    return d.month(startM).date(1).startOf('month');
}

export function calendarQuarterEnd(input) {
    return calendarQuarterStart(input).add(2, 'month').endOf('month');
}

export function lastQuarterRange(now = dayjs()) {
    const qs = calendarQuarterStart(now);
    const prevEnd = qs.subtract(1, 'day');
    const prevStart = calendarQuarterStart(prevEnd);
    return [prevStart.format('YYYY-MM-DD'), prevEnd.format('YYYY-MM-DD')];
}

export function rangeForPreset(preset, currentRange = null) {
    const now = dayjs();
    if (preset === 'all') {
        return [null, null];
    }
    if (preset === 'custom') {
        return currentRange?.length === 2
            ? [currentRange[0], currentRange[1]]
            : [null, null];
    }
    if (preset === 'today') {
        const t = now.format('YYYY-MM-DD');
        return [t, t];
    }
    if (preset === 'current_month') {
        return [
            now.startOf('month').format('YYYY-MM-DD'),
            now.endOf('month').format('YYYY-MM-DD')
        ];
    }
    if (preset === 'current_quarter') {
        const a = calendarQuarterStart(now);
        const b = calendarQuarterEnd(now);
        return [a.format('YYYY-MM-DD'), b.format('YYYY-MM-DD')];
    }
    if (preset === 'last_quarter') {
        return lastQuarterRange(now);
    }
    if (preset === 'current_half_year') {
        const y = now.year();
        if (now.month() < 6) {
            return [
                dayjs(`${y}-01-01`).format('YYYY-MM-DD'),
                dayjs(`${y}-06-30`).format('YYYY-MM-DD')
            ];
        }
        return [
            dayjs(`${y}-07-01`).format('YYYY-MM-DD'),
            dayjs(`${y}-12-31`).format('YYYY-MM-DD')
        ];
    }
    if (preset === 'last_half_year') {
        const y = now.year();
        if (now.month() < 6) {
            return [
                dayjs(`${y - 1}-07-01`).format('YYYY-MM-DD'),
                dayjs(`${y - 1}-12-31`).format('YYYY-MM-DD')
            ];
        }
        return [
            dayjs(`${y}-01-01`).format('YYYY-MM-DD'),
            dayjs(`${y}-06-30`).format('YYYY-MM-DD')
        ];
    }
    if (preset === 'current_year') {
        return [
            now.startOf('year').format('YYYY-MM-DD'),
            now.endOf('year').format('YYYY-MM-DD')
        ];
    }
    if (preset === 'last_month') {
        const lm = now.subtract(1, 'month');
        return [
            lm.startOf('month').format('YYYY-MM-DD'),
            lm.endOf('month').format('YYYY-MM-DD')
        ];
    }
    if (preset === 'last_year') {
        const ly = now.subtract(1, 'year');
        return [
            ly.startOf('year').format('YYYY-MM-DD'),
            ly.endOf('year').format('YYYY-MM-DD')
        ];
    }
    return [null, null];
}

export function isCompleteDateRange(range) {
    if (!Array.isArray(range) || range.length !== 2) {
        return false;
    }
    return Boolean(range[0] && range[1]);
}

export function normalizeDateRange(range) {
    const r = rangeForPreset('custom', range);
    return r[0] && r[1] ? [r[0], r[1]] : [null, null];
}

export function areDateRangesEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
    }
    return a[0] === b[0] && a[1] === b[1];
}

export function dateRangeMatchesPreset(range, preset) {
    if (preset === 'custom') {
        return true;
    }
    return areDateRangesEqual(
        normalizeDateRange(range),
        normalizeDateRange(rangeForPreset(preset, range))
    );
}
