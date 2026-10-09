import dayjs from '@/plugins/dayjs';
import relativeTime from 'dayjs/esm/plugin/relativeTime/index.js';
import updateLocale from 'dayjs/esm/plugin/updateLocale/index.js';

let extended = false;
const ensureExtended = () => {
    if (!extended) {
        dayjs.extend(updateLocale);
        dayjs.extend(relativeTime);
        dayjs.updateLocale('en', {
            relativeTime: {
                future: 'in %s',
                past: '%s ago',
                s: '%d seconds',
                m: '1 minute',
                mm: '%d minutes',
                h: '1 hour',
                hh: '%d hours',
                d: '1 day',
                dd: '%d days',
                M: '1 month',
                MM: '%d months',
                y: '1 year',
                yy: '%d years'
            }
        });
        extended = true;
    }
};

export function useRelativeTime() {
    ensureExtended();

    const fromNow = (value) => {
        if (!value) return '';
        const d = dayjs.utc(value);
        return d.isValid() ? d.fromNow() : '';
    };

    const format = (value, fmt = 'MMM D, YYYY h:mm A') => {
        if (!value) return '';
        const d = dayjs.utc(value);
        return d.isValid() ? d.format(fmt) : '';
    };

    return { fromNow, format };
}
