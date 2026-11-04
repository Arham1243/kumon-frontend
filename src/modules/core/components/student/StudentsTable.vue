<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useStudentStore } from '@/modules/core/stores';
import { useGlobalStore } from '@/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { truncate } from 'lodash-es';
import {
    useCardReader,
    useHelpers,
    useTableColumnFilters,
    waitForNextCardTap
} from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER } from '@/utils/tableFilters';
import InputField from '@/components/common/InputField.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import Confirmation from '@/components/common/Confirmation.vue';
import StudentCardHistoryDialog from '@/modules/core/components/student/StudentCardHistoryDialog.vue';

const helpers = useHelpers();
const studentStore = useStudentStore();
const globalStore = useGlobalStore();
const { readerStatus, onCard } = useCardReader();

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
const cardHistoryDialog = ref(false);
const scanningCard = ref(false);
const scanCancelToken = ref(0);
const formData = ref({
    student_id: '',
    name: '',
    card_uid: ''
});

const readerConnected = computed(() => readerStatus.value === 'connected');

const filterColumnConfigs = [
    { field: 'student_id', filter: TEXT_COLUMN_FILTER },
    { field: 'name', filter: TEXT_COLUMN_FILTER },
    { field: 'card_uid', filter: TEXT_COLUMN_FILTER }
];

function trimCardUid(value) {
    return String(value ?? '').trim();
}

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
            label: 'Card history',
            icon: 'pi pi-history',
            command: () => openCardHistoryDialog(),
            permission: 'core.students.view'
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
    cancelScan();
    showDialog.value = false;
    resetForm();
};

const onShow = () => {
    resetForm();
};

const resetForm = () => {
    formData.value = {
        student_id: '',
        name: '',
        card_uid: ''
    };
    globalStore.clearErrors();
};

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const onStudentIdInput = (value) => {
    formData.value.student_id = digitsOnly(value);
};

const onStudentIdKeydown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }

    const allowed = new Set([
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'Enter'
    ]);

    if (allowed.has(event.key)) {
        return;
    }

    if (event.key.length === 1 && !/^\d$/.test(event.key)) {
        event.preventDefault();
    }
};

const onStudentIdNativeInput = (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
        return;
    }

    const digits = digitsOnly(input.value);
    if (input.value !== digits) {
        input.value = digits;
    }
    formData.value.student_id = digits;
};

const editItem = () => {
    resetForm();
    formData.value.student_id = selectedItem.value.student_id;
    formData.value.name = selectedItem.value.name;
    formData.value.card_uid = selectedItem.value.card_uid ?? '';
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

function buildPayload() {
    const studentId = digitsOnly(formData.value.student_id);
    const cardUid = trimCardUid(formData.value.card_uid);
    const payload = {
        student_id: studentId === '' ? '' : Number(studentId),
        name: formData.value.name,
        card_uid: cardUid === '' ? null : cardUid
    };
    return payload;
}

const save = async () => {
    try {
        busy.value = true;
        const payload = buildPayload();
        if (isEditMode.value) {
            await studentStore.update(selectedItem.value.uuid, payload);
        } else {
            await studentStore.create(payload);
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

function cancelScan() {
    scanCancelToken.value += 1;
    scanningCard.value = false;
}

async function startScanCard() {
    if (!readerConnected.value || scanningCard.value) {
        return;
    }
    scanningCard.value = true;
    const token = ++scanCancelToken.value;
    try {
        const uid = await waitForNextCardTap(onCard, 15000);
        if (token !== scanCancelToken.value) {
            return;
        }
        formData.value.card_uid = uid;
    } catch {
        // timeout or cancelled
    } finally {
        if (token === scanCancelToken.value) {
            scanningCard.value = false;
        }
    }
}

function openCardHistoryDialog() {
    if (!selectedItem.value?.uuid) {
        return;
    }
    cardHistoryDialog.value = true;
}

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
                        {{ data.name }}
                    </template>
                </Column>

                <Column
                    columnKey="card_uid"
                    :sortable="true"
                    field="card_uid"
                    header="Card UID"
                    :showFilterMenu="false"
                    filterField="card_uid"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }"
                        >{{ data.card_uid || '-' }}
                    </template>
                </Column>

                <Column
                    columnKey="actions"
                    v-if="
                        $ability.can('core.students.edit') ||
                        $ability.can('core.students.delete') ||
                        $ability.can('core.students.view')
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
        <div class="col-span-6">
            <label class="block required mb-1" for="student_id"
                >Student ID</label
            >
            <InputField
                variant="text"
                id="student_id"
                :model-value="formData.student_id"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="20"
                class="w-full"
                @update:model-value="onStudentIdInput"
                @keydown="onStudentIdKeydown"
                @input="onStudentIdNativeInput"
                @keyup.enter="save"
                :disabled="busy"
            />
        </div>

        <div class="col-span-6">
            <label class="block required mb-1" for="name">Name</label>
            <InputField
                variant="text"
                id="name"
                v-model="formData.name"
                class="w-full"
                @keyup.enter="save"
                :disabled="busy"
            />
        </div>

        <div class="col-span-12">
            <label class="block mb-1" for="card_uid">Card UID</label>
            <div class="flex flex-wrap items-start gap-2">
                <div class="flex-1 min-w-[12rem]">
                    <InputField
                        variant="text"
                        id="card_uid"
                        v-model="formData.card_uid"
                        class="w-full"
                        maxlength="32"
                        @keyup.enter="save"
                        :disabled="busy || scanningCard"
                    />
                </div>
                <Button
                    v-if="readerConnected"
                    type="button"
                    :label="scanningCard ? 'Waiting for card…' : 'Scan card'"
                    icon="pi pi-wifi"
                    severity="secondary"
                    :disabled="busy"
                    @click="scanningCard ? cancelScan() : startScanCard()"
                />
            </div>
            <p
                v-if="scanningCard"
                class="mt-2 text-sm text-gray-600 dark:text-gray-400"
            >
                Tap a card on the reader, or
                <button
                    type="button"
                    class="underline text-primary"
                    @click="cancelScan"
                >
                    cancel
                </button>
                .
            </p>
        </div>
    </BaseDialog>

    <StudentCardHistoryDialog
        v-model:visible="cardHistoryDialog"
        :student="selectedItem"
    />

    <Confirmation
        v-if="$ability.can('core.students.delete')"
        v-model="deleteDialog"
        variant="danger"
        header="Delete Student"
        content="Are you sure you want to delete this student?"
        @confirm="deleteItem"
    />
</template>
