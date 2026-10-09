<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/modules/administration/stores';
import { useGlobalStore } from '@/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER, USER_STATUS_FILTER } from '@/utils/tableFilters';

const helpers = useHelpers();
const router = useRouter();
const userStore = useUserStore();
const globalStore = useGlobalStore();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const menu = ref();

const deleteDialog = ref(false);
const selectedItem = ref(null);
const loading = ref(false);
const items = ref([]);
const totalRecords = ref();
const changeStatusDialog = ref(false);

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        const payload = {
            ...sortFilters.getSortFilters(),
            includes: [{ relation: 'role' }]
        };
        if (!payload.sort || payload.sort.length === 0) {
            payload.sort = [{ field: 'name', direction: 'asc' }];
        }
        const res = await userStore.search(payload, params);
        items.value = res.data;
        totalRecords.value = res.meta.total;
    } finally {
        loading.value = false;
    }
}

const columnsMenuItems = [
    {
        field: 'name',
        header: 'Name',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'email',
        header: 'Email',
        sortable: true,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'role',
        header: 'Role',
        sortable: false,
        filter: TEXT_COLUMN_FILTER
    },
    {
        field: 'status',
        header: 'Status',
        sortable: true,
        filter: { ...USER_STATUS_FILTER, defaultActive: false }
    }
];

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs: columnsMenuItems,
    sortFilters,
    pagination,
    refetch: getItems,
    fieldAliases: { role: 'role.name' }
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
            permission: 'administration.users.edit',
            command: () =>
                router.push({
                    name: 'EditUser',
                    params: { uuid: selectedItem.value.uuid }
                })
        },
        {
            label: isItemActive.value ? 'Make Inactive' : 'Make Active',
            icon: isItemActive.value ? 'pi pi-times' : 'pi pi-check',
            permission: 'administration.users.edit',
            command: () => showChangeStatusDialog()
        },
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            permission: 'administration.users.delete',
            command: () => showDeleteDialog()
        }
    ].filter(Boolean);

    return helpers.filterByPermission(allMenuItems);
});

const showDeleteDialog = () => {
    deleteDialog.value = true;
};

const isItemActive = computed(() => {
    return selectedItem.value && selectedItem.value.status === 'active';
});

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

const deleteItem = async () => {
    try {
        loading.value = true;
        if (selectedItem.value) {
            await userStore.deleteItem(selectedItem.value.uuid);
        }
        await getItems();
        selectedItem.value = {};
    } catch (error) {
        const message =
            error?.response?.data?.message || 'This user could not be deleted.';
        globalStore.showError('Cannot delete user', message);
    } finally {
        loading.value = false;
    }
};

const changeStatus = async () => {
    try {
        loading.value = true;
        if (selectedItem.value) {
            await userStore.changeStatus(selectedItem.value.uuid);
        }
        await getItems();
        selectedItem.value = {};
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <TitleHeader>
        <template #title>
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold">User Management</h1>
            </div>
        </template>
        <template #actions>
            <Button
                v-if="$ability.can('administration.users.create')"
                label="Add New"
                icon="pi pi-plus"
                @click="router.push({ name: 'CreateUser' })"
            />
        </template>
    </TitleHeader>

    <Card>
        <template #content>
            <BaseTable
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
                <template #empty> No users found. </template>
                <Column
                    v-for="col in columnsMenuItems"
                    :key="col.field"
                    :columnKey="col.field"
                    :field="col.field"
                    :header="col.header"
                    :sortable="col.sortable"
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
                            v-if="$ability.can('administration.users.edit')"
                            :to="{
                                name: 'EditUser',
                                params: { uuid: data.uuid }
                            }"
                            class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                        >
                            {{ data.name }}
                        </router-link>
                        <span v-else>{{ data.name }}</span>
                    </template>

                    <template
                        v-else-if="col.field === 'email'"
                        #body="{ data }"
                    >
                        {{ data.email }}
                    </template>

                    <template v-else-if="col.field === 'role'" #body="{ data }">
                        {{ data.role?.name || '-' }}
                    </template>

                    <template
                        v-else-if="col.field === 'status'"
                        #body="{ data }"
                    >
                        <StatusTag :status="data.status" />
                    </template>
                </Column>

                <Column
                    v-if="
                        $ability.can('administration.users.edit') ||
                        $ability.can('administration.users.delete')
                    "
                    columnKey="actions"
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
        </template>
    </Card>

    <Confirmation
        v-model="changeStatusDialog"
        :variant="isItemActive ? 'danger' : 'success'"
        :header="isItemActive ? 'Deactivate User' : 'Activate User'"
        :content="
            selectedItem
                ? `Are you sure you want to ${isItemActive ? 'deactivate' : 'activate'} \u201C${selectedItem.name}\u201D?`
                : 'Change status of this user?'
        "
        :confirmButtonText="isItemActive ? 'Deactivate' : 'Activate'"
        @confirm="changeStatus"
    />

    <Confirmation
        v-model="deleteDialog"
        variant="danger"
        header="Delete User"
        :content="
            selectedItem
                ? `Delete user \u201C${selectedItem.name}\u201D? This action cannot be undone.`
                : 'Delete this user?'
        "
        confirm-button-text="Delete"
        @confirm="deleteItem"
    />
</template>
