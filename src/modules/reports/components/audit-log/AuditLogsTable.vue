<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import Card from 'primevue/card';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import BaseTable from '@/components/common/BaseTable.vue';
import TitleHeader from '@/components/common/TitleHeader.vue';
import DateRangePresetPicker from '@/components/common/DateRangePresetPicker.vue';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { useActivityLogStore } from '@/modules/reports/stores';
import { DIALOG_CLASS, PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import { TEXT_COLUMN_FILTER, enumToSelectFilter } from '@/utils/tableFilters';
import { isCompleteDateRange } from '@/utils/dateRangePresets';
import {
    auditLogEvents,
    auditLogResources
} from '@/modules/reports/config/auditLog';

const activityLogStore = useActivityLogStore();
const { formatDateTime } = useHelpers();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions('', [
    { field: 'created_at', direction: 'desc' }
]);
const loading = ref(false);
const items = ref([]);
const totalRecords = ref(0);
const periodPreset = ref('all');
const dateRangeForRun = ref([null, null]);
const appliedDateRange = ref([]);

const propertiesDialogVisible = ref(false);
const selectedRow = ref(null);

const AUDIT_LOG_RESOURCE_FILTER = enumToSelectFilter(auditLogResources);
const AUDIT_LOG_EVENT_FILTER = enumToSelectFilter(auditLogEvents);

const includesPayload = [{ relation: 'causer' }];

const columnsMenuItems = [
    {
        field: 'created_at',
        header: 'Date',
        sortable: true
    },
    {
        field: 'log_name',
        header: 'Resource',
        sortable: true,
        filter: AUDIT_LOG_RESOURCE_FILTER
    },
    {
        field: 'event',
        header: 'Event',
        sortable: true,
        filter: AUDIT_LOG_EVENT_FILTER
    },
    {
        field: 'causer_name',
        header: 'User',
        sortable: false,
        filter: TEXT_COLUMN_FILTER
    }
];

const sortField = computed(() => sortFilters.sort?.[0]?.field ?? 'created_at');
const sortOrder = computed(() => {
    const d = sortFilters.sort?.[0]?.direction ?? 'desc';
    return d === 'asc' ? 1 : -1;
});

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs: columnsMenuItems,
    sortFilters,
    pagination,
    refetch: getItems,
    fieldAliases: {
        causer_name: 'causer.name'
    }
});

const propertyChanges = computed(() => {
    const props = selectedRow.value?.properties;
    if (!props || typeof props !== 'object') {
        return [];
    }
    const attrs = props.attributes || {};
    const old = props.old || {};
    const keys = new Set([...Object.keys(attrs), ...Object.keys(old)]);
    return [...keys].map((key) => ({
        field: key,
        old: formatChangeValue(old[key]),
        new: formatChangeValue(attrs[key])
    }));
});

function formatChangeValue(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

function formatEventName(event) {
    if (!event) {
        return '-';
    }
    const match = auditLogEvents.find((e) => e.id === event);
    if (match) {
        return match.name;
    }
    return event
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function eventSeverity(event) {
    switch (event) {
        case 'created':
            return 'success';
        case 'updated':
            return 'info';
        case 'deleted':
            return 'danger';
        case 'manual_run':
            return 'warn';
        default:
            return 'secondary';
    }
}

function subjectLabel(data) {
    const type = data?.subject_type;
    const id = data?.subject_id;
    if (!type && id == null) {
        return '-';
    }
    const shortType = type ? type.split('\\').pop() : 'Record';
    return id != null ? `${shortType} #${id}` : shortType;
}

function openPropertiesDialog(data) {
    selectedRow.value = data;
    propertiesDialogVisible.value = true;
}

function hasViewableProperties(data) {
    const props = data?.properties;
    if (!props || typeof props !== 'object') {
        return false;
    }
    const attrs = props.attributes || {};
    const old = props.old || {};
    return Object.keys(attrs).length > 0 || Object.keys(old).length > 0;
}

function makeCustomFiltersPayload() {
    const customFilters = [];
    if (isCompleteDateRange(appliedDateRange.value)) {
        customFilters.push({
            field: 'created_at_range',
            operator: 'between',
            value: appliedDateRange.value
        });
    }
    return customFilters;
}

function buildSearchPayload() {
    let sort = sortFilters.sort;
    if (!sort || sort.length === 0) {
        sort = [{ field: 'created_at', direction: 'desc' }];
    }
    return {
        ...sortFilters.getSortFilters(),
        customFilters: makeCustomFiltersPayload(),
        includes: includesPayload,
        sort
    };
}

async function applyDateFilter() {
    appliedDateRange.value = isCompleteDateRange(dateRangeForRun.value)
        ? [...dateRangeForRun.value]
        : [];
    pagination.resetPageParams();
    await getItems();
}

const onSortChange = (event) => {
    pagination.resetPageParams();
    sortFilters.updateSortFilters(event);
    getItems();
};

const onPageChange = (event) => {
    pagination.updatePageParams(event);
    getItems();
};

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        const res = await activityLogStore.search(buildSearchPayload(), params);
        items.value = res.data || [];
        totalRecords.value = res?.meta?.total || 0;
    } finally {
        loading.value = false;
    }
}

