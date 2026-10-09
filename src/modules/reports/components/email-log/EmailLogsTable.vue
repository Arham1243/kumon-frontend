<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import Card from 'primevue/card';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import BaseTable from '@/components/common/BaseTable.vue';
import TitleHeader from '@/components/common/TitleHeader.vue';
import DateRangePresetPicker from '@/components/common/DateRangePresetPicker.vue';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { useEmailLogStore } from '@/modules/reports/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import ExportFormatMenu from '@/components/common/ExportFormatMenu.vue';
import { EmailLogService } from '@/modules/reports/services';
import { downloadTabularExport } from '@/utils/downloadBlob';
import {
    TEXT_COLUMN_FILTER,
    EMAIL_LOG_STATUS_FILTER
} from '@/utils/tableFilters';
import { isCompleteDateRange } from '@/utils/dateRangePresets';

const emailLogStore = useEmailLogStore();
const {
    formatDateTime,
    makeSlugToTitleCase,
    formatMailgunMessageIdForDisplay
} = useHelpers();

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

const EXPORT_COLUMNS = [
    'created_at',
    'recipient',
    'subject',
    'template_slug',
    'admin.name',
    'status',
    'failure_reason',
    'mailgun_message_id'
];

const includesPayload = [
    { relation: 'admin' },
    { relation: 'adminEmailTemplate' }
];

const columnsMenuItems = [
    {
        field: 'created_at',
        header: 'Date',
        sortable: true
    },
    {
        field: 'recipient',
        header: 'Recipients',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'subject',
        header: 'Subject',
        sortable: false,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'template_slug',
        header: 'Template',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'status',
        header: 'Status',
        sortable: true,
        filter: EMAIL_LOG_STATUS_FILTER
    },
    {
        field: 'mailgun_message_id',
        header: 'Message ID',
        sortable: false,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'failure_reason',
        header: 'Detail',
        sortable: false
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
        template_slug: 'adminEmailTemplate.name',
        'admin.name': 'admin.name'
    }
});

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
        const res = await emailLogStore.search(buildSearchPayload(), params);
        items.value = res.data || [];
        totalRecords.value = res?.meta?.total || 0;
    } finally {
        loading.value = false;
    }
}

async function exportFilteredReport(format) {
    try {
        loading.value = true;
        const res = await EmailLogService.exportFile({
            format,
            columns: EXPORT_COLUMNS,
            ...buildSearchPayload()
        });
        downloadTabularExport(res.data, {
            filenameBase: 'email-logs',
            format
        });
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}

function templateLabel(data) {
    const raw = data.email_template_name || data.template_slug || '';
    return raw ? makeSlugToTitleCase(raw) : '-';
}

function actorDisplay(data) {
    return data.admin?.email || data.admin?.name || data.admin_name || '-';
}

function recipientChipItems(data) {
    const raw = data?.recipient;
    if (raw == null || raw === '') {
        return [];
    }
    if (Array.isArray(raw)) {
        return raw.map((s) => String(s).trim()).filter(Boolean);
    }
    return String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

onBeforeMount(async () => {
    await getItems();
});
</script>

<template>
    <TitleHeader>
        <template #title>
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold">Email Logs</h1>
            </div>
        </template>
        <template #actions>
            <ExportFormatMenu
                :disabled="items.length === 0 || loading"
                @export="exportFilteredReport"
            />
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
                        v-else-if="col.field === 'recipient'"
                        #body="{ data }"
                    >
                        <div
                            v-if="recipientChipItems(data).length"
                            class="flex flex-wrap gap-1"
                        >
                            <Chip
                                v-for="(addr, rIdx) in recipientChipItems(data)"
                                :key="`${data.id}-recipient-${rIdx}-${addr}`"
                                :label="addr"
                            />
                        </div>
                        <span v-else>-</span>
                    </template>
                    <template
                        v-else-if="col.field === 'template_slug'"
                        #body="{ data }"
                    >
                        <router-link
                            v-if="data.email_template_uuid"
                            :to="{
                                name: 'EditEmailTemplate',
                                params: { uuid: data.email_template_uuid }
                            }"
                            class="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                            {{ templateLabel(data) }}
                        </router-link>
                        <span v-else>{{ templateLabel(data) }}</span>
                    </template>
                    <template
                        v-else-if="col.field === 'admin.name'"
                        #body="{ data }"
                    >
                        <span>{{ actorDisplay(data) }}</span>
                    </template>
                    <template
                        v-else-if="col.field === 'status'"
                        #body="{ data }"
                    >
                        <StatusTag v-if="data.status" :status="data.status" />
                        <span v-else class="text-gray-400">-</span>
                    </template>
                    <template
                        v-else-if="col.field === 'failure_reason'"
                        #body="{ data }"
                    >
                        <span
                            class="line-clamp-2"
                            :title="data.failure_reason || ''"
                        >
                            {{ data.failure_reason || '-' }}
                        </span>
                    </template>
                    <template
                        v-else-if="col.field === 'mailgun_message_id'"
                        #body="{ data }"
                    >
                        <span
                            class="font-mono text-sm break-all line-clamp-1"
                            :title="data.mailgun_message_id || ''"
                        >
                            {{
                                formatMailgunMessageIdForDisplay(
                                    data.mailgun_message_id
                                )
                            }}
                        </span>
                    </template>
                </Column>

                <template #empty>No email logs found.</template>
            </BaseTable>
        </template>
    </Card>
</template>
