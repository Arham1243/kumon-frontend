<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useAttendanceStore } from '@/modules/core/stores';
import { useGlobalStore, useSessionStore } from '@/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import { TEXT_COLUMN_FILTER } from '@/utils/tableFilters';
import InputField from '@/components/common/InputField.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import DateRangePresetPicker from '@/components/common/DateRangePresetPicker.vue';
import ExportFormatMenu from '@/components/common/ExportFormatMenu.vue';
import { AttendanceService } from '@/modules/core/services';
import { downloadTabularExport } from '@/utils/downloadBlob';
import {
    isCompleteDateRange,
    normalizeDateRange,
    rangeForPreset
} from '@/utils/dateRangePresets';
import dayjs from '@/plugins/dayjs';
import Checkbox from 'primevue/checkbox';

const EXPORT_COLUMNS = [
    'student.name',
    'student.student_id',
    'date',
    'check_in_time',
    'check_out_time'
];

const helpers = useHelpers();

/**
 * Match Students status filters: compact circular count badges.
 */
const ATT_COUNT_BADGE_BASE =
    'inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full border text-center text-[9px] font-bold tabular-nums leading-none shadow-sm';
const STATUS_COUNT_BADGE_ACTIVE_CHECKED_IN = `${ATT_COUNT_BADGE_BASE} border-white/80 bg-white text-emerald-900 dark:border-emerald-200/30 dark:bg-emerald-950 dark:text-emerald-50`;
const STATUS_COUNT_BADGE_INACTIVE_CHECKED_IN = `${ATT_COUNT_BADGE_BASE} border-emerald-600/25 bg-emerald-600/25 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-50`;
const STATUS_COUNT_BADGE_ACTIVE_CHECKED_OUT = `${ATT_COUNT_BADGE_BASE} border-white/80 bg-white text-violet-950 dark:border-violet-200/30 dark:bg-violet-950 dark:text-violet-50`;
const STATUS_COUNT_BADGE_INACTIVE_CHECKED_OUT = `${ATT_COUNT_BADGE_BASE} border-violet-600/25 bg-violet-600/25 text-violet-950 dark:border-violet-400/35 dark:bg-violet-400/20 dark:text-violet-50`;
const STATUS_COUNT_BADGE_ACTIVE_NOT_CHECKED_OUT = `${ATT_COUNT_BADGE_BASE} border-white/80 bg-white text-rose-950 dark:border-rose-200/30 dark:bg-rose-950 dark:text-rose-50`;
const STATUS_COUNT_BADGE_INACTIVE_NOT_CHECKED_OUT = `${ATT_COUNT_BADGE_BASE} border-rose-600/25 bg-rose-600/25 text-rose-950 dark:border-rose-400/35 dark:bg-rose-400/20 dark:text-rose-50`;

/** Same checkbox treatment as Students: white box + preset check when selected */
const FILTER_CB_WRAP_CHECKED_IN =
    '[&_.p-checkbox]:!inline-flex [&_.p-checkbox]:!items-center ' +
    '[&_.p-checkbox-box]:!border-2 [&_.p-checkbox-box]:shadow-none ' +
    '[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-emerald-300 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-emerald-50 ' +
    'dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-emerald-600 dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-emerald-950/30 ' +
    '[&_.p-checkbox-checked_.p-checkbox-box]:!border-white [&_.p-checkbox-checked_.p-checkbox-box]:!bg-white ' +
    '[&_.p-checkbox-checked_.p-checkbox-icon]:!text-emerald-600 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-icon]:!text-emerald-800 ' +
    'dark:[&_.p-checkbox-checked_.p-checkbox-icon]:!text-emerald-500';
const FILTER_CB_WRAP_CHECKED_OUT =
    '[&_.p-checkbox]:!inline-flex [&_.p-checkbox]:!items-center ' +
    '[&_.p-checkbox-box]:!border-2 [&_.p-checkbox-box]:shadow-none ' +
    '[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-violet-400 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-violet-50 ' +
    'dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-violet-500 dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-violet-950/40 ' +
    '[&_.p-checkbox-checked_.p-checkbox-box]:!border-white [&_.p-checkbox-checked_.p-checkbox-box]:!bg-white ' +
    '[&_.p-checkbox-checked_.p-checkbox-icon]:!text-violet-600 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-icon]:!text-violet-800 ' +
    'dark:[&_.p-checkbox-checked_.p-checkbox-icon]:!text-violet-500';
