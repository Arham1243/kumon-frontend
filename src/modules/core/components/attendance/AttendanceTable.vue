<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useAttendanceStore } from '@/modules/core/stores';
import { useGlobalStore } from '@/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER } from '@/utils/tableFilters';
import InputField from '@/components/common/InputField.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import Confirmation from '@/components/common/Confirmation.vue';
import DateRangePresetPicker from '@/components/common/DateRangePresetPicker.vue';
import ExportFormatMenu from '@/components/common/ExportFormatMenu.vue';
import { AttendanceService } from '@/modules/core/services';
import { downloadTabularExport } from '@/utils/downloadBlob';
import { isCompleteDateRange } from '@/utils/dateRangePresets';
import dayjs from '@/plugins/dayjs';

const EXPORT_COLUMNS = [
    'student.name',
    'student.student_id',
    'date',
    'check_in_time',
    'check_out_time'
];

const helpers = useHelpers();

function disableFutureAttendanceDate(date) {
    return dayjs(date).startOf('day').isAfter(dayjs().startOf('day'));
}
const attendanceStore = useAttendanceStore();
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
const loadingStudents = ref(false);
const students = ref([]);
const selectedStudentId = ref(null);
const periodPreset = ref('all');
const dateRangeForRun = ref([null, null]);
const appliedDateRange = ref([]);

const formData = ref({
    student_id: null,
    date: null,
    check_in_time: '',
    check_out_time: ''
});

const filterColumnConfigs = [
    { field: 'student_name', filter: TEXT_COLUMN_FILTER },
    { field: 'student_student_id', filter: TEXT_COLUMN_FILTER },
    { field: 'date', filter: { type: 'text', operator: '=' } },
    { field: 'check_in_time', filter: TEXT_COLUMN_FILTER },
    { field: 'check_out_time', filter: TEXT_COLUMN_FILTER }
];

function makeCustomFiltersPayload() {
    const customFilters = [];
    if (isCompleteDateRange(appliedDateRange.value)) {
        customFilters.push({
            field: 'date_range',
            operator: 'between',
            value: appliedDateRange.value
        });
    }
    return customFilters;
}

function buildSearchPayload() {
    const payload = sortFilters.getSortFilters();
    if (!payload.sort || payload.sort.length === 0) {
        payload.sort = [{ field: 'date', direction: 'desc' }];
    }
    return {
        ...payload,
        customFilters: makeCustomFiltersPayload()
    };
}

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        const res = await attendanceStore.search(buildSearchPayload(), params);
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
    refetch: getItems,
    preserveFilters: ['student_id'],
    fieldAliases: {
        student_name: 'student.name',
        student_student_id: 'student.student_id'
    }
});

async function applyDateFilter() {
    appliedDateRange.value = isCompleteDateRange(dateRangeForRun.value)
        ? [...dateRangeForRun.value]
        : [];
    pagination.resetPageParams();
    await getItems();
}

async function exportFilteredReport(format) {
    try {
        loading.value = true;
        const res = await AttendanceService.exportFile({
            format,
            columns: EXPORT_COLUMNS,
            ...buildSearchPayload()
        });
        downloadTabularExport(res.data, {
            filenameBase: 'attendance',
            format
        });
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}

async function loadStudents(searchText = '') {
    try {
        loadingStudents.value = true;
        const res = await attendanceStore.studentOptions({ search: searchText });
        students.value = res.data ?? [];
    } finally {
        loadingStudents.value = false;
    }
}

watch(selectedStudentId, (value) => {
    pagination.resetPageParams();
    sortFilters.updateFilters('student_id', value, '=');
    getItems();
});

onBeforeMount(async () => {
    await Promise.all([getItems(), loadStudents()]);
});

const menuItems = computed(() => {
    if (!selectedItem.value) return [];

    const allMenuItems = [
        {
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: () => editItem(),
            permission: 'core.attendance.edit'
        },
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => showDeleteDialog(),
            permission: 'core.attendance.delete'
        }
    ];

    return helpers.filterByPermission(allMenuItems);
});

function formatTime(value) {
    if (!value) return '-';
    const parsed = dayjs(String(value).trim().slice(0, 8), 'HH:mm:ss', true);
    const time = parsed.isValid()
        ? parsed
        : dayjs(String(value).trim().slice(0, 5), 'HH:mm', true);
    return time.isValid() ? time.format('hh:mm A') : '-';
}

