<script setup>
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
import { useStudentStore } from '@/modules/core/stores';
import { useGlobalStore } from '@/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { truncate } from 'lodash-es';
import { useHelpers, useTableColumnFilters } from '@/composables';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import CardScanner from '@/components/common/CardScanner.vue';
import {
    NUMBER_COLUMN_FILTER,
    ROLE_STATUS_FILTER,
    TEXT_COLUMN_FILTER
} from '@/utils/tableFilters';
import InputField from '@/components/common/InputField.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import dayjs from '@/plugins/dayjs';
import { isCompleteDateRange } from '@/utils/dateRangePresets';
import { ability } from '@/plugins/ability';

const helpers = useHelpers();

/**
 * Match Attendance filter buttons: compact circular count badges.
 */
const STU_COUNT_BADGE_BASE =
    'inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full border text-center text-[9px] font-bold tabular-nums leading-none shadow-sm';
const STU_BADGE_ACTIVE_ON = `${STU_COUNT_BADGE_BASE} border-white/80 bg-white text-emerald-900 dark:border-emerald-200/30 dark:bg-emerald-950 dark:text-emerald-50`;
const STU_BADGE_ACTIVE_OFF = `${STU_COUNT_BADGE_BASE} border-emerald-600/25 bg-emerald-600/25 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-50`;
const STU_BADGE_INACTIVE_ON = `${STU_COUNT_BADGE_BASE} border-white/80 bg-white text-rose-950 dark:border-rose-200/30 dark:bg-rose-950 dark:text-rose-50`;
const STU_BADGE_INACTIVE_OFF = `${STU_COUNT_BADGE_BASE} border-rose-600/25 bg-rose-600/25 text-rose-950 dark:border-rose-400/35 dark:bg-rose-400/20 dark:text-rose-50`;

const FILTER_CB_WRAP_ACTIVE =
    '[&_.p-checkbox]:!inline-flex [&_.p-checkbox]:!items-center ' +
    '[&_.p-checkbox-box]:!border-2 [&_.p-checkbox-box]:shadow-none ' +
    '[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-emerald-300 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-emerald-50 ' +
    'dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-emerald-600 dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-emerald-950/30 ' +
    '[&_.p-checkbox-checked_.p-checkbox-box]:!border-white [&_.p-checkbox-checked_.p-checkbox-box]:!bg-white ' +
    '[&_.p-checkbox-checked_.p-checkbox-icon]:!text-emerald-600 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-icon]:!text-emerald-800 ' +
    'dark:[&_.p-checkbox-checked_.p-checkbox-icon]:!text-emerald-500';
const FILTER_CB_WRAP_INACTIVE =
    '[&_.p-checkbox]:!inline-flex [&_.p-checkbox]:!items-center ' +
    '[&_.p-checkbox-box]:!border-2 [&_.p-checkbox-box]:shadow-none ' +
    '[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-rose-400 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-rose-50 ' +
    'dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!border-rose-500 dark:[&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-box]:!bg-rose-950/40 ' +
    '[&_.p-checkbox-checked_.p-checkbox-box]:!border-white [&_.p-checkbox-checked_.p-checkbox-box]:!bg-white ' +
    '[&_.p-checkbox-checked_.p-checkbox-icon]:!text-rose-600 [&_.p-checkbox:not(.p-checkbox-checked)_.p-checkbox-icon]:!text-rose-900 ' +
    'dark:[&_.p-checkbox-checked_.p-checkbox-icon]:!text-rose-500';

const router = useRouter();
const studentStore = useStudentStore();
const globalStore = useGlobalStore();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const dialogRef = ref(null);
const loading = ref(false);
const items = ref([]);
const busy = ref(false);
const totalRecords = ref();
const showDialog = ref(false);
const assignCardEnabled = ref(false);
const assignCardFlowStarted = ref(false);
const activeCount = ref(0);
const inactiveCount = ref(0);
const loadingSummary = ref(false);

/** Date range filter (applied on arrow click; preserved when column filters sync). */
const DATE_RANGE_FILTER_KEYS = ['start_date', 'end_date'];
const dateRangeForRun = ref([null, null]);
const appliedDateRange = ref([]);
const studentDateRangeMode = ref('start_date');