const FILTER_CB_WRAP_NOT_CHECKED_OUT =
    '[&_.p-checkbox]:!inline-flex [&_.p-checkbox]:!items-center ' +
    '[&_.p-checkbox-box]:!border-2 [&_.p-checkbox-box]:shadow-none ' +
    '[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-rose-400 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-rose-50 ' +
    'dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-rose-500 dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-rose-950/40 ' +
    '[&_.p-checkbox-checked_.p-checkbox-box]:!border-white [&_.p-checkbox-checked_.p-checkbox-box]:!bg-white ' +
    '[&_.p-checkbox-checked_.p-checkbox-icon]:!text-rose-600 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-icon]:!text-rose-900 ' +
    'dark:[&_.p-checkbox-checked_.p-checkbox-icon]:!text-rose-500';

function disableFutureAttendanceDate(date) {
    return dayjs(date).startOf('day').isAfter(dayjs().startOf('day'));
}
const attendanceStore = useAttendanceStore();
const globalStore = useGlobalStore();
const sessionStore = useSessionStore();

const kioskUrl = computed(() => {
    const uuid = sessionStore.myCompany?.uuid;
    if (!uuid) {
        return null;
    }
    return `${window.location.origin}/attendance/${uuid}`;
});

const studentIdKioskUrl = computed(() => {
    const uuid = sessionStore.myCompany?.uuid;
    if (!uuid) {
        return null;
    }
    return `${window.location.origin}/attendance/${uuid}/id`;
});

function openKiosk() {
    if (kioskUrl.value) {
        window.open(kioskUrl.value, '_blank', 'noopener,noreferrer');
    }
}

function openStudentIdKiosk() {
    if (studentIdKioskUrl.value) {
        window.open(studentIdKioskUrl.value, '_blank', 'noopener,noreferrer');
    }
}

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const selectedItem = ref(null);
const loading = ref(false);
const items = ref([]);
const isEditMode = ref(false);
const busy = ref(false);
const totalRecords = ref();
const showDialog = ref(false);
const loadingStudents = ref(false);
const students = ref([]);

const todayRange = normalizeDateRange(rangeForPreset('today'));
const periodPreset = ref('today');
const dateRangeForRun = ref(todayRange ? [...todayRange] : [null, null]);
const appliedDateRange = ref(
    todayRange ? [...todayRange] : []
);

const statusFilter = ref(null);
const loadingSummary = ref(false);
const checkInCount = ref(0);
const checkOutCount = ref(0);
const notCheckedOutCount = ref(0);

const formData = ref({
    student_id: null,
    date: null,
    check_in_time: null,
    check_out_time: null
});

const filterColumnConfigs = [
    { field: 'student_name', filter: TEXT_COLUMN_FILTER },
    { field: 'student_student_id', filter: TEXT_COLUMN_FILTER },
    { field: 'date', filter: { type: 'text', operator: '=' } },
    { field: 'check_in_time', filter: TEXT_COLUMN_FILTER },
    { field: 'check_out_time', filter: TEXT_COLUMN_FILTER }
];

