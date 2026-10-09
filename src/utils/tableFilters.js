import { FilterMatchMode } from '@primevue/core/api';
import {
    ACTIVE_INACTIVE_BOOLEAN_OPTIONS,
    ACTIVE_INACTIVE_NUMERIC_OPTIONS,
    SCHEDULED_JOB_LAST_RUN_STATUS_OPTIONS,
    USER_ACCOUNT_STATUS_OPTIONS
} from '@/config/enums';

const DEFAULT_MATCH_MODES = {
    text: FilterMatchMode.CONTAINS,
    select: FilterMatchMode.EQUALS,
    boolean: FilterMatchMode.EQUALS,
    number: FilterMatchMode.EQUALS
};

const DEFAULT_OPERATORS = {
    text: 'like',
    select: '=',
    boolean: '=',
    number: '='
};

export function resolveFilterField(field, fieldAliases = {}) {
    return fieldAliases[field] ?? field;
}

export const ACTIVE_STATUS_VALUE = 1;

export function getDefaultFilterValue(column) {
    if (!column?.filter) {
        return null;
    }

    if (column.filter.defaultValue !== undefined) {
        return column.filter.defaultValue;
    }

    if (column.filter.defaultActive === false) {
        return null;
    }

    if (column.filter.type === 'select') {
        const hasActiveInactiveOptions = column.filter.options?.some(
            (option) => option.value === ACTIVE_STATUS_VALUE
        );

        if (hasActiveInactiveOptions) {
            return ACTIVE_STATUS_VALUE;
        }

        const USER_ACTIVE_STATUS_VALUE = 'active';
        const hasUserStatusOptions = column.filter.options?.some(
            (option) => option.value === USER_ACTIVE_STATUS_VALUE
        );

        if (hasUserStatusOptions) {
            return USER_ACTIVE_STATUS_VALUE;
        }
    }

    return null;
}

export function buildPrimeFilters(columnConfigs = []) {
    const filters = {};

    for (const column of columnConfigs) {
        if (!column?.filter || !column.field) {
            continue;
        }

        const matchMode =
            column.filter.matchMode ??
            DEFAULT_MATCH_MODES[column.filter.type] ??
            FilterMatchMode.CONTAINS;

        filters[column.field] = {
            value: getDefaultFilterValue(column),
            matchMode
        };
    }

    return filters;
}

function isEmptyFilterValue(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }

    if (Array.isArray(value) && value.length === 0) {
        return true;
    }

    return false;
}

function formatFilterValue(value, filterType, operator) {
    if (
        filterType === 'text' &&
        (operator === 'like' || operator === 'ilike')
    ) {
        return `%${value}%`;
    }

    return value;
}

export function primeFiltersToOrion(
    primeFilters = {},
    columnConfigs = [],
    fieldAliases = {}
) {
    const columnMap = Object.fromEntries(
        columnConfigs.filter((col) => col?.field).map((col) => [col.field, col])
    );

    const orionFilters = [];

    for (const [field, filterMeta] of Object.entries(primeFilters)) {
        const column = columnMap[field];
        if (!column?.filter) {
            continue;
        }

        const value =
            filterMeta &&
            typeof filterMeta === 'object' &&
            'value' in filterMeta
                ? filterMeta.value
                : filterMeta;

        if (isEmptyFilterValue(value)) {
            continue;
        }

        const filterType = column.filter.type ?? 'text';
        const operator =
            column.filter.operator ?? DEFAULT_OPERATORS[filterType] ?? '=';

        let normalizedValue = value;
        if (filterType === 'number') {
            normalizedValue = Number(value);
            if (Number.isNaN(normalizedValue)) {
                continue;
            }
        }

        orionFilters.push({
            field: resolveFilterField(field, fieldAliases),
            operator,
            value: formatFilterValue(normalizedValue, filterType, operator)
        });
    }

    return orionFilters;
}

export const TEXT_COLUMN_FILTER = { type: 'text' };
export const NUMBER_COLUMN_FILTER = { type: 'number' };

export const STATUS_ACTIVE_INACTIVE_FILTER = {
    type: 'select',
    options: ACTIVE_INACTIVE_NUMERIC_OPTIONS
};

export const USER_STATUS_FILTER = {
    type: 'select',
    options: USER_ACCOUNT_STATUS_OPTIONS
};

export const ROLE_STATUS_FILTER = {
    type: 'select',
    options: ACTIVE_INACTIVE_BOOLEAN_OPTIONS
};

export const SCHEDULED_JOB_STATUS_FILTER = {
    type: 'select',
    options: SCHEDULED_JOB_LAST_RUN_STATUS_OPTIONS,
    defaultActive: false
};

export function withSelectFilter(column, options) {
    return { ...column, filter: { type: 'select', options } };
}

export function enumToSelectFilter(items, valueKey = 'id', labelKey = 'name') {
    return {
        type: 'select',
        options: items.map((item) => ({
            label: item[labelKey],
            value: item[valueKey]
        })),
        defaultActive: false
    };
}

const emailLogStatuses = [
    { id: 'queued', name: 'Queued' },
    { id: 'delivered', name: 'Delivered' },
    { id: 'opened', name: 'Opened' },
    { id: 'failed', name: 'Failed' }
];

export const EMAIL_LOG_STATUS_FILTER = enumToSelectFilter(emailLogStatuses);

