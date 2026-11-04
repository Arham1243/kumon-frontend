<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import Card from 'primevue/card';
import Column from 'primevue/column';
import Button from 'primevue/button';
import BaseTable from '@/components/common/BaseTable.vue';
import TitleHeader from '@/components/common/TitleHeader.vue';
import DateRangePresetPicker from '@/components/common/DateRangePresetPicker.vue';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { useStudentCardHistoryStore } from '@/modules/reports/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import ExportFormatMenu from '@/components/common/ExportFormatMenu.vue';
import { StudentCardHistoryService } from '@/modules/reports/services';
import { downloadTabularExport } from '@/utils/downloadBlob';
import { TEXT_COLUMN_FILTER } from '@/utils/tableFilters';
import { isCompleteDateRange } from '@/utils/dateRangePresets';

const studentCardHistoryStore = useStudentCardHistoryStore();
const { formatDateTime } = useHelpers();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions('', [
    { field: 'assigned_at', direction: 'desc' }
]);
const loading = ref(false);
const items = ref([]);
const totalRecords = ref(0);
const periodPreset = ref('all');
const dateRangeForRun = ref([null, null]);
const appliedDateRange = ref([]);

const EXPORT_COLUMNS = [
    'student.student_id',
    'student.name',
    'card_uid',
    'assigned_at'
];

const includesPayload = [{ relation: 'student' }];

const columnsMenuItems = [
    {
        field: 'student.student_id',
        header: 'Student ID',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'student.name',
        header: 'Name',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'card_uid',
        header: 'Card UID',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'assigned_at',
        header: 'Assigned at',
        sortable: true
    }
];

const sortField = computed(() => sortFilters.sort?.[0]?.field ?? 'assigned_at');
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
        'student.student_id': 'student.student_id',
        'student.name': 'student.name'
    }
});

function makeCustomFiltersPayload() {
    const customFilters = [];
    if (isCompleteDateRange(appliedDateRange.value)) {
        customFilters.push({
            field: 'assigned_at_range',
            operator: 'between',
            value: appliedDateRange.value
        });
    }
    return customFilters;
}

function buildSearchPayload() {
    let sort = sortFilters.sort;
    if (!sort || sort.length === 0) {
        sort = [{ field: 'assigned_at', direction: 'desc' }];
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
        const res = await studentCardHistoryStore.search(buildSearchPayload(), params);
        items.value = res.data || [];
        totalRecords.value = res?.meta?.total || 0;
    } finally {
        loading.value = false;
    }
}

async function exportFilteredReport(format) {
    try {
        loading.value = true;
        const res = await StudentCardHistoryService.exportFile({
            format,
            columns: EXPORT_COLUMNS,
            ...buildSearchPayload()
        });
        downloadTabularExport(res.data, {
            filenameBase: 'student-cards',
            format
        });
    } catch (error) {
        console.error(error);
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
                <h1 class="text-2xl sm:text-3xl font-bold">Student Cards</h1>
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
                        v-if="col.field === 'student.student_id'"
                        #body="{ data }"
                    >
                        {{ data.student?.student_id ?? '-' }}
                    </template>
                    <template
                        v-else-if="col.field === 'student.name'"
                        #body="{ data }"
                    >
                        {{ data.student?.name ?? '-' }}
                    </template>
                    <template
                        v-else-if="col.field === 'card_uid'"
                        #body="{ data }"
                    >
                        <span>{{ data.card_uid || '-' }}</span>
                    </template>
                    <template
                        v-else-if="col.field === 'assigned_at'"
                        #body="{ data }"
                    >
                        {{ formatDateTime(data.assigned_at) }}
                    </template>
                </Column>

                <template #empty>No student card records found.</template>
            </BaseTable>
        </template>
    </Card>
</template>
