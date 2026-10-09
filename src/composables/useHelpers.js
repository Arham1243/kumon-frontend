import dayjs from '@/plugins/dayjs';
import { ability } from '@/plugins/ability';
import { useSessionStore } from '@/stores';

const DEFAULT_ADMIN_DISPLAY_TIMEZONE = 'America/New_York';

const formatMap = {
    'mm/dd/yy': 'MM/DD/YYYY',
    'dd/mm/yy': 'DD/MM/YYYY',
    'yy-mm-dd': 'YYYY-MM-DD'
};

export const useHelpers = () => {
    const sessionStore = useSessionStore();

    function adminDisplayTimezone() {
        const companyTz = sessionStore.myCompany?.timezone;
        if (typeof companyTz === 'string' && companyTz.trim() !== '') {
            return companyTz.trim();
        }
        return DEFAULT_ADMIN_DISPLAY_TIMEZONE;
    }

    function resolveMomentDateFormat(format) {
        if (!format) {
            const companyFormat = sessionStore.myCompany?.date_format;
            return formatMap[companyFormat] || 'MM/DD/YYYY';
        }
        return formatMap[format] || format;
    }

    function formatDate(date, format) {
        if (date === 'Invalid date' || !date) return '-';

        const datePart = resolveMomentDateFormat(format);
        return dayjs(date).format(datePart);
    }

    function formatDateTime(date, format) {
        if (date === 'Invalid date' || !date) return '-';

        const datePart = resolveMomentDateFormat(format);
        const pattern = `${datePart} hh:mm A`;
        const tz = adminDisplayTimezone();
        return dayjs.utc(date).tz(tz).format(pattern);
    }

    /** API datetimes in UTC — display without converting to the admin profile timezone. */
    function formatDateTimeUtc(date, format) {
        if (date === 'Invalid date' || !date) return '-';

        const datePart = resolveMomentDateFormat(format);
        const pattern = `${datePart} hh:mm A`;
        return dayjs.utc(date).format(pattern);
    }

    function filterByPermission(items) {
        return items.filter((item) => {
            if (!item.permission) return true;
            return ability.can(item.permission);
        });
    }

    function makeSlugToTitleCase(raw) {
        if (raw == null || String(raw).trim() === '') {
            return '-';
        }
        return String(raw)
            .trim()
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    /** Human-readable duration from seconds (e.g. 2d 3h 15m). */
    function formatDurationSeconds(totalSeconds) {
        if (
            totalSeconds == null ||
            totalSeconds === '' ||
            !Number.isFinite(Number(totalSeconds))
        ) {
            return '-';
        }
        const total = Math.max(0, Math.floor(Number(totalSeconds)));
        if (total === 0) {
            return '0m';
        }
        const days = Math.floor(total / 86400);
        const hours = Math.floor((total % 86400) / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const parts = [];
        if (days > 0) {
            parts.push(`${days}d`);
        }
        if (hours > 0) {
            parts.push(`${hours}h`);
        }
        if (minutes > 0 || parts.length === 0) {
            parts.push(`${minutes}m`);
        }
        return parts.join(' ');
    }

    /** Mailgun ids: `<local@host>` → show `local` only */
    function formatMailgunMessageIdForDisplay(raw) {
        if (raw == null || String(raw).trim() === '') return '-';
        let s = String(raw).trim();
        if (s.startsWith('<')) s = s.slice(1);
        if (s.endsWith('>')) s = s.slice(0, -1);
        s = s.trim();
        const at = s.indexOf('@');
        if (at !== -1) s = s.slice(0, at);
        return s || '-';
    }

    return {
        formatDate,
        formatDateTime,
        formatDateTimeUtc,
        filterByPermission,
        makeSlugToTitleCase,
        formatMailgunMessageIdForDisplay,
        formatDurationSeconds
    };
};
