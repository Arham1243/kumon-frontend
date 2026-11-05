<script setup>
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';
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
import Confirmation from '@/components/common/Confirmation.vue';
import dayjs from '@/plugins/dayjs';

const helpers = useHelpers();

function disableFutureEndDate(date) {
    return dayjs(date).startOf('day').isAfter(dayjs().startOf('day'));
}
const studentStore = useStudentStore();
const globalStore = useGlobalStore();

const pagination = new PaginationOptions();
const sortFilters = new SortFilterOptions();
const menu = ref();
const dialogRef = ref(null);
const selectedItem = ref(null);
const loading = ref(false);
const items = ref([]);
const isEditMode = ref(false);
const busy = ref(false);
const totalRecords = ref();
const showDialog = ref(false);
const changeStatusDialog = ref(false);
const deactivateEndDate = ref(null);
const showAssignCardDialog = ref(false);
const cardAssignBusy = ref(false);
const assignCardEnabled = ref(false);
const assignCardStubForm = ref({ _assignCard: true });
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

const assignCardDialogHeader = computed(() => {
    const row = selectedItem.value;
    if (!row) {
        return 'Assign Card';
    }
    return String(row.card_uid ?? '').trim()
        ? 'Replace Card'
        : 'Assign New Card';
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

async function getItems() {
    try {
        loading.value = true;
        const params = { ...pagination.getPageParams() };
        const payload = sortFilters.getSortFilters();
        if (!payload.sort || payload.sort.length === 0) {
            payload.sort = [
                { field: 'status', direction: 'desc' },
                { field: 'name', direction: 'asc' }
            ];
        }
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

    const cardMenuItem = isItemActive.value
        ? {
              label: String(selectedItem.value.card_uid ?? '').trim()
                  ? 'Replace Card'
                  : 'Assign New Card',
              icon: 'pi pi-id-card',
              command: () => openAssignCardDialog(),
              permission: 'core.students.edit'
          }
        : null;

    const allMenuItems = [
        {
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: () => editItem(),
            permission: 'core.students.edit'
        },
        ...(cardMenuItem ? [cardMenuItem] : []),
        {
            label: isItemActive.value ? 'Make Inactive' : 'Make Active',
            icon: isItemActive.value ? 'pi pi-times' : 'pi pi-check',
            command: () => showChangeStatusDialog(),
            permission: 'core.students.edit'
        }
    ];

    return helpers.filterByPermission(allMenuItems);
});

const isItemActive = computed(() => {
    return selectedItem.value && !!selectedItem.value.status;
});

const dialogHeader = computed(() => {
    const base = isEditMode.value ? 'Edit Student' : 'New Student';
    if (isEditMode.value) {
        const id = selectedItem.value?.student_id;
        if (id !== null && id !== undefined && id !== '') {
            return `${base}, ID: ${id}`;
        }
        return base;
    }
    const id = previewStudentId.value;
    if (id !== null && id !== undefined && id !== '') {
        return `${base}, ID: ${id}`;
    }
    return base;
});

const showChangeStatusDialog = () => {
    deactivateEndDate.value = null;
    changeStatusDialog.value = true;
};

const deactivateConfirmDisabled = computed(
    () => isItemActive.value && !deactivateEndDate.value
);

const openDialog = (mode = 'add') => {
    isEditMode.value = mode === 'edit';
    if (mode !== 'edit') {
        resetForm();
        assigningId.value = true;
        loadNextStudentId();
    } else {
        previewStudentId.value = '';
    }
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    resetForm();
};

const openAssignCardDialog = () => {
    globalStore.clearErrors();
    showAssignCardDialog.value = true;
};

const closeAssignCardDialog = () => {
    showAssignCardDialog.value = false;
    globalStore.clearErrors();
};

watch(assignCardEnabled, (enabled) => {
    if (!enabled) {
        formData.value.card_uid = '';
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
        if (
            token !== nextIdToken.value ||
            !showDialog.value ||
            isEditMode.value
        ) {
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

const editItem = () => {
    resetForm();
    const row = selectedItem.value;
    formData.value.name = row.name;
    formData.value.parent_1_mobile = row.parent_1_mobile ?? '';
    formData.value.parent_2_mobile = row.parent_2_mobile ?? '';
    formData.value.start_date = row.start_date ?? null;
    formData.value.maths = !!row.maths;
    formData.value.reading = !!row.reading;
    formData.value.tuition_fee =
        row.tuition_fee !== null && row.tuition_fee !== undefined
            ? Number(row.tuition_fee)
            : null;
    openDialog('edit');
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
    const fee = formData.value.tuition_fee;
    const payload = {
        name: formData.value.name,
        parent_1_mobile: emptyToNull(formData.value.parent_1_mobile),
        parent_2_mobile: emptyToNull(formData.value.parent_2_mobile),
        start_date: formData.value.start_date,
        maths: formData.value.maths ? 1 : 0,
        reading: formData.value.reading ? 1 : 0,
        tuition_fee:
            fee === null || fee === undefined || fee === ''
                ? null
                : Number(fee)
    };

    if (!isEditMode.value) {
        const cardUid = assignCardEnabled.value
            ? trimCardUid(formData.value.card_uid)
            : '';
        payload.card_uid = cardUid === '' ? null : cardUid;
    }

    return payload;
}

const save = async () => {
    if (
        !isEditMode.value &&
        (!previewStudentId.value || !formData.value.start_date)
    ) {
        return;
    }
    if (isEditMode.value && !formData.value.start_date) {
        return;
    }
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

async function onAssignCardScan(uid) {
    if (cardAssignBusy.value || !selectedItem.value) {
        return;
    }
    globalStore.clearErrors();
    const isReplace = !!String(selectedItem.value.card_uid ?? '').trim();
    try {
        cardAssignBusy.value = true;
        await studentStore.updateCardUid(selectedItem.value.uuid, uid, {
            isReplace
        });
        closeAssignCardDialog();
        await getItems();
        selectedItem.value = null;
    } catch (error) {
        console.error(error);
    } finally {
        cardAssignBusy.value = false;
    }
}

function onCreateCardScan(uid) {
    if (busy.value) {
        return;
    }
    globalStore.clearErrors();
    formData.value.card_uid = uid;
}

const changeStatus = async () => {
    try {
        loading.value = true;
        if (selectedItem.value) {
            const payload =
                isItemActive.value && deactivateEndDate.value
                    ? { end_date: deactivateEndDate.value }
                    : undefined;
            await studentStore.changeStatus(selectedItem.value.uuid, payload);
        }
        changeStatusDialog.value = false;
        deactivateEndDate.value = null;
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
                    columnKey="parent_1_mobile"
                    :sortable="true"
                    field="parent_1_mobile"
                    header="Parent 1 Mobile"
                    :showFilterMenu="false"
                    filterField="parent_1_mobile"
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
                    header="Parent 2 Mobile"
                    :showFilterMenu="false"
                    filterField="parent_2_mobile"
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
                    columnKey="end_date"
                    :sortable="true"
                    field="end_date"
                    header="End Date"
                    :showFilterMenu="false"
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
                    columnKey="enrolled_subjects"
                    header="Enrolled Subjects"
                    :showFilterMenu="false"
                >
                    <template #body="{ data }">
                        <div
                            v-if="data.maths || data.reading"
                            class="flex flex-wrap items-center gap-1"
                        >
                            <StatusTag v-if="data.maths" status="maths" />
                            <StatusTag v-if="data.reading" status="reading" />
                        </div>
                        <span v-else>-</span>
                    </template>
                </Column>

                <Column
                    columnKey="tuition_fee"
                    :sortable="true"
                    field="tuition_fee"
                    header="Tuition Fee"
                    :showFilterMenu="false"
                    filterField="tuition_fee"
                    bodyClass="text-right"
                    headerClass="text-right"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="NUMBER_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <span class="block text-right">
                            {{ helpers.formatMoney(data.tuition_fee) }}
                        </span>
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
                    columnKey="status"
                    :sortable="true"
                    field="status"
                    header="Status"
                    :showFilterMenu="false"
                    filterField="status"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="{
                                ...ROLE_STATUS_FILTER,
                                defaultValue: true
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

                <Column
                    columnKey="actions"
                    v-if="$ability.can('core.students.edit')"
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
        ref="dialogRef"
        v-model:visible="showDialog"
        @update:visible="onShow"
        :busy="busy"
        :isEditMode="isEditMode"
        :header="dialogHeader"
        :confirmLabel="isEditMode ? 'Update' : 'Save'"
        :formData="formData"
        :initialData="isEditMode ? selectedItem : null"
        :enableDirtyCheck="true"
        :confirmBeforeSave="false"
        :disableConfirm="
            assigningId ||
            !formData.start_date ||
            (!isEditMode && !previewStudentId)
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

            <div class="col-span-6 mt-1">
                <label class="block mb-2" for="parent_1_mobile">
                    Parent 1 Mobile Number
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

            <div class="col-span-6 mt-1">
                <label class="block mb-2" for="parent_2_mobile">
                    Parent 2 Mobile Number
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


            <div v-if="!isEditMode" class="col-span-12">
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
                v-if="!isEditMode && assignCardEnabled"
                :captured-uid="formData.card_uid"
                :busy="busy"
                :error="cardUidError"
                @scan="onCreateCardScan"
            />
        </div>
    </BaseDialog>

    <BaseDialog
        v-if="$ability.can('core.students.edit')"
        v-model:visible="showAssignCardDialog"
        :header="assignCardDialogHeader"
        :formData="assignCardStubForm"
        :enableDirtyCheck="false"
        :busy="cardAssignBusy"
        cancelLabel="Cancel"
        @cancel="closeAssignCardDialog"
    >
        <CardScanner
            :busy="cardAssignBusy"
            :error="cardUidError"
            @scan="onAssignCardScan"
        />
        <template #footer>
            <Button
                label="Close"
                type="button"
                :disabled="cardAssignBusy"
                @click="closeAssignCardDialog"
            />
        </template>
    </BaseDialog>

    <Confirmation
        v-model="changeStatusDialog"
        :variant="isItemActive ? 'danger' : 'success'"
        :header="isItemActive ? 'Deactivate Student' : 'Activate Student'"
        :content="
            selectedItem
                ? `Are you sure you want to ${isItemActive ? 'deactivate' : 'activate'} \u201C${selectedItem.name}\u201D?`
                : 'Change status of this student?'
        "
        :confirmButtonText="isItemActive ? 'Deactivate' : 'Activate'"
        :confirmDisabled="deactivateConfirmDisabled"
        :closeOnConfirm="false"
        :loading="loading"
        @confirm="changeStatus"
    >
        <div v-if="isItemActive" class="pb-4">
            <label class="block required mb-2" for="deactivate_end_date"
                >End Date</label
            >
            <InputField
                variant="date"
                id="deactivate_end_date"
                errorKey="end_date"
                v-model="deactivateEndDate"
                class="w-full"
                :disabled-date="disableFutureEndDate"
            />
        </div>
    </Confirmation>
</template>
