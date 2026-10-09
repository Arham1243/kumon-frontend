<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useUserRoleStore } from '@/modules/administration/stores';
import {
    PaginationOptions,
    SortFilterOptions,
    SYSTEM_MANAGED_LOCK_TOOLTIP
} from '@/config';
import { useRouter } from 'vue-router';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER, ROLE_STATUS_FILTER } from '@/utils/tableFilters';
import InputField from '@/components/common/InputField.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import Confirmation from '@/components/common/Confirmation.vue';

const helpers = useHelpers();
const roleStore = useUserRoleStore();
const router = useRouter();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const menu = ref();
const loading = ref(false);
const items = ref([]);
const totalRecords = ref();

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        const payload = {
            ...sortFilters.getSortFilters()
        };
        if (!payload.sort || payload.sort.length === 0) {
            payload.sort = [{ field: 'name', direction: 'asc' }];
        }
        const res = await roleStore.search(payload, params);
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
const deleteDialog = ref(false);
const selectedItem = ref(null);
const changeStatusDialog = ref(false);
const showDialog = ref(false);
const isEditMode = ref(false);
const busy = ref(false);
const formData = ref({ name: '', status: true });

onBeforeMount(async () => {
    await getItems();
});

const assignedAdminsCount = computed(() =>
    Number(selectedItem.value?.assigned_admins_count ?? 0)
);

const menuItems = computed(() => {
    if (!selectedItem.value) return [];

    const isSystem = selectedItem.value?.system;
    const canShowDelete = !isSystem;

    const allMenuItems = [
        !isSystem && {
            label: 'Edit',
            icon: 'pi pi-pencil',
            permission: 'administration.user-roles.edit',
            command: () => showEditDialog()
        },
        {
            label: 'Permissions',
            icon: 'pi pi-lock',
            permission: 'administration.user-roles.edit',
            command: () => goToPermissions()
        },
        !isSystem &&
            isItemActive.value &&
            assignedAdminsCount.value === 0 && {
                label: 'Make Inactive',
                icon: 'pi pi-times',
                permission: 'administration.user-roles.edit',
                command: () => showChangeStatusDialog()
            },
        !isSystem &&
            !isItemActive.value && {
                label: 'Make Active',
                icon: 'pi pi-check',
                permission: 'administration.user-roles.edit',
                command: () => showChangeStatusDialog()
            },
        canShowDelete && {
            label: 'Delete',
            icon: 'pi pi-trash',
            permission: 'administration.user-roles.delete',
            command: () => showDeleteDialog()
        }
    ].filter(Boolean);

    return helpers.filterByPermission(allMenuItems);
});

const showDeleteDialog = () => {
    deleteDialog.value = true;
};

const isItemActive = computed(() => {
    return selectedItem.value && selectedItem.value.status;
});

const goToPermissions = () => {
    if (!selectedItem.value?.uuid) return;
    router.push({
        name: 'RolePermissions',
        params: { uuid: selectedItem.value.uuid }
    });
};

const resetForm = () => {
    formData.value = { name: '', status: true };
};

const editDialogInitial = computed(() => {
    if (!isEditMode.value || !selectedItem.value) {
        return null;
    }
    return {
        name: selectedItem.value.name ?? '',
        status: !!selectedItem.value.status
    };
});

const isSuperAdminRole = computed(() => {
    const r = selectedItem.value;
    return !!(r?.system && r?.is_super_admin);
});

const roleNameReadOnly = computed(
    () => isEditMode.value && isSuperAdminRole.value
);

const statusSwitchDisabled = computed(
    () => busy.value || (isEditMode.value && !!selectedItem.value?.system)
);

const nameInputDisabled = computed(() => busy.value || roleNameReadOnly.value);

