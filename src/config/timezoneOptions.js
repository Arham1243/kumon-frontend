/**
 * Default IANA zone when a country changes in company setup.
 */
export const PREFERRED_TIMEZONE_BY_COUNTRY_NAME = {
    'United States': 'America/New_York',
    Canada: 'America/Toronto',
    Australia: 'Australia/Sydney',
    Brazil: 'America/Sao_Paulo',
    Mexico: 'America/Mexico_City',
    Indonesia: 'Asia/Jakarta',
    Russia: 'Europe/Moscow',
    Kazakhstan: 'Asia/Almaty',
    'Democratic Republic of the Congo': 'Africa/Kinshasa',
    Mongolia: 'Asia/Ulaanbaatar',
    'United Kingdom': 'Europe/London',
    Spain: 'Europe/Madrid',
    India: 'Asia/Kolkata',
    Pakistan: 'Asia/Karachi',
    'United Arab Emirates': 'Asia/Dubai',
    'Saudi Arabia': 'Asia/Riyadh'
};

export function formatTimezoneOptionLabel(iana) {
    try {
        const d = new Date();
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: iana,
            timeZoneName: 'longOffset'
        });
        const parts = fmt.formatToParts(d);
        const offset =
            parts.find((p) => p.type === 'timeZoneName')?.value?.trim() || '';
        const place = String(iana).replace(/_/g, ' ');
        return offset ? `${offset} - ${place}` : place;
    } catch {
        return String(iana).replace(/_/g, ' ');
    }
}

let cachedOptions;

/**
 * All IANA timezones as SelectField options `{ name, code }`, sorted by label.
 */
export function buildAllTimezoneSelectOptions() {
    if (cachedOptions) {
        return cachedOptions;
    }
    let ids = [];
    try {
        if (
            typeof Intl !== 'undefined' &&
            typeof Intl.supportedValuesOf === 'function'
        ) {
            ids = Intl.supportedValuesOf('timeZone');
        }
    } catch {
        ids = [];
    }
    if (!ids.length) {
        ids = Object.values(PREFERRED_TIMEZONE_BY_COUNTRY_NAME);
    }
    const uniq = [...new Set(ids)].sort((a, b) =>
        formatTimezoneOptionLabel(a).localeCompare(formatTimezoneOptionLabel(b))
    );
    cachedOptions = uniq.map((code) => ({
        code,
        name: formatTimezoneOptionLabel(code)
    }));
    return cachedOptions;
}

/**
 * Full timezone list plus `currentIana` if it is missing (legacy DB values, typos, etc.).
 *
 * @param {string | null | undefined} currentIana
 * @returns {{ name: string, code: string }[]}
 */
export function timezoneSelectOptionsEnsuring(currentIana) {
    const base = buildAllTimezoneSelectOptions();
    const code = typeof currentIana === 'string' ? currentIana.trim() : '';
    if (!code || base.some((o) => o.code === code)) {
        return base;
    }
    return [...base, { code, name: formatTimezoneOptionLabel(code) }].sort(
        (a, b) => a.name.localeCompare(b.name)
    );
}