onBeforeMount(async () => {
    await getItems();
});
</script>

<template>
    <TitleHeader>
        <template #title>
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold">Audit Log</h1>
            </div>
        </template>
    </TitleHeader>

    <Card class="py-3 px-2">
        <template #content>
            <BaseTable
                dataKey="id"
                :value="items"
                :page="pagination.page"
                :rows="pagination.limit"
                :total-records="totalRecords"
                :loading="loading"
                :sort-field="sortField"
                :sort-order="sortOrder"
                :column-filters="true"
                v-model:filters="primeFilters"
                @filter="onColumnFilter"
                @sort="onSortChange"
                @page="onPageChange"
            >
                <template #header>
                    <div
                        class="flex flex-col lg:flex-row lg:items-end lg:justify-end gap-3 mb-5"
                    >
                        <div class="flex flex-nowrap items-end gap-2 shrink-0">
                            <DateRangePresetPicker
                                v-model:date-range="dateRangeForRun"
                                v-model:preset="periodPreset"
                                default-preset="all"
                                :disabled="loading"
                            />
                            <Button
                                label="Apply"
                                icon="pi pi-play"
                                class="shrink-0"
                                :disabled="loading"
                                :loading="loading"
                                @click="applyDateFilter"
                            />
                        </div>
                    </div>
                </template>

                <Column
                    v-for="col in columnsMenuItems"
                    :key="col.field"
                    :field="col.field"
                    :header="col.header"
                    :sortable="col.sortable"
                    :column-key="col.field"
                    :showFilterMenu="col.filter ? false : undefined"
                    :filterField="col.filter ? col.field : undefined"
                >
                    <template
                        v-if="col.filter"
                        #filter="{ filterModel, filterCallback }"
                    >
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="col.filter"
                            @apply="filterCallback()"
                        />
                    </template>

                    <template
                        v-if="col.field === 'created_at'"
                        #body="{ data }"
                    >
                        {{ formatDateTime(data.created_at) }}
                    </template>
                    <template
                        v-else-if="col.field === 'event'"
                        #body="{ data }"
                    >
                        <Tag
                            class="!text-xs"
                            :value="formatEventName(data.event)"
                            :severity="eventSeverity(data.event)"
                        />
                    </template>
                    <template
                        v-else-if="col.field === 'causer_name'"
                        #body="{ data }"
                    >
                        <router-link
                            v-if="
                                $ability.can('administration.users.edit') &&
                                data.causer_uuid &&
                                data.causer_name
                            "
                            :to="{
                                name: 'EditUser',
                                params: { uuid: data.causer_uuid }
                            }"
                            class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                        >
                            {{ data.causer_name }}
                        </router-link>
                        <span v-else>{{ data.causer_name || '-' }}</span>
                    </template>
                    <template
                        v-else-if="col.field === 'subject_type'"
                        #body="{ data }"
                    >
                        {{ subjectLabel(data) }}
                    </template>
                </Column>

                <Column header="Changes" :exportable="false">
                    <template #body="{ data }">
                        <Button
                            v-if="hasViewableProperties(data)"
                            label="View"
                            icon="pi pi-eye"
                            outlined
                            size="small"
                            @click="openPropertiesDialog(data)"
                        />
                        <span v-else class="text-surface-500">-</span>
                    </template>
                </Column>
            </BaseTable>
        </template>
    </Card>

    <Dialog
        v-model:visible="propertiesDialogVisible"
        modal
        header="Property changes"
        :class="DIALOG_CLASS"
        :draggable="false"
    >
        <p
            v-if="selectedRow"
            class="text-sm text-surface-600 mb-3 flex flex-wrap items-center gap-2"
        >
            <span>{{ selectedRow.log_name }}</span>
            <Tag
                class="!text-xs"
                :value="formatEventName(selectedRow.event)"
                :severity="eventSeverity(selectedRow.event)"
            />
            <span>{{ formatDateTime(selectedRow.created_at) }}</span>
        </p>
        <div v-if="propertyChanges.length" class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr class="border-b border-surface-200">
                        <th class="text-left py-2 pr-3 font-medium">Field</th>
                        <th class="text-left py-2 pr-3 font-medium">
                            Previous
                        </th>
                        <th class="text-left py-2 font-medium">New</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="row in propertyChanges"
                        :key="row.field"
                        class="border-b border-surface-100 align-top"
                    >
                        <td class="py-2 pr-3 font-medium">{{ row.field }}</td>
                        <td class="py-2 pr-3 break-all">{{ row.old }}</td>
                        <td class="py-2 break-all">{{ row.new }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p v-else class="text-surface-500">No property details recorded.</p>
    </Dialog>
</template>