function makeDateCustomFilters() {
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

function makeCustomFiltersPayload() {
    const customFilters = [...makeDateCustomFilters()];
    if (statusFilter.value) {
        customFilters.push({
            field: 'attendance_status',
            operator: '=',
            value: statusFilter.value
        });
    }
    return customFilters;
}

function buildSummaryPayload() {
    return {
        customFilters: makeDateCustomFilters()
    };
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

async function fetchTable() {
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

async function refreshSummary() {
    try {
        loadingSummary.value = true;
        const res = await AttendanceService.summary(buildSummaryPayload());
        const d = res.data?.data ?? res.data;
        if (d) {
            checkInCount.value = d.check_in_count ?? 0;
            checkOutCount.value = d.check_out_count ?? 0;
            notCheckedOutCount.value = d.not_checked_out_count ?? 0;
        }
    } catch (error) {
        console.error(error);
    } finally {
        loadingSummary.value = false;
    }
}

async function getItems() {
    await fetchTable();
    await refreshSummary();
}

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs: filterColumnConfigs,
    sortFilters,
    pagination,
    refetch: fetchTable,
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

function toggleCheckedInFilter() {
    if (statusFilter.value === 'checked_in') {
        statusFilter.value = null;
    } else {
        statusFilter.value = 'checked_in';
    }
    pagination.resetPageParams();
    getItems();
}

function toggleCheckedOutFilter() {
    if (statusFilter.value === 'checked_out') {
        statusFilter.value = null;
    } else {
        statusFilter.value = 'checked_out';
    }
    pagination.resetPageParams();
    getItems();
}

function toggleNotCheckedOutFilter() {
    if (statusFilter.value === 'not_checked_out') {
        statusFilter.value = null;
    } else {
        statusFilter.value = 'not_checked_out';
    }
    pagination.resetPageParams();
    getItems();
}

async function exportFilteredReport(format) {
    try {
        loading.value = true;
        const exportPayload = buildSearchPayload();
        const statusIdx = exportPayload.customFilters.findIndex(
            (f) => f.field === 'attendance_status'
        );
        if (statusIdx !== -1) {
            exportPayload.customFilters = exportPayload.customFilters.filter(
                (f) => f.field !== 'attendance_status'
            );
        }
        const res = await AttendanceService.exportFile({
            format,
            columns: EXPORT_COLUMNS,
            ...exportPayload
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
        const res = await attendanceStore.studentOptions({
            search: searchText
        });
        students.value = res.data ?? [];
    } finally {
        loadingStudents.value = false;
    }
}

onBeforeMount(async () => {
    await Promise.all([getItems(), loadStudents()]);
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
        check_in_time: null,
        check_out_time: null
    };
    globalStore.clearErrors();
};

const editItem = (item) => {
    selectedItem.value = item;
    resetForm();
    formData.value.student_id = item.student_id;
    formData.value.date = item.date;
    formData.value.check_in_time = item.check_in_time || null;
    formData.value.check_out_time = item.check_out_time || null;
    openDialog('edit');
};

const onSortChange = (event) => {
    pagination.resetPageParams();
    sortFilters.updateSortFilters(event);
    fetchTable();
};

const onPageChange = (event) => {
    pagination.updatePageParams(event);
    fetchTable();
};

const save = async () => {
    try {
        busy.value = true;
        if (isEditMode.value) {
            await attendanceStore.update(
                selectedItem.value.uuid,
                formData.value
            );
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
            <Button
                v-if="kioskUrl"
                label="Student Attendance (Scan)"
                icon="pi pi-external-link"
                severity="success"
                class="shrink-0"
                @click="openKiosk"
            />
            <Button
                v-if="studentIdKioskUrl"
                label="Student Attendance (Manual)"
                icon="pi pi-external-link"
                severity="success"
                class="shrink-0"
                @click="openStudentIdKiosk"
            />
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
                    <div
                        class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-2"
                    >
                        <div
                            class="flex flex-wrap items-center gap-2 min-h-[2.5rem]"
                        >
                            <Button
                                type="button"
                                :severity="
                                    statusFilter === 'checked_in'
                                        ? 'success'
                                        : undefined
                                "
                                :variant="
                                    statusFilter === 'checked_in'
                                        ? undefined
                                        : 'outlined'
                                "
                                :class="[
                                    '!items-center',
                                    statusFilter === 'checked_in'
                                        ? undefined
                                        : '!bg-emerald-50 !border-emerald-300 !text-emerald-900 hover:!bg-emerald-100 dark:!bg-emerald-950/30 dark:!border-emerald-600 dark:!text-emerald-50'
                                ]"
                                :disabled="loading"
                                :aria-pressed="statusFilter === 'checked_in'"
                                aria-label="Filter by checked in attendance"
                                @click="toggleCheckedInFilter"
                            >
                                <span
                                    class="inline-flex items-center justify-center gap-2 leading-none"
                                >
                                    <span
                                        class="pointer-events-none inline-flex shrink-0 items-center self-center"
                                        :class="FILTER_CB_WRAP_CHECKED_IN"
                                        aria-hidden="true"
                                    >
                                        <Checkbox
                                            :model-value="
                                                statusFilter === 'checked_in'
                                            "
                                            binary
                                            readonly
                                            :disabled="loading"
                                            :tabindex="-1"
                                        />
                                    </span>
                                    <span class="self-center leading-none">Checked in</span>
                                    <span
                                        class="self-center"
                                        :class="
                                            statusFilter === 'checked_in'
                                                ? STATUS_COUNT_BADGE_ACTIVE_CHECKED_IN
                                                : STATUS_COUNT_BADGE_INACTIVE_CHECKED_IN
                                        "
                                        aria-hidden="true"
                                    >
                                        {{ checkInCount }}
                                    </span>
                                </span>
                            </Button>
                            <Button
                                type="button"
                                :severity="
                                    statusFilter === 'checked_out'
                                        ? 'help'
                                        : undefined
                                "
                                :variant="
                                    statusFilter === 'checked_out'
                                        ? undefined
                                        : 'outlined'
                                "
                                :class="[
                                    '!items-center',
                                    statusFilter === 'checked_out'
                                        ? undefined
                                        : '!bg-violet-50 !border-violet-300 !text-violet-950 hover:!bg-violet-100 dark:!bg-violet-950/40 dark:!border-violet-500 dark:!text-violet-50'
                                ]"
                                :disabled="loading"
                                :aria-pressed="statusFilter === 'checked_out'"
                                aria-label="Filter by checked out attendance"
                                @click="toggleCheckedOutFilter"
                            >
                                <span
                                    class="inline-flex items-center justify-center gap-2 leading-none"
                                >
                                    <span
                                        class="pointer-events-none inline-flex shrink-0 items-center self-center"
                                        :class="FILTER_CB_WRAP_CHECKED_OUT"
                                        aria-hidden="true"
                                    >
                                        <Checkbox
                                            :model-value="
                                                statusFilter === 'checked_out'
                                            "
                                            binary
                                            readonly
                                            :disabled="loading"
                                            :tabindex="-1"
                                        />
                                    </span>
                                    <span class="self-center leading-none">Checked out</span>
                                    <span
                                        class="self-center"
                                        :class="
                                            statusFilter === 'checked_out'
                                                ? STATUS_COUNT_BADGE_ACTIVE_CHECKED_OUT
                                                : STATUS_COUNT_BADGE_INACTIVE_CHECKED_OUT
                                        "
                                        aria-hidden="true"
                                    >
                                        {{ checkOutCount }}
                                    </span>
                                </span>
                            </Button>
                            <Button
                                type="button"
                                :severity="
                                    statusFilter === 'not_checked_out'
                                        ? 'danger'
                                        : undefined
                                "
                                :variant="
                                    statusFilter === 'not_checked_out'
                                        ? undefined
                                        : 'outlined'
                                "
                                :class="[
                                    '!items-center',
                                    statusFilter === 'not_checked_out'
                                        ? undefined
                                        : '!bg-rose-50 !border-rose-300 !text-rose-900 hover:!bg-rose-100 dark:!bg-rose-950/40 dark:!border-rose-600 dark:!text-rose-50'
                                ]"
                                :disabled="loading"
                                :aria-pressed="
                                    statusFilter === 'not_checked_out'
                                "
                                aria-label="Filter by not checked out or all students"
                                @click="toggleNotCheckedOutFilter"
                            >
                                <span
                                    class="inline-flex items-center justify-center gap-2 leading-none"
                                >
                                    <span
                                        class="pointer-events-none inline-flex shrink-0 items-center self-center"
                                        :class="FILTER_CB_WRAP_NOT_CHECKED_OUT"
                                        aria-hidden="true"
                                    >
                                        <Checkbox
                                            :model-value="
                                                statusFilter ===
                                                'not_checked_out'
                                            "
                                            binary
                                            readonly
                                            :disabled="loading"
                                            :tabindex="-1"
                                        />
                                    </span>
                                    <span class="self-center leading-none">{{
                                        statusFilter === 'not_checked_out'
                                            ? 'All Students'
                                            : 'Not Checked Out'
                                    }}</span>
                                    <span
                                        v-if="
                                            statusFilter !== 'not_checked_out'
                                        "
                                        class="self-center"
                                        :class="
                                            statusFilter === 'not_checked_out'
                                                ? STATUS_COUNT_BADGE_ACTIVE_NOT_CHECKED_OUT
                                                : STATUS_COUNT_BADGE_INACTIVE_NOT_CHECKED_OUT
                                        "
                                        aria-hidden="true"
                                    >
                                        {{ notCheckedOutCount }}
                                    </span>
                                </span>
                            </Button>
                        </div>
                        <div class="flex flex-nowrap items-end gap-2 shrink-0">
                            <DateRangePresetPicker
                                v-model:date-range="dateRangeForRun"
                                v-model:preset="periodPreset"
                                default-preset="today"
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
                    v-if="$ability.can('core.attendance.edit')"
                    header="Actions"
                    class="flex justify-end"
                >
                    <template #body="{ data }">
                        <Button
                            type="button"
                            icon="pi pi-pencil"
                            severity="primary"
                            rounded
                            aria-label="Edit attendance"
                            :disabled="loading"
                            @click="editItem(data)"
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
</template>