const openDialog = (mode = 'add') => {
    isEditMode.value = mode === 'edit';
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

const showCreateDialog = () => {
    resetForm();
    openDialog('add');
};

const showEditDialog = () => {
    resetForm();
    formData.value = {
        name: selectedItem.value?.name || '',
        status: !!selectedItem.value?.status
    };
    openDialog('edit');
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

const save = async () => {
    try {
        busy.value = true;
        if (isEditMode.value) {
            if (selectedItem.value?.uuid) {
                const payload = { status: !!formData.value.status };
                if (!roleNameReadOnly.value) {
                    payload.name = formData.value.name.trim();
                }
                await roleStore.update(selectedItem.value.uuid, payload);
            }
        } else {
            const created = await roleStore.create({
                name: formData.value.name.trim(),
                status: !!formData.value.status
            });
            const roleUuid = created?.data?.uuid ?? created?.uuid;
            closeDialog();
            selectedItem.value = {};
            if (roleUuid) {
                await router.push({
                    name: 'RolePermissions',
                    params: { uuid: roleUuid }
                });
                return;
            }
        }
        closeDialog();
        await getItems();
        selectedItem.value = {};
    } catch (error) {
        console.error(error);
    } finally {
        busy.value = false;
    }
};

const deleteItem = async () => {
    try {
        loading.value = true;
        if (selectedItem.value) {
            await roleStore.deleteItem(selectedItem.value.uuid);
        }
        await getItems();
        selectedItem.value = {};
    } finally {
        loading.value = false;
    }
};

const changeStatus = async () => {
    try {
        loading.value = true;
        if (selectedItem.value) {
            await roleStore.changeStatus(selectedItem.value.uuid);
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
                <h1 class="text-2xl sm:text-3xl font-bold">User Roles</h1>
            </div>
        </template>
        <template #actions>
            <Button
                v-if="$ability.can('administration.user-roles.create')"
                label="Add New"
                icon="pi pi-plus"
                @click="showCreateDialog"
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
                <template #empty> No roles found. </template>
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
                            v-if="
                                $ability.can('administration.user-roles.edit')
                            "
                            :to="{
                                name: 'RolePermissions',
                                params: { uuid: data.uuid }
                            }"
                            class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                        >
                            {{ data.name }}
                        </router-link>
                        <span v-else class="font-medium">{{ data.name }}</span>
                    </template>

                    <template
                        v-else-if="col.field === 'status'"
                        #body="{ data }"
                    >
                        <StatusTag
                            :status="data.status ? 'active' : 'inactive'"
                        />
                    </template>
                </Column>

                <Column
                    v-if="
                        $ability.can('administration.user-roles.edit') ||
                        $ability.can('administration.user-roles.delete')
                    "
                    columnKey="actions"
                    header="Actions"
                    class="flex justify-end"
                >
                    <template #body="{ data }">
                        <div class="flex items-center justify-end gap-8 pr-3">
                            <i
                                v-if="data.system"
                                class="pi pi-lock text-red-500 !text-xl opacity-90 shrink-0 mr-2"
                                aria-hidden="true"
                                v-tooltip.top="SYSTEM_MANAGED_LOCK_TOOLTIP"
                            />
                            <span
                                v-else
                                class="inline-block w-8 shrink-0"
                                aria-hidden="true"
                            />
                            <Button
                                class="!px-3 !py-2"
                                label="Actions"
                                variant="outlined"
                                iconPos="right"
                                icon="pi pi-chevron-down"
                                size="small"
                                @click="showActions($event, data)"
                            />
                        </div>

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

    <BaseDialog
        v-if="
            $ability.can('administration.user-roles.create') ||
            $ability.can('administration.user-roles.edit')
        "
        v-model:visible="showDialog"
        :busy="busy"
        :isEditMode="isEditMode"
        :header="isEditMode ? 'Edit Role' : 'New Role'"
        cancelLabel="Cancel"
        :formData="formData"
        :initialData="editDialogInitial"
        :enableDirtyCheck="true"
        :disableConfirm="!formData.name?.trim()"
        class="w-full sm:w-1/2 md:w-1/3"
        @cancel="closeDialog"
        @confirm="save"
    >
        <div class="col-span-12">
            <div class="flex items-center gap-2 mb-2">
                <label for="roleName" class="required mb-0">Name</label>
                <i
                    v-if="roleNameReadOnly"
                    class="pi pi-lock text-red-500 !text-sm opacity-90"
                    aria-hidden="true"
                    v-tooltip.top="SYSTEM_MANAGED_LOCK_TOOLTIP"
                />
            </div>
            <InputField
                id="roleName"
                variant="text"
                v-model="formData.name"
                class="w-full"
                :disabled="nameInputDisabled"
                maxlength="255"
                autofocus
                @keyup.enter="save"
            />
        </div>

        <div class="col-span-12">
            <label class="block mb-2" for="roleStatus">Active</label>
            <div class="flex items-center gap-2">
                <InputField
                    id="roleStatus"
                    variant="switch"
                    v-model="formData.status"
                    :disabled="statusSwitchDisabled"
                />
            </div>
        </div>
    </BaseDialog>

    <Confirmation
        v-model="changeStatusDialog"
        :variant="isItemActive ? 'danger' : 'success'"
        :header="isItemActive ? 'Deactivate Role' : 'Activate Role'"
        :content="
            selectedItem
                ? `Are you sure you want to ${isItemActive ? 'deactivate' : 'activate'} \u201C${selectedItem.name}\u201D?`
                : 'Change status of this role?'
        "
        :confirmButtonText="isItemActive ? 'Deactivate' : 'Activate'"
        @confirm="changeStatus"
    />

    <Confirmation
        v-model="deleteDialog"
        variant="danger"
        header="Delete Role"
        :content="
            selectedItem
                ? `Delete role \u201C${selectedItem.name}\u201D? Roles assigned to admins or tenant users cannot be deleted.`
                : 'Delete this role?'
        "
        confirm-button-text="Delete"
        @confirm="deleteItem"
    />
</template>
