<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useEmailTemplateStore } from '@/modules/administration/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER, ROLE_STATUS_FILTER } from '@/utils/tableFilters';
import { useRouter } from 'vue-router';
import { ability } from '@/plugins/ability';
import StatusTag from '@/components/common/StatusTag.vue';
import Confirmation from '@/components/common/Confirmation.vue';

const { filterByPermission } = useHelpers();

const templateStore = useEmailTemplateStore();
const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const router = useRouter();
const menu = ref();
const selectedItem = ref(null);
const loading = ref(false);
const items = ref([]);
const changeStatusDialog = ref(false);
const totalRecords = ref(0);

const columnsMenuItems = [
    {
        field: 'name',
        header: 'Template',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'status',
        header: 'Status',
        sortable: true,
        filter: { ...ROLE_STATUS_FILTER, defaultActive: false }
    }
];

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs: columnsMenuItems,
    sortFilters,
    pagination,
    refetch: getItems
});

onBeforeMount(async () => {
    await getItems();
});

const menuItems = computed(() => {
    if (!selectedItem.value) return [];

    const allMenuItems = [
        {
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: () => goToEdit(),
            permission: 'administration.email-templates.edit'
        },
        {
            label: isItemActive.value ? 'Make Inactive' : 'Make Active',
            icon: isItemActive.value ? 'pi pi-times' : 'pi pi-check',
            command: () => showChangeStatusDialog(),
            permission: 'administration.email-templates.edit'
        }
    ].filter(Boolean);

    return filterByPermission(allMenuItems);
});

const isItemActive = computed(() => {
    return selectedItem.value && selectedItem.value.status;
});

const goToEdit = () => {
    if (!selectedItem.value?.uuid) return;
    router.push({
        name: 'EditEmailTemplate',
        params: { uuid: selectedItem.value.uuid }
    });
};

const showChangeStatusDialog = () => {
    changeStatusDialog.value = true;
};

const showActions = (event, item) => {
    selectedItem.value = item;
    menu.value.toggle(event);
};

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
        const payload = { ...sortFilters.getSortFilters() };
        if (!payload.sort || payload.sort.length === 0) {
            payload.sort = [
                { field: 'status', direction: 'desc' },
                { field: 'name', direction: 'asc' }
            ];
        }
        const res = await templateStore.search(payload, params);
        items.value = res.data;
        totalRecords.value = res.meta?.total ?? 0;
    } finally {
        loading.value = false;
    }
}

const changeStatus = async () => {
    try {
        loading.value = true;
        if (selectedItem.value) {
            await templateStore.changeStatus(
                selectedItem.value.uuid,
                !selectedItem.value.status
            );
        }
        await getItems();
        selectedItem.value = null;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="py-3 px-2">
        <BaseTable
            :reorderableColumns="true"
            :value="items"
            :page="pagination.page"
            :rows="pagination.limit"
            :total-records="totalRecords"
            :loading="loading"
            :column-filters="true"
            v-model:filters="primeFilters"
            @filter="onColumnFilter"
            @sort="onSortChange"
            @page="onPageChange"
        >
            <template #empty> No email templates found. </template>

            <Column
                v-for="col in columnsMenuItems"
                :key="col.field"
                :columnKey="col.field"
                :field="col.field"
                :header="col.header"
                :sortable="col.sortable"
                :class="col.field === 'name' ? 'w-[30rem]' : undefined"
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

                <template v-if="col.field === 'name'" #body="{ data }">
                    <router-link
                        v-if="
                            ability.can('administration.email-templates.edit')
                        "
                        :to="{
                            name: 'EditEmailTemplate',
                            params: { uuid: data.uuid }
                        }"
                        class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                    >
                        {{ data.name }}
                    </router-link>
                    <span v-else class="font-medium">{{ data.name }}</span>
                </template>

                <template v-else-if="col.field === 'status'" #body="{ data }">
                    <StatusTag :status="data.status ? 'active' : 'inactive'" />
                </template>
            </Column>

            <Column
                columnKey="actions"
                v-if="ability.can('administration.email-templates.edit')"
                header="Actions"
                class="flex justify-end"
            >
                <template #body="{ data }">
                    <Button
                        class="!px-3 !py-2"
                        label="Actions"
                        variant="outlined"
                        iconPos="right"
                        icon="pi pi-chevron-down"
                        size="small"
                        @click="showActions($event, data)"
                    />

                    <Menu
                        ref="menu"
                        id="overlay_menu"
                        :model="menuItems"
                        :popup="true"
                    />
                </template>
            </Column>
        </BaseTable>

        <Confirmation
            v-if="
                ability.can('administration.email-templates.edit') &&
                selectedItem
            "
            v-model="changeStatusDialog"
            variant="danger"
            :header="isItemActive ? 'Make Inactive' : 'Make Active'"
            :content="`Are you sure you want to make this template ${isItemActive ? 'inactive' : 'active'}?`"
            :confirmButtonText="isItemActive ? 'Make Inactive' : 'Make Active'"
            @confirm="changeStatus"
        />
    </div>
</template>