const openDialog = (mode = 'add') => {
    isEditMode.value = mode === 'edit';
    if (mode === 'add') {
        resetForm();
        if (selectedStudentId.value) {
            formData.value.student_id = selectedStudentId.value;
        }
    }
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

const resetForm = () => {
    formData.value = {
        student_id: null,
        date: null,
        check_in_time: '',
        check_out_time: ''
    };
    globalStore.clearErrors();
};

const editItem = () => {
    resetForm();
    formData.value.student_id = selectedItem.value.student_id;
    formData.value.date = selectedItem.value.date;
    formData.value.check_in_time = selectedItem.value.check_in_time ?? '';
    formData.value.check_out_time = selectedItem.value.check_out_time ?? '';
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
            await attendanceStore.update(selectedItem.value.uuid, formData.value);
        } else {
            await attendanceStore.create(formData.value);
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
            await attendanceStore.deleteItem(selectedItem.value.uuid);
        }
        await getItems();
        selectedItem.value = null;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="mb-6 flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
        <div class="text-center lg:text-left shrink-0">
            <h1 class="text-2xl sm:text-3xl font-bold">Attendance</h1>
        </div>

        <div
            class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 justify-end items-stretch sm:items-end"
        >
            <div class="flex flex-col shrink-0 w-full sm:w-64 md:w-80">
                <label
                    class="block text-sm mb-1 text-surface-700 dark:text-surface-200"
                    for="attendance_student_filter"
                >
                   Filter by Students
                </label>
                <ApiDropdown
                    filter
                    showClear
                    :autoFetchOnMount="false"
                    placeholder="Select"
                    :loading="loadingStudents"
                    @search="(s) => loadStudents(s)"
                    :options="students"
                    optionLabel="name"
                    optionValue="id"
                    id="attendance_student_filter"
                    class="w-full"
                    v-model="selectedStudentId"
                    :disabled="loadingStudents"
                />
            </div>
            <Button
                v-if="$ability.can('core.attendance.create')"
                label="Add New"
                icon="pi pi-plus"
                class="shrink-0"
                @click="openDialog('add')"
            />
        </div>
    </div>

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
                <template #header>
                    <div class="flex justify-end mb-2">
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
                            <ExportFormatMenu
                                :disabled="items.length === 0 || loading"
                                @export="exportFilteredReport"
                            />
                        </div>
                    </div>
                </template>

                <template #empty> No attendance records found. </template>

                <Column
                    columnKey="student_name"
                    header="Name"
                    :sortable="false"
                    :showFilterMenu="false"
                    filterField="student_name"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ data.student?.name ?? '-' }}
                    </template>
                </Column>

                <Column
                    columnKey="student_student_id"
                    header="Student ID"
                    :sortable="false"
                    :showFilterMenu="false"
                    filterField="student_student_id"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ data.student?.student_id ?? '-' }}
                    </template>
                </Column>

                <Column
                    columnKey="date"
                    :sortable="true"
                    field="date"
                    header="Date"
                    :showFilterMenu="false"
                    filterField="date"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="{ type: 'text', operator: '=' }"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ helpers.formatDate(data.date) }}
                    </template>
                </Column>

                <Column
                    columnKey="check_in_time"
                    :sortable="true"
                    field="check_in_time"
                    header="Check In"
                    :showFilterMenu="false"
                    filterField="check_in_time"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ formatTime(data.check_in_time) }}
                    </template>
                </Column>

                <Column
                    columnKey="check_out_time"
                    :sortable="true"
                    field="check_out_time"
                    header="Check Out"
                    :showFilterMenu="false"
                    filterField="check_out_time"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ formatTime(data.check_out_time) }}
                    </template>
                </Column>

                <Column
                    columnKey="actions"
                    v-if="
                        $ability.can('core.attendance.edit') ||
                        $ability.can('core.attendance.delete')
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
                            id="attendance_overlay_menu"
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
            $ability.can('core.attendance.edit') ||
            $ability.can('core.attendance.create')
        "
        v-model:visible="showDialog"
        :busy="busy"
        :isEditMode="isEditMode"
        :header="isEditMode ? 'Edit Attendance' : 'New Attendance'"
        :confirmLabel="isEditMode ? 'Update' : 'Save'"
        :formData="formData"
        :initialData="isEditMode ? selectedItem : null"
        :enableDirtyCheck="true"
        :confirmBeforeSave="false"
        @cancel="closeDialog"
        @confirm="save"
    >
        <div class="mb-3 col-span-6">
            <label class="block required mb-3" for="attendance_student_id"
                >Student</label
            >
            <ApiDropdown
                filter
                :autoFetchOnMount="false"
                :placeholder="'Select'"
                :loading="loadingStudents"
                @search="(s) => loadStudents(s)"
                :options="students"
                optionLabel="name"
                optionValue="id"
                id="attendance_student_id"
                errorKey="student_id"
                class="w-full"
                v-model="formData.student_id"
                :disabled="busy"
            />
        </div>

        <div class="mb-3 col-span-6">
            <label class="block required mb-3" for="attendance_date"
                >Date</label
            >
            <InputField
                variant="date"
                id="attendance_date"
                errorKey="date"
                v-model="formData.date"
                class="w-full"
                :disabled="busy"
                :disabled-date="disableFutureAttendanceDate"
            />
        </div>

        <div class="mb-3 col-span-6">
            <label class="block required mb-3" for="check_in_time"
                >Check In</label
            >
            <InputField
                variant="time"
                id="check_in_time"
                errorKey="check_in_time"
                v-model="formData.check_in_time"
                class="w-full"
                :disabled="busy"
            />
        </div>

        <div class="mb-3 col-span-6">
            <label class="block required mb-3" for="check_out_time"
                >Check Out</label
            >
            <InputField
                variant="time"
                id="check_out_time"
                errorKey="check_out_time"
                v-model="formData.check_out_time"
                class="w-full"
                :disabled="busy"
            />
        </div>
    </BaseDialog>

    <Confirmation
        v-if="$ability.can('core.attendance.delete')"
        v-model="deleteDialog"
        variant="danger"
        header="Delete Attendance"
        content="Are you sure you want to delete this attendance record?"
        @confirm="deleteItem"
    />
</template>
