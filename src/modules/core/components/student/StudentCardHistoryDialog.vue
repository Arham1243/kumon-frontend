<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Column from 'primevue/column';
import Button from 'primevue/button';
import BaseTable from '@/components/common/BaseTable.vue';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { StudentService } from '@/modules/core/services';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import { DIALOG_CLASS } from '@/config/dialogClasses';
import { TEXT_COLUMN_FILTER } from '@/utils/tableFilters';

const props = defineProps({
    visible: { type: Boolean, default: false },
    student: { type: Object, default: null }
});

const emit = defineEmits(['update:visible']);

const { formatDateTime } = useHelpers();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions('', [
    { field: 'assigned_at', direction: 'desc' }
]);
const loading = ref(false);
const items = ref([]);
const totalRecords = ref(0);

const columnConfigs = [
    {
        field: 'card_uid',
        header: 'Card UID',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'assigned_at',
        header: 'Assigned',
        sortable: true
    }
];

const sortField = computed(() => sortFilters.sort?.[0]?.field ?? 'assigned_at');
const sortOrder = computed(() => {
    const d = sortFilters.sort?.[0]?.direction ?? 'desc';
    return d === 'asc' ? 1 : -1;
});

const headerTitle = computed(() => {
    if (!props.student?.name) {
        return 'Card history';
    }
    return `Card history: ${props.student.name}`;
});

function buildSearchPayload() {
    let sort = sortFilters.sort;
    if (!sort || sort.length === 0) {
        sort = [{ field: 'assigned_at', direction: 'desc' }];
    }
    return {
        ...sortFilters.getSortFilters(),
        sort
    };
}

async function fetchItems() {
    if (!props.student?.uuid) {
        return;
    }
    loading.value = true;
    try {
        const params = { ...pagination.getPageParams() };
        const res = await StudentService.searchCardHistory(
            props.student.uuid,
            buildSearchPayload(),
            params
        );
        items.value = res.data?.data ?? [];
        totalRecords.value = res.data?.meta?.total ?? 0;
    } catch {
        items.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs,
    sortFilters,
    pagination,
    refetch: fetchItems
});

const onSortChange = (event) => {
    pagination.resetPageParams();
    sortFilters.updateSortFilters(event);
    fetchItems();
};

const onPageChange = (event) => {
    pagination.updatePageParams(event);
    fetchItems();
};

const close = () => emit('update:visible', false);

watch(
    () => [props.visible, props.student?.uuid],
    ([isOpen, uuid]) => {
        if (isOpen && uuid) {
            pagination.resetPageParams();
            sortFilters.sort = [{ field: 'assigned_at', direction: 'desc' }];
            fetchItems();
        } else if (!isOpen) {
            items.value = [];
            totalRecords.value = 0;
        }
    }
);
</script>

<template>
    <Dialog
        :visible="visible"
        modal
        :draggable="false"
        :header="headerTitle"
        :class="DIALOG_CLASS"
        @update:visible="(v) => emit('update:visible', v)"
    >
        <BaseTable
            dataKey="uuid"
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
            <template #empty>
                <span class="text-surface-500"
                    >No card history for this student.</span
                >
            </template>

            <Column
                v-for="col in columnConfigs"
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

                <template v-if="col.field === 'card_uid'" #body="{ data }">
                    <span>{{
                        data.card_uid || '-'
                    }}</span>
                </template>
                <template
                    v-else-if="col.field === 'assigned_at'"
                    #body="{ data }"
                >
                    {{ formatDateTime(data.assigned_at) }}
                </template>
            </Column>
        </BaseTable>

        <template #footer>
            <div class="flex justify-end">
                <Button label="Close" @click="close" />
            </div>
        </template>
    </Dialog>
</template>