function startAssignCardFlow() {
    assignCardFlowStarted.value = true;
    assignCardEnabled.value = true;
}
const assigningId = ref(false);
const previewStudentId = ref('');
const nextIdToken = ref(0);
const formData = ref({
    name: '',
    parent_1_mobile: '',
    parent_2_mobile: '',
    start_date: null,
    maths: false,
    reading: false,
    tuition_fee: null,
    card_uid: ''
});

const cardUidError = computed(() => {
    const fieldErrors = globalStore.errors?.card_uid;
    if (!fieldErrors) {
        return '';
    }
    if (Array.isArray(fieldErrors)) {
        return fieldErrors[0] ?? '';
    }
    return String(fieldErrors);
});

const filterColumnConfigs = [
    { field: 'student_id', filter: TEXT_COLUMN_FILTER },
    { field: 'name', filter: TEXT_COLUMN_FILTER },
    { field: 'parent_1_mobile', filter: TEXT_COLUMN_FILTER },
    { field: 'parent_2_mobile', filter: TEXT_COLUMN_FILTER },
    { field: 'tuition_fee', filter: NUMBER_COLUMN_FILTER },
    { field: 'card_uid', filter: TEXT_COLUMN_FILTER },
    {
        field: 'status',
        filter: { ...ROLE_STATUS_FILTER, defaultValue: true }
    }
];

function emptyToNull(value) {
    const trimmed = String(value ?? '').trim();
    return trimmed === '' ? null : trimmed;
}

function trimCardUid(value) {
    return String(value ?? '').trim();
}

function defaultSortPayload() {
    return [
        { field: 'status', direction: 'desc' },
        { field: 'name', direction: 'asc' }
    ];
}

function mergeDateRangeIntoPayload(payload) {
    const next = { ...payload, filters: [...(payload.filters || [])] };
    const withoutRange = next.filters.filter(
        (f) => !DATE_RANGE_FILTER_KEYS.includes(f.field)
    );
    next.filters = withoutRange;

    if (!isCompleteDateRange(appliedDateRange.value)) {
        return next;
    }

    const field =
        studentDateRangeMode.value === 'end_date' ? 'end_date' : 'start_date';
    const [from, to] = appliedDateRange.value;
    next.filters.push(
        { field, operator: '>=', value: from },
        { field, operator: '<=', value: to }
    );
    return next;
}

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        let payload = sortFilters.getSortFilters();
        if (!payload.sort || payload.sort.length === 0) {
            payload.sort = defaultSortPayload();
        }
        payload = mergeDateRangeIntoPayload(payload);
        const res = await studentStore.search(payload, params);
        items.value = res.data;
        totalRecords.value = res.meta.total;
    } finally {
        loading.value = false;
    }
}

const { primeFilters, onColumnFilter, applyColumnFilters } =
    useTableColumnFilters({
        columnConfigs: filterColumnConfigs,
        sortFilters,
        pagination,
        refetch: getItems,
        preserveFilters: DATE_RANGE_FILTER_KEYS
    });

async function applyStudentDateFilter() {
    appliedDateRange.value = isCompleteDateRange(dateRangeForRun.value)
        ? [...dateRangeForRun.value]
        : [];
    pagination.resetPageParams();
    await getItems();
}

const statusFilterValue = computed(() => {
    const raw = primeFilters.value?.status?.value;
    if (raw === true || raw === false) {
        return raw;
    }
    return null;
});

function setStatusFilterValue(next) {
    const meta = primeFilters.value?.status;
    if (!meta) {
        return;
    }
    if (next === null || next === undefined) {
        meta.value = null;
        meta.matchMode = FilterMatchMode.EQUALS;
    } else {
        meta.value = next;
        meta.matchMode = FilterMatchMode.EQUALS;
    }
}

function toggleActiveFilter() {
    if (statusFilterValue.value === true) {
        setStatusFilterValue(null);
    } else {
        setStatusFilterValue(true);
    }
    applyColumnFilters();
}

function toggleInactiveFilter() {
    if (statusFilterValue.value === false) {
        setStatusFilterValue(null);
    } else {
        setStatusFilterValue(false);
    }
    applyColumnFilters();
}

