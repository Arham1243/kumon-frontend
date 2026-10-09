/** Bullet shown between {@link PageHeaderMeta} segments (override via component prop if needed). */
export const PAGE_HEADER_META_BULLET = '•';

/**
 * @typedef {object} PageHeaderMetaSegment
 * @property {string} text
 * @property {boolean} [nowrap=true]
 */

/**
 * @typedef {object} PageHeaderMetaRow
 * @property {string} [label] — with `value`, renders "Label value"
 * @property {string | number | null | undefined} [value]
 * @property {string} [fallback] — used when `value` is empty (plain row only)
 * @property {string} [text] — plain segment (alternative to label/value)
 * @property {boolean} [nowrap]
 */

/**
 * Build header subtitle segments from a readable list of rows.
 * Empty rows are omitted automatically.
 *
 * @example
 * buildHeaderMeta([
 *   { label: 'Created', value: formatDateTime(record.created_at) },
 *   { value: record.code, fallback: '—' },
 *   { label: 'Assigned to', value: assigneeName },
 * ])
 *
 * @param {Array<string | PageHeaderMetaRow | PageHeaderMetaSegment | null | undefined | false>} rows
 * @returns {PageHeaderMetaSegment[]}
 */
export function buildHeaderMeta(rows) {
    const entries = rows.map((row) => rowToSegment(row));
    return compactSegments(...entries);
}

/** Normalize pre-built segments (used by {@link PageHeaderMeta}). */
export function pageHeaderMetaSegments(...entries) {
    return compactSegments(...entries);
}

/**
 * @param {Array<string | PageHeaderMetaSegment | null | undefined | false>} entries
 * @returns {PageHeaderMetaSegment[]}
 */
function compactSegments(...entries) {
    const list = entries.flat();
    /** @type {PageHeaderMetaSegment[]} */
    const out = [];
    for (const entry of list) {
        const seg = normalizeSegment(entry);
        if (seg) {
            out.push(seg);
        }
    }
    return out;
}

/**
 * @param {string | PageHeaderMetaRow | PageHeaderMetaSegment | null | undefined | false} row
 * @returns {PageHeaderMetaSegment | string | null}
 */
function rowToSegment(row) {
    if (row == null || row === false) {
        return null;
    }
    if (typeof row === 'string') {
        return row;
    }
    if (typeof row.text === 'string' && row.text.trim()) {
        return {
            text: row.text,
            nowrap: row.nowrap !== false
        };
    }
    if (row.label != null && String(row.label).trim() !== '') {
        return labeledSegment(row.label, row.value, row);
    }
    if ('value' in row) {
        return plainSegment(row.value, row.fallback, row);
    }
    return null;
}

/**
 * @param {string | PageHeaderMetaSegment | null | undefined | false} entry
 * @returns {PageHeaderMetaSegment | null}
 */
function normalizeSegment(entry) {
    if (entry == null || entry === false) {
        return null;
    }
    if (typeof entry === 'string') {
        const text = entry.trim();
        if (!text) {
            return null;
        }
        return { text, nowrap: true };
    }
    const text = String(entry.text ?? '').trim();
    if (!text) {
        return null;
    }
    return {
        text: entry.text,
        nowrap: entry.nowrap !== false
    };
}

/**
 * @param {string} label
 * @param {string | number | null | undefined} value
 * @param {{ nowrap?: boolean }} [options]
 * @returns {PageHeaderMetaSegment | null}
 */
function labeledSegment(label, value, options = {}) {
    if (value == null) {
        return null;
    }
    const v = String(value).trim();
    if (!v || v === '-') {
        return null;
    }
    const lbl = String(label ?? '').trim();
    const text = lbl ? `${lbl} ${v}` : v;
    return { text, nowrap: options.nowrap !== false };
}

/**
 * @param {string | number | null | undefined} value
 * @param {string} [fallback]
 * @param {{ nowrap?: boolean }} [options]
 * @returns {PageHeaderMetaSegment | null}
 */
function plainSegment(value, fallback, options = {}) {
    const v = value != null ? String(value).trim() : '';
    if (!v) {
        if (fallback == null || fallback === '') {
            return null;
        }
        return { text: fallback, nowrap: options.nowrap !== false };
    }
    return { text: v, nowrap: options.nowrap !== false };
}
