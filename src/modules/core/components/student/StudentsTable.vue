<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useStudentStore } from '@/modules/core/stores';
import { useGlobalStore } from '@/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { truncate } from 'lodash-es';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER } from '@/utils/tableFilters';
import InputField from '@/components/common/InputField.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import Confirmation from '@/components/common/Confirmation.vue';

const helpers = useHelpers();
const studentStore = useStudentStore();
const globalStore = useGlobalStore();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const menu = ref();
const selectedItem = ref(null);
const loading = ref(false);
const items = ref([]);
const isEditMode = ref(false);
const busy = ref(false);
const totalRecords = ref();
const showDialog = ref(false);
const deleteDialog = ref(false);
const formData = ref({
    student_id: '',
    name: ''
});

const filterColumnConfigs = [
    { field: 'student_id', filter: TEXT_COLUMN_FILTER },
    { field: 'name', filter: TEXT_COLUMN_FILTER }
];

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        const payload = sortFilters.getSortFilters();
        const res = await studentStore.search(payload, params);
        items.value = res.data;
        totalRecords.value = res.meta.total;
    } finally {
        loading.value = false;
    }
}

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs: filterColumnConfigs,
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
            command: () => editItem(),
            permission: 'core.students.edit'
        },
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => showDeleteDialog(),
            permission: 'core.students.delete'
        }
    ];

    return helpers.filterByPermission(allMenuItems);
});

const openDialog = (mode = 'add') => {
    isEditMode.value = mode === 'edit';
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

const onShow = () => {
    resetForm();
};

const resetForm = () => {
    formData.value = {
        student_id: '',
        name: ''
    };
    globalStore.clearErrors();
};

const editItem = () => {
    resetForm();
    formData.value.student_id = selectedItem.value.student_id;
    formData.value.name = selectedItem.value.name;
    openDialog('edit');
};

const showDeleteDialog = () => {
    deleteDialog.value = true;
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
            await studentStore.update(selectedItem.value.uuid, formData.value);
        } else {
            await studentStore.create(formData.value);
        }
        closeDialog();
        await getItems();
        selectedItem.value = null;
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
            await studentStore.deleteItem(selectedItem.value.uuid);
        }
        await getItems();
        selectedItem.value = null;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <TitleHeader>
        <template #title>
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold">Students</h1>
            </div>
        </template>
        <template #actions>
            <Button
                v-if="$ability.can('core.students.create')"
                label="Add New"
                icon="pi pi-plus"
                @click="openDialog('add')"
            />
        </template>
    </TitleHeader>

    <Card class="py-3 px-2">
        <template #content>
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
                <template #empty> No students found. </template>
                <Column
                    columnKey="student_id"
                    :sortable="true"
                    field="student_id"
                    header="Student ID"
                    :showFilterMenu="false"
                    filterField="student_id"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <span
                            v-tooltip.top="
                                data.student_id?.length > 30
                                    ? data.student_id
                                    : undefined
                            "
                        >
                            {{ truncate(data.student_id, { length: 30 }) }}
                        </span>
                    </template>
                </Column>

                <Column
                    columnKey="name"
                    :sortable="true"
                    field="name"
                    header="Name"
                    :showFilterMenu="false"
                    filterField="name"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <span
                            v-tooltip.top="
                                data.name?.length > 40 ? data.name : undefined
                            "
                        >
                            {{ truncate(data.name, { length: 40 }) }}
                        </span>
                    </template>
                </Column>

                <Column
                    columnKey="actions"
                    v-if="
                        $ability.can('core.students.edit') ||
                        $ability.can('core.students.delete')
                    "
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
                            id="student_overlay_menu"
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
            $ability.can('core.students.edit') ||
            $ability.can('core.students.create')
        "
        v-model:visible="showDialog"
        @update:visible="onShow"
        :busy="busy"
        :isEditMode="isEditMode"
        :header="isEditMode ? 'Edit Student' : 'New Student'"
        :confirmLabel="isEditMode ? 'Update' : 'Save'"
        :formData="formData"
        :initialData="isEditMode ? selectedItem : null"
        :enableDirtyCheck="true"
        :confirmBeforeSave="false"
        @cancel="closeDialog"
        @confirm="save"
    >
        <div class="mb-3 col-span-6">
            <label class="block required mb-3" for="student_id"
                >Student ID</label
            >
            <InputField
                variant="text"
                id="student_id"
                v-model="formData.student_id"
                class="w-full"
                @keyup.enter="save"
                :disabled="busy"
            />
        </div>

        <div class="mb-3 col-span-6">
            <label class="block required mb-3" for="name">Name</label>
            <InputField
                variant="text"
                id="name"
                v-model="formData.name"
                class="w-full"
                @keyup.enter="save"
                :disabled="busy"
            />
        </div>
    </BaseDialog>

    <Confirmation
        v-if="$ability.can('core.students.delete')"
        v-model="deleteDialog"
        variant="danger"
        header="Delete Student"
        content="Are you sure you want to delete this student?"
        @confirm="deleteItem"
    />
</template>