async function refreshStatusCounts() {
    try {
        loadingSummary.value = true;
        const countParams = { page: 1, limit: 1 };
        const payloadBase = {
            search: { value: '' },
            sort: defaultSortPayload(),
            filters: []
        };
        const [activeRes, inactiveRes] = await Promise.all([
            studentStore.search(
                {
                    ...payloadBase,
                    filters: [{ field: 'status', operator: '=', value: true }]
                },
                countParams
            ),
            studentStore.search(
                {
                    ...payloadBase,
                    filters: [{ field: 'status', operator: '=', value: false }]
                },
                countParams
            )
        ]);
        activeCount.value = activeRes.meta?.total ?? 0;
        inactiveCount.value = inactiveRes.meta?.total ?? 0;
    } catch (error) {
        console.error(error);
    } finally {
        loadingSummary.value = false;
    }
}

onBeforeMount(async () => {
    await Promise.all([getItems(), refreshStatusCounts()]);
});

const dialogHeader = computed(() => {
    const base = 'New Student';
    const id = previewStudentId.value;
    if (id !== null && id !== undefined && id !== '') {
        return `${base}, ID: ${id}`;
    }
    return base;
});

const openDialog = () => {
    resetForm();
    assigningId.value = true;
    loadNextStudentId();
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

watch(assignCardEnabled, (enabled) => {
    if (!enabled) {
        formData.value.card_uid = '';
        assignCardFlowStarted.value = false;
    }
});

const onShow = (visible) => {
    if (visible) {
        return;
    }
    nextIdToken.value += 1;
    assigningId.value = false;
    previewStudentId.value = '';
    resetForm();
};

async function loadNextStudentId() {
    const token = ++nextIdToken.value;
    assigningId.value = true;
    previewStudentId.value = '';
    try {
        const res = await studentStore.nextStudentId();
        if (token !== nextIdToken.value || !showDialog.value) {
            return;
        }
        previewStudentId.value = res?.data?.student_id ?? '';
        if (isAddFormUntouched()) {
            await nextTick();
            dialogRef.value?.resetDirty();
        }
    } catch (error) {
        console.error(error);
    } finally {
        if (token === nextIdToken.value) {
            assigningId.value = false;
        }
    }
}

function isAddFormUntouched() {
    const form = formData.value;
    return (
        !String(form.name ?? '').trim() &&
        !String(form.parent_1_mobile ?? '').trim() &&
        !String(form.parent_2_mobile ?? '').trim() &&
        !form.start_date &&
        !form.maths &&
        !form.reading &&
        (form.tuition_fee === null ||
            form.tuition_fee === '' ||
            form.tuition_fee === undefined) &&
        !String(form.card_uid ?? '').trim() &&
        !assignCardEnabled.value
    );
}

const resetForm = () => {
    assignCardFlowStarted.value = false;
    assignCardEnabled.value = false;
    formData.value = {
        name: '',
        parent_1_mobile: '',
        parent_2_mobile: '',
        start_date: null,
        maths: false,
        reading: false,
        tuition_fee: null,
        card_uid: ''
    };
    globalStore.clearErrors();
};

function studentRowClass() {
    return ability.can('core.students.edit') ? 'cursor-pointer' : undefined;
}

function onStudentRowClick(event) {
    if (!ability.can('core.students.edit')) {
        return;
    }
    const row = event.data;
    if (!row?.uuid) {
        return;
    }
    router.push({ name: 'EditStudent', params: { uuid: row.uuid } });
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

function buildPayload() {
    const fee = formData.value.tuition_fee;
    const payload = {
        name: formData.value.name,
        parent_1_mobile: emptyToNull(formData.value.parent_1_mobile),
        parent_2_mobile: emptyToNull(formData.value.parent_2_mobile),
        start_date: formData.value.start_date,
        maths: formData.value.maths ? 1 : 0,
        reading: formData.value.reading ? 1 : 0,
        tuition_fee:
            fee === null || fee === undefined || fee === '' ? null : Number(fee)
    };

    const cardUid = assignCardEnabled.value
        ? trimCardUid(formData.value.card_uid)
        : '';
    payload.card_uid = cardUid === '' ? null : cardUid;

    return payload;
}

const save = async () => {
    if (!previewStudentId.value || !formData.value.start_date) {
        return;
    }
    try {
        busy.value = true;
        const payload = buildPayload();
        await studentStore.create(payload);
        closeDialog();
        await Promise.all([getItems(), refreshStatusCounts()]);
    } catch (error) {
        console.error(error);
    } finally {
        busy.value = false;
    }
};

function onCreateCardScan(uid) {
    if (busy.value) {
        return;
    }
    globalStore.clearErrors();
    formData.value.card_uid = uid;
}

</script>

<template>
    <div class="mb-7 w-full min-w-0">
        <div
            class="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 pb-0.5 sm:gap-x-3"
        >
            <div
                class="col-start-1 flex min-w-0 flex-nowrap items-center justify-self-start gap-x-2 sm:gap-x-3"
            >
                <h1 class="shrink-0 text-xl font-bold leading-none sm:text-2xl">
                    Students
                </h1>
                <div class="flex shrink-0 flex-nowrap items-center gap-2">
                    <Button
                        type="button"
                        :severity="
                            statusFilterValue === true ? 'success' : undefined
                        "
                        :variant="
                            statusFilterValue === true ? undefined : 'outlined'
                        "
                        :class="[
                            '!items-center',
                            statusFilterValue === true
                                ? undefined
                                : '!bg-emerald-50 !border-emerald-300 !text-emerald-900 hover:!bg-emerald-100 dark:!bg-emerald-950/30 dark:!border-emerald-600 dark:!text-emerald-50'
                        ]"
                        :disabled="loading || loadingSummary"
                        :aria-pressed="statusFilterValue === true"
                        aria-label="Filter by active students"
                        @click="toggleActiveFilter"
                    >
                        <span
                            class="inline-flex items-center justify-center gap-2 leading-none"
                        >
                            <span
                                class="pointer-events-none inline-flex shrink-0 items-center self-center"
                                :class="FILTER_CB_WRAP_ACTIVE"
                                aria-hidden="true"
                            >
                                <Checkbox
                                    :model-value="statusFilterValue === true"
                                    binary
                                    readonly
                                    :disabled="loading || loadingSummary"
                                    :tabindex="-1"
                                />
                            </span>
                            <span class="self-center leading-none">Active</span>
                            <span
                                class="self-center"
                                :class="
                                    statusFilterValue === true
                                        ? STU_BADGE_ACTIVE_ON
                                        : STU_BADGE_ACTIVE_OFF
                                "
                                aria-hidden="true"
                            >
                                {{ activeCount }}
                            </span>
                        </span>
                    </Button>
                    <Button
                        type="button"
                        :severity="
                            statusFilterValue === false ? 'danger' : undefined
                        "
                        :variant="
                            statusFilterValue === false ? undefined : 'outlined'
                        "
                        :class="[
                            '!items-center',
                            statusFilterValue === false
                                ? undefined
                                : '!bg-rose-50 !border-rose-300 !text-rose-900 hover:!bg-rose-100 dark:!bg-rose-950/40 dark:!border-rose-600 dark:!text-rose-50'
                        ]"
                        :disabled="loading || loadingSummary"
                        :aria-pressed="statusFilterValue === false"
                        aria-label="Filter by inactive students"
                        @click="toggleInactiveFilter"
                    >
                        <span
                            class="inline-flex items-center justify-center gap-2 leading-none"
                        >
                            <span
                                class="pointer-events-none inline-flex shrink-0 items-center self-center"
                                :class="FILTER_CB_WRAP_INACTIVE"
                                aria-hidden="true"
                            >
                                <Checkbox
                                    :model-value="statusFilterValue === false"
                                    binary
                                    readonly
                                    :disabled="loading || loadingSummary"
                                    :tabindex="-1"
                                />
                            </span>
                            <span class="self-center leading-none"
                                >Inactive</span
                            >
                            <span
                                class="self-center"
                                :class="
                                    statusFilterValue === false
                                        ? STU_BADGE_INACTIVE_ON
                                        : STU_BADGE_INACTIVE_OFF
                                "
                                aria-hidden="true"
                            >
                                {{ inactiveCount }}
                            </span>
                        </span>
                    </Button>
                </div>
            </div>
            <div
                class="col-start-2 min-w-0 justify-self-center px-0.5 sm:px-1"
            >
                <div
                    class="flex flex-nowrap items-center gap-3 rounded-lg border border-surface-200 bg-surface-0 px-2 py-1.5 shadow-sm dark:border-surface-600 sm:gap-4 sm:px-2.5"
                >
                    <div
                        class="student-toolbar-date-range flex min-w-[18rem] max-w-[26rem] flex-1 items-center gap-1.5 sm:min-w-[20rem] sm:max-w-[28rem]"
                    >
                        <label
                            class="datatable-column-header-text shrink-0 text-xs leading-none text-surface-600 dark:text-surface-400"
                            for="student_filter_date_range"
                        >
                            Date Range
                        </label>
                        <InputField
                            id="student_filter_date_range"
                            v-model="dateRangeForRun"
                            variant="date"
                            :range="true"
                            class="min-w-0 flex-1"
                            :disabled="loading || loadingSummary"
                            placeholder="Select"
                        />
                    </div>
                    <div
                        class="ml-4 flex shrink-0 flex-nowrap items-center gap-2 sm:ml-5 sm:gap-3"
                    >
                        <span
                            class="datatable-column-header-text shrink-0 text-xs font-semibold leading-none text-surface-700 dark:text-surface-200"
                            >Filter by</span
                        >
                        <div
                            class="inline-flex flex-nowrap items-center gap-2 sm:gap-3"
                        >
                            <div class="inline-flex items-center gap-2">
                                <RadioButton
                                    v-model="studentDateRangeMode"
                                    input-id="student-date-range-start"
                                    value="start_date"
                                    :disabled="loading || loadingSummary"
                                />
                                <label
                                    class="cursor-pointer whitespace-nowrap text-sm font-medium leading-tight text-surface-900 dark:text-surface-50"
                                    for="student-date-range-start"
                                    >Started at</label
                                >
                            </div>
                            <div class="inline-flex items-center gap-2">
                                <RadioButton
                                    v-model="studentDateRangeMode"
                                    input-id="student-date-range-end"
                                    value="end_date"
                                    :disabled="loading || loadingSummary"
                                />
                                <label
                                    class="cursor-pointer whitespace-nowrap text-sm font-medium leading-tight text-surface-900 dark:text-surface-50"
                                    for="student-date-range-end"
                                    >Left at</label
                                >
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        icon="pi pi-arrow-right"
                        rounded
                        class="shrink-0"
                        aria-label="Apply date range filter"
                        :disabled="loading || loadingSummary"
                        :loading="loading"
                        @click="applyStudentDateFilter"
                    />
                </div>
            </div>
            <div
                class="col-start-3 flex min-w-0 justify-self-end"
            >
                <Button
                    v-if="$ability.can('core.students.create')"
                    label="Add New"
                    icon="pi pi-plus"
                    class="shrink-0"
                    @click="openDialog()"
                />
            </div>
        </div>
    </div>

    <Card class="py-3 px-2">
        <template #content>
            <BaseTable
                class="students-table-columns"
                data-key="uuid"
                :reorderableColumns="true"
                columnResizeMode="fit"
                :value="items"
                :page="pagination.page"
                :rows="pagination.limit"
                :total-records="totalRecords"
                :loading="loading"
                :column-filters="true"
                v-model:filters="primeFilters"
                :rowClass="studentRowClass"
                @filter="onColumnFilter"
                @sort="onSortChange"
                @page="onPageChange"
                @row-click="onStudentRowClick"
            >
                <template #empty> No students found. </template>
                <Column
                    columnKey="student_id"
                    :sortable="true"
                    field="student_id"
                    header="Student ID"
                    :showFilterMenu="false"
                    filterField="student_id"
                    filterHeaderClass="min-w-0 overflow-hidden"
                    headerClass="student-id-column whitespace-nowrap"
                    bodyClass="student-id-column whitespace-nowrap"
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
                            class="block w-max max-w-full overflow-hidden text-ellipsis"
                            v-tooltip.top="
                                data.student_id?.length > 12
                                    ? data.student_id
                                    : undefined
                            "
                        >
                            {{ truncate(data.student_id, { length: 12 }) }}
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
                    filterHeaderClass="min-w-0 overflow-hidden"
                    headerClass="whitespace-nowrap"
                    bodyClass="whitespace-nowrap"
                    :headerStyle="{ minWidth: '15rem' }"
                    :style="{ minWidth: '15rem' }"
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
                    columnKey="parent_1_mobile"
                    :sortable="true"
                    field="parent_1_mobile"
                    header="Parent 1 Mobile No."
                    :showFilterMenu="false"
                    filterField="parent_1_mobile"
                    filterHeaderClass="min-w-0 overflow-hidden"
                    headerClass="whitespace-nowrap"
                    bodyClass="whitespace-nowrap"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ data.parent_1_mobile || '-' }}
                    </template>
                </Column>

                <Column
                    columnKey="parent_2_mobile"
                    :sortable="true"
                    field="parent_2_mobile"
                    header="Parent 2 Mobile No."
                    :showFilterMenu="false"
                    filterField="parent_2_mobile"
                    filterHeaderClass="min-w-0 overflow-hidden"
                    headerClass="whitespace-nowrap"
                    bodyClass="whitespace-nowrap"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        {{ data.parent_2_mobile || '-' }}
                    </template>
                </Column>

                <Column
                    columnKey="start_date"
                    :sortable="true"
                    field="start_date"
                    header="Start Date"
                    :showFilterMenu="false"
                    headerClass="whitespace-nowrap"
                    bodyClass="whitespace-nowrap"
                >
                    <template #body="{ data }">
                        {{
                            data.start_date
                                ? helpers.formatDate(data.start_date)
                                : '-'
                        }}
                    </template>
                </Column>

                <Column
                    columnKey="maths_enrolled"
                    :sortable="true"
                    field="maths"
                    header="Maths"
                    :showFilterMenu="false"
                    headerClass="header-center-subject whitespace-nowrap text-center"
                    bodyClass="whitespace-nowrap text-center"
                >
                    <template #body="{ data }">
                        <span
                            v-if="data.maths"
                            class="inline-flex w-full justify-center"
                        >
                            <span
                                class="inline-block pt-px text-[17px] font-bold leading-none text-green-700"
                                aria-hidden="true"
                            >
                                ✔
                            </span>
                        </span>
                    </template>
                </Column>

                <Column
                    columnKey="reading_enrolled"
                    :sortable="true"
                    field="reading"
                    header="Reading"
                    :showFilterMenu="false"
                    headerClass="header-center-subject whitespace-nowrap text-center"
                    bodyClass="whitespace-nowrap text-center"
                >
                    <template #body="{ data }">
                        <span
                            v-if="data.reading"
                            class="inline-flex w-full justify-center"
                        >
                            <span
                                class="inline-block pt-px text-[17px] font-bold leading-none text-green-700"
                                aria-hidden="true"
                            >
                                ✔
                            </span>
                        </span>
                    </template>
                </Column>

                <Column
                    columnKey="end_date"
                    :sortable="true"
                    field="end_date"
                    header="End Date"
                    :showFilterMenu="false"
                    headerClass="whitespace-nowrap"
                    bodyClass="whitespace-nowrap"
                >
                    <template #body="{ data }">
                        {{
                            data.end_date
                                ? helpers.formatDate(data.end_date)
                                : '-'
                        }}
                    </template>
                </Column>

                <Column
                    columnKey="status"
                    :sortable="true"
                    field="status"
                    header="Status"
                    :showFilterMenu="false"
                    filterField="status"
                    filterHeaderClass="min-w-0 overflow-visible"
                    headerClass="whitespace-nowrap"
                    bodyClass="whitespace-nowrap"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="{
                                ...ROLE_STATUS_FILTER,
                                defaultValue: true,
                                labelClass:
                                    '!overflow-visible !whitespace-normal !text-clip'
                            }"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <StatusTag
                            :status="data.status ? 'active' : 'inactive'"
                        />
                    </template>
                </Column>

            </BaseTable>
        </template>
    </Card>

    <BaseDialog
        v-if="$ability.can('core.students.create')"
        ref="dialogRef"
        v-model:visible="showDialog"
        @update:visible="onShow"
        :busy="busy"
        :isEditMode="false"
        :header="dialogHeader"
        confirmLabel="Create Student"
        :formData="formData"
        :enableDirtyCheck="true"
        :hideCancelButton="true"
        :confirmBeforeSave="false"
        :disableConfirm="
            assigningId || !formData.start_date || !previewStudentId
        "
        @cancel="closeDialog"
        @confirm="save"
    >
        <div class="col-span-12 grid grid-cols-12 gap-4 items-end">
            <div class="col-span-6">
                <label class="block required mb-2" for="name">Name</label>
                <InputField
                    variant="text"
                    id="name"
                    v-model="formData.name"
                    class="w-full"
                    @keyup.enter="save"
                    :disabled="busy"
                />
            </div>
            <div class="col-span-6">
                <label class="block required mb-2" for="start_date">
                    Start Date
                </label>
                <InputField
                    id="start_date"
                    errorKey="start_date"
                    variant="date"
                    :range="false"
                    :clearable="true"
                    :editable="true"
                    placeholder="Select"
                    v-model="formData.start_date"
                    class="w-full"
                    :disabled="busy"
                />
            </div>

            <div class="col-span-6">
                <label class="block mb-2" for="parent_1_mobile">
                    Parent 1 Mobile Number
                    <span class="text-sm font-normal text-muted-color">
                        (for text messaging)
                    </span>
                </label>
                <InputField
                    variant="text"
                    id="parent_1_mobile"
                    errorKey="parent_1_mobile"
                    v-model="formData.parent_1_mobile"
                    class="w-full"
                    maxlength="32"
                    :disabled="busy"
                />
            </div>

            <div class="col-span-6">
                <label class="block mb-2" for="parent_2_mobile">
                    Parent 2 Mobile Number
                    <span class="text-sm font-normal text-muted-color">
                        (for text messaging)
                    </span>
                </label>
                <InputField
                    variant="text"
                    id="parent_2_mobile"
                    errorKey="parent_2_mobile"
                    v-model="formData.parent_2_mobile"
                    class="w-full"
                    maxlength="32"
                    :disabled="busy"
                />
            </div>

            <div class="col-span-6">
                <span class="block mb-3">Enrolled Subjects</span>
                <div class="flex flex-wrap items-center gap-6">
                    <div class="flex items-center">
                        <InputField
                            variant="checkbox"
                            v-model="formData.maths"
                            binary
                            inputId="student_maths"
                            :disabled="busy"
                        />
                        <label for="student_maths" class="ml-2 cursor-pointer">
                            Maths
                        </label>
                    </div>
                    <div class="flex items-center">
                        <InputField
                            variant="checkbox"
                            v-model="formData.reading"
                            binary
                            inputId="student_reading"
                            :disabled="busy"
                        />
                        <label
                            for="student_reading"
                            class="ml-2 cursor-pointer"
                        >
                            Reading
                        </label>
                    </div>
                </div>
            </div>

            <div class="col-span-6">
                <label class="block mb-2" for="tuition_fee">
                    Tuition Fee
                    <span class="text-sm font-normal text-muted-color">
                        (Do not include one time charges)
                    </span>
                </label>
                <InputField
                    variant="number"
                    id="tuition_fee"
                    errorKey="tuition_fee"
                    v-model="formData.tuition_fee"
                    class="w-full text-right-input"
                    inputClass="w-full text-right"
                    :prefix="helpers.currencyInputPrefix()"
                    :min="0"
                    :max="999999999.99"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    :disabled="busy"
                />
            </div>

            <div
                v-if="!assignCardFlowStarted"
                class="col-span-12 mt-3 flex justify-center"
            >
                <Button
                    type="button"
                    label="Assign Card"
                    severity="primary"
                    :disabled="busy"
                    @click="startAssignCardFlow"
                />
            </div>

            <div v-if="assignCardFlowStarted" class="col-span-12 mt-3">
                <label class="block mb-2" for="assign_card_switch">
                    Assign Card
                </label>
                <div class="flex items-center">
                    <InputField
                        variant="switch"
                        inputId="assign_card_switch"
                        v-model="assignCardEnabled"
                        :disabled="busy"
                    />
                </div>
            </div>

            <CardScanner
                v-if="assignCardEnabled"
                :captured-uid="formData.card_uid"
                :busy="busy"
                :error="cardUidError"
                @scan="onCreateCardScan"
            />
        </div>
    </BaseDialog>

</template>

<style scoped>
.students-table-columns :deep(.p-datatable-column-header-content) {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-start;
    gap: 0.35rem;
    min-width: 0;
}

.students-table-columns :deep(.p-datatable-column-title) {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.students-table-columns :deep(.p-datatable-sort) {
    flex-shrink: 0;
}

.students-table-columns :deep(th.header-center-subject .p-datatable-column-header-content) {
    justify-content: center;
}

/* Narrow column: size to header + sort icon + filter, not stretched */
.students-table-columns :deep(th.student-id-column),
.students-table-columns :deep(td.student-id-column) {
    width: 1%;
    max-width: max-content;
}
</style>
