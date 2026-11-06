<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useStudentStore } from '@/modules/core/stores';
import { useGlobalStore } from '@/stores';
import { useFormDirty } from '@/composables/useFormDirty';
import useEventsBus from '@/composables/useEventsBus';
import { useHelpers } from '@/composables';
import dayjs from '@/plugins/dayjs';
import TitleHeader from '@/components/common/TitleHeader.vue';
import Loader from '@/components/common/Loader.vue';
import InputField from '@/components/common/InputField.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import Card from 'primevue/card';
import CardScanner from '@/components/common/CardScanner.vue';
import BaseDialog from '@/components/common/BaseDialog.vue';
import Confirmation from '@/components/common/Confirmation.vue';
import StudentPickerList from '@/modules/core/components/student/StudentPickerList.vue';

const router = useRouter();
const route = useRoute();
const studentStore = useStudentStore();
const globalStore = useGlobalStore();
const helpers = useHelpers();
const { emit: emitEvent } = useEventsBus();

const STATUS_ACTION_BLOCKED_TOOLTIP =
    'Save or cancel your unsaved changes before using this action.';

function disableFutureEndDate(date) {
    return dayjs(date).startOf('day').isAfter(dayjs().startOf('day'));
}

const studentUuid = computed(() => route.params.uuid);

const busy = ref(false);
const loading = ref(true);
const statusBusy = ref(false);
const studentRecord = ref(null);

const formData = ref({
    name: '',
    parent_1_mobile: '',
    parent_2_mobile: '',
    start_date: null,
    maths: false,
    reading: false,
    tuition_fee: null
});

const { isDirty, resetDirty } = useFormDirty(formData);

const changeStatusDialog = ref(false);
const deactivateEndDate = ref(null);

const showAssignCardDialog = ref(false);
const cardAssignBusy = ref(false);

const showUnsavedDialog = ref(false);
const pendingLeaveTo = ref(null);
const bypassLeaveGuard = ref(false);

const assignCardStubForm = ref({ _assignCard: true });

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
    const row = studentRecord.value;
    if (!row) {
        return 'Assign Card';
    }
    return String(row.card_uid ?? '').trim() ? 'Replace Card' : 'Assign Card';
});

const cardUidDisplay = computed(() =>
    String(studentRecord.value?.card_uid ?? '').trim()
);

const hasSavedCard = computed(() => cardUidDisplay.value.length > 0);

const cardAssignedAtDisplay = computed(() => {
    const raw = studentRecord.value?.card_assigned_at;
    if (raw === null || raw === undefined || raw === '') {
        return null;
    }
    return helpers.formatDateTime(raw);
});

const cardNumberPanelValue = computed(() =>
    hasSavedCard.value ? cardUidDisplay.value : '-'
);

const cardAssignedAtPanelValue = computed(
    () => cardAssignedAtDisplay.value ?? '-'
);

const assignOrReplaceCardButtonLabel = computed(() =>
    hasSavedCard.value ? 'Replace Card' : 'Assign Card'
);

const cardManagementDisabled = computed(
    () => busy.value || statusBusy.value || !isActive.value
);

const studentSwitchDisabled = computed(
    () => busy.value || statusBusy.value || cardAssignBusy.value
);

const pickerPatchRow = computed(() => {
    const row = studentRecord.value;
    if (!row?.uuid) {
        return null;
    }
    return {
        uuid: row.uuid,
        name: row.name,
        student_id: row.student_id,
        status: row.status
    };
});

const isActive = computed(() => !!studentRecord.value?.status);

const deactivateConfirmDisabled = computed(
    () => isActive.value && !deactivateEndDate.value
);

function emptyToNull(value) {
    const trimmed = String(value ?? '').trim();
    return trimmed === '' ? null : trimmed;
}

function mapRecordToForm(record) {
    if (!record) {
        return;
    }
    formData.value = {
        name: record.name ?? '',
        parent_1_mobile: record.parent_1_mobile ?? '',
        parent_2_mobile: record.parent_2_mobile ?? '',
        start_date: record.start_date ?? null,
        maths: !!record.maths,
        reading: !!record.reading,
        tuition_fee:
            record.tuition_fee !== null && record.tuition_fee !== undefined
                ? Number(record.tuition_fee)
                : null
    };
}

const statusLifecycleDisabled = computed(
    () => busy.value || statusBusy.value || isDirty.value
);

function statusLifecycleTooltip() {
    if (busy.value || statusBusy.value) {
        return undefined;
    }
    if (isDirty.value) {
        return {
            value: STATUS_ACTION_BLOCKED_TOOLTIP,
            class: 'max-w-xs',
            fitContent: false
        };
    }
    return undefined;
}

function onMakeInactiveClick() {
    if (
        statusLifecycleDisabled.value ||
        !studentRecord.value ||
        !isActive.value
    ) {
        return;
    }
    deactivateEndDate.value = null;
    changeStatusDialog.value = true;
}

function onMakeActiveClick() {
    if (
        statusLifecycleDisabled.value ||
        !studentRecord.value ||
        isActive.value
    ) {
        return;
    }
    deactivateEndDate.value = null;
    changeStatusDialog.value = true;
}

function onChangeStatusCancel() {
    deactivateEndDate.value = null;
}

async function getItem() {
    if (!studentUuid.value) {
        loading.value = false;
        return;
    }
    try {
        loading.value = true;
        const res = await studentStore.show(studentUuid.value);
        const student = res.data;
        if (!student) {
            studentRecord.value = null;
            return;
        }
        studentRecord.value = student;
        mapRecordToForm(student);
        resetDirty(formData.value);

        const label = formData.value.name?.trim() || '';
        if (label) {
            emitEvent('updateDetailsBreadcrumb', label);
        }
    } catch (error) {
        console.error(error);
        studentRecord.value = null;
    } finally {
        loading.value = false;
    }
}

onBeforeMount(async () => {
    await getItem();
});

watch(
    () => route.params.uuid,
    async (uuid, prev) => {
        if (!uuid || uuid === prev) {
            return;
        }
        await getItem();
    }
);

onBeforeRouteLeave((to) => {
    if (bypassLeaveGuard.value) {
        bypassLeaveGuard.value = false;
        return true;
    }
    if (!isDirty.value || busy.value) {
        return true;
    }
    pendingLeaveTo.value = to;
    showUnsavedDialog.value = true;
    return false;
});

function confirmLeave() {
    showUnsavedDialog.value = false;
    const destination = pendingLeaveTo.value;
    pendingLeaveTo.value = null;
    if (!destination) {
        return;
    }
    mapRecordToForm(studentRecord.value);
    resetDirty(formData.value);
    const leavesEditStudentRoute = destination.name !== 'EditStudent';
    if (leavesEditStudentRoute) {
        bypassLeaveGuard.value = true;
    }
    router.push(destination);
}

function cancelLeave() {
    showUnsavedDialog.value = false;
    pendingLeaveTo.value = null;
}

function requestStudentSwitch(uuid) {
    if (!uuid || uuid === studentUuid.value) {
        return;
    }
    if (studentSwitchDisabled.value) {
        return;
    }
    const target = { name: 'EditStudent', params: { uuid } };
    if (!isDirty.value) {
        router.push(target);
        return;
    }
    pendingLeaveTo.value = target;
    showUnsavedDialog.value = true;
}

function buildPayload() {
    const fee = formData.value.tuition_fee;
    return {
        name: formData.value.name,
        parent_1_mobile: emptyToNull(formData.value.parent_1_mobile),
        parent_2_mobile: emptyToNull(formData.value.parent_2_mobile),
        start_date: formData.value.start_date,
        maths: formData.value.maths ? 1 : 0,
        reading: formData.value.reading ? 1 : 0,
        tuition_fee:
            fee === null || fee === undefined || fee === '' ? null : Number(fee)
    };
}

const canSave = computed(() => {
    if (!formData.value.start_date || !String(formData.value.name ?? '').trim()) {
        return false;
    }
    return isDirty.value;
});

const saveDisabled = computed(() => !canSave.value || busy.value);

const cancelDisabled = computed(() => !isDirty.value || busy.value);

const save = async () => {
    if (!studentUuid.value || !canSave.value) {
        return;
    }
    try {
        busy.value = true;
        const payload = buildPayload();
        await studentStore.update(studentUuid.value, payload);
        await getItem();
    } catch (error) {
        console.error(error);
    } finally {
        busy.value = false;
    }
};

const goBack = () => {
    router.push({ name: 'Students' });
};

const cancel = () => {
    if (isDirty.value) {
        getItem();
    } else {
        goBack();
    }
};

async function confirmChangeStatus() {
    if (!studentUuid.value || !studentRecord.value) {
        return;
    }
    try {
        statusBusy.value = true;
        const wasActive = !!studentRecord.value.status;
        if (wasActive) {
            if (!deactivateEndDate.value) {
                return;
            }
            await studentStore.changeStatus(studentUuid.value, {
                end_date: deactivateEndDate.value
            });
        } else {
            await studentStore.changeStatus(studentUuid.value, {
                end_date: null
            });
        }
        changeStatusDialog.value = false;
        deactivateEndDate.value = null;
        await getItem();
    } catch (error) {
        console.error(error);
    } finally {
        statusBusy.value = false;
    }
}

function openAssignCardDialog() {
    globalStore.clearErrors();
    showAssignCardDialog.value = true;
}

function closeAssignCardDialog() {
    showAssignCardDialog.value = false;
    globalStore.clearErrors();
}

async function onAssignCardScan(uid) {
    if (cardAssignBusy.value || !studentUuid.value || !studentRecord.value) {
        return;
    }
    globalStore.clearErrors();
    const isReplace = !!String(studentRecord.value.card_uid ?? '').trim();
    try {
        cardAssignBusy.value = true;
        await studentStore.updateCardUid(studentUuid.value, uid, {
            isReplace
        });
        closeAssignCardDialog();
        await getItem();
    } catch (error) {
        console.error(error);
    } finally {
        cardAssignBusy.value = false;
    }
}

const titleStudentId = computed(() => {
    const id = studentRecord.value?.student_id;
    if (id === null || id === undefined || id === '') {
        return '';
    }
    return String(id);
});

const titleEndDateDisplay = computed(() => {
    if (isActive.value || !studentRecord.value) {
        return null;
    }
    const raw = studentRecord.value.end_date;
    if (raw === null || raw === undefined || raw === '') {
        return '-';
    }
    return helpers.formatDate(raw);
});

const pageTitle = computed(() => formData.value.name?.trim() || 'Edit Student');

function goBackFromNotFound() {
    router.push({ name: 'Students' });
}
</script>

<template>
    <div v-if="studentUuid" class="student-edit-split">
        <aside class="student-edit-split__aside">
            <StudentPickerList
                :selected-uuid="String(studentUuid)"
                :current-record="studentRecord"
                :patch-row="pickerPatchRow"
                :disabled="studentSwitchDisabled"
                @select="requestStudentSwitch"
            >
                <template #headingBefore>
                    <Button
                        type="button"
                        variant="outlined"
                        icon="pi pi-chevron-left"
                        size="large"
                        iconClass="!text-sm"
                        :disabled="busy"
                        @click="goBack"
                    />
                </template>
            </StudentPickerList>
        </aside>
        <div class="student-edit-split__main">
            <Loader v-if="loading" />
            <template v-else-if="!studentRecord">
                <div
                    class="flex flex-col items-center justify-center gap-4 py-16"
                >
                    <p class="text-lg text-muted-color">Student not found.</p>
                    <Button
                        label="Back to Students"
                        @click="goBackFromNotFound"
                    />
                </div>
            </template>
            <template v-else>
        <TitleHeader align-top>
            <template #title>
                <div class="flex flex-wrap items-center gap-5">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-3">
                            <h1
                                class="m-0 max-w-[min(100%,40rem)] truncate text-2xl font-bold capitalize sm:text-3xl"
                            >
                                {{ pageTitle }}
                            </h1>
                            <StatusTag
                                :status="studentRecord.status ? 'active' : 'inactive'"
                            />
                        </div>
                        <p
                            v-if="titleStudentId || titleEndDateDisplay !== null"
                            class="mb-0 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-black dark:text-surface-0"
                        >
                            <span
                                v-if="titleStudentId"
                                class="inline-flex items-center gap-2"
                            >
                                <span class="font-semibold">Student ID:</span>
                                <span>{{ titleStudentId }}</span>
                            </span>
                            <span
                                v-if="titleEndDateDisplay !== null"
                                class="inline-flex items-center gap-2"
                            >
                                <span class="font-semibold">End Date:</span>
                                <span>{{ titleEndDateDisplay }}</span>
                            </span>
                        </p>
                    </div>
                </div>
            </template>
            <template #actions>
                <span
                    v-if="isActive"
                    v-tooltip.top="statusLifecycleTooltip()"
                    class="inline-flex w-full sm:w-auto"
                >
                    <Button
                        label="Make Inactive"
                        severity="danger"
                        class="w-full sm:w-auto"
                        :disabled="statusLifecycleDisabled"
                        @click="onMakeInactiveClick"
                    />
                </span>
                <span
                    v-else
                    v-tooltip.top="statusLifecycleTooltip()"
                    class="inline-flex w-full sm:w-auto"
                >
                    <Button
                        label="Make Active"
                        severity="success"
                        class="w-full sm:w-auto"
                        :disabled="statusLifecycleDisabled"
                        @click="onMakeActiveClick"
                    />
                </span>
                <Button
                    label="Cancel"
                    variant="outlined"
                    class="w-full sm:w-auto"
                    @click="cancel"
                    :disabled="cancelDisabled"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    iconPos="left"
                    class="w-full sm:w-auto"
                    :disabled="saveDisabled"
                    :loading="busy"
                    @click="save"
                />
            </template>
        </TitleHeader>

        <Card>
            <template #content>
                <div
                    class="grid grid-cols-1 items-stretch gap-x-4 gap-y-4 lg:grid-cols-3"
                >
                    <div class="min-w-0">
                        <label class="required mb-2 block" for="student_edit_name"
                            >Name</label
                        >
                        <InputField
                            id="student_edit_name"
                            v-model="formData.name"
                            variant="text"
                            class="w-full"
                            :disabled="busy"
                            @keyup.enter="save"
                        />
                    </div>
                    <div class="min-w-0">
                        <label
                            class="required mb-2 block"
                            for="student_edit_start_date"
                            >Start Date</label
                        >
                        <InputField
                            id="student_edit_start_date"
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
                    <div class="min-w-0">
                        <label class="mb-2 block" for="student_edit_parent_1">
                            Parent 1 Mobile Number
                            <span class="text-sm font-normal text-muted-color">
                                (for text messaging)
                            </span>
                        </label>
                        <InputField
                            id="student_edit_parent_1"
                            errorKey="parent_1_mobile"
                            v-model="formData.parent_1_mobile"
                            variant="text"
                            class="w-full"
                            maxlength="32"
                            :disabled="busy"
                        />
                    </div>
                    <div class="min-w-0">
                        <label class="mb-2 block" for="student_edit_parent_2">
                            Parent 2 Mobile Number
                            <span class="text-sm font-normal text-muted-color">
                                (for text messaging)
                            </span>
                        </label>
                        <InputField
                            id="student_edit_parent_2"
                            errorKey="parent_2_mobile"
                            v-model="formData.parent_2_mobile"
                            variant="text"
                            class="w-full"
                            maxlength="32"
                            :disabled="busy"
                        />
                    </div>
                    <div class="min-w-0">
                        <label class="mb-2 block" for="student_edit_fee">
                            Tuition Fee
                            <span class="text-sm font-normal text-muted-color">
                                (Do not include one time charges)
                            </span>
                        </label>
                        <InputField
                            id="student_edit_fee"
                            errorKey="tuition_fee"
                            variant="number"
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
                    <div class="flex min-h-0 min-w-0 flex-col">
                        <span class="mb-2 block shrink-0 mt-1">Enrolled Subjects</span>
                        <div class="flex min-h-0 flex-1 flex-col mt-1">
                            <div class="flex flex-wrap items-center gap-6 pb-px">
                                <div class="flex items-center">
                                    <InputField
                                        variant="checkbox"
                                        v-model="formData.maths"
                                        binary
                                        inputId="student_edit_maths"
                                        :disabled="busy"
                                    />
                                    <label
                                        for="student_edit_maths"
                                        class="ml-2 cursor-pointer"
                                    >
                                        Maths
                                    </label>
                                </div>
                                <div class="flex items-center">
                                    <InputField
                                        variant="checkbox"
                                        v-model="formData.reading"
                                        binary
                                        inputId="student_edit_reading"
                                        :disabled="busy"
                                    />
                                    <label
                                        for="student_edit_reading"
                                        class="ml-2 cursor-pointer"
                                    >
                                        Reading
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <Card v-if="isActive" class="mt-5">
            <template #title>
                <div
                    class="customer-token-section-title mb-2 flex flex-wrap items-center gap-3 w-full"
                >
                    <h2 class="text-xl font-semibold m-0">Card Management</h2>
                    <StatusTag
                        :status="hasSavedCard ? 'assigned' : 'unassigned'"
                    />
                </div>
            </template>
            <template #content>
                <div class="student-card-schedule-panel panel-surface">
                    <div class="student-card-schedule-panel__action-anchor">
                        <Button
                            type="button"
                            :label="assignOrReplaceCardButtonLabel"
                            :disabled="cardManagementDisabled"
                            @click="openAssignCardDialog"
                        />
                    </div>
                    <div
                        class="student-card-schedule-panel__grid grid grid-cols-12 gap-x-4 gap-y-4"
                    >
                        <div
                            class="student-card-schedule-panel__field col-span-12 min-w-0 lg:col-span-3"
                        >
                            <span class="student-card-schedule-panel__label"
                                >Card number</span
                            >
                            <span
                                class="student-card-schedule-panel__value block"
                                >{{ cardNumberPanelValue }}</span
                            >
                        </div>
                        <div
                            class="student-card-schedule-panel__field col-span-12 min-w-0 lg:col-span-3"
                        >
                            <span class="student-card-schedule-panel__label"
                                >Assigned at</span
                            >
                            <span
                                class="student-card-schedule-panel__value block"
                                >{{ cardAssignedAtPanelValue }}</span
                            >
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <BaseDialog
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
            v-model="showUnsavedDialog"
            header="Unsaved Changes"
            content="You have unsaved changes. If you continue, those changes will be lost. Do you want to discard them?"
            variant="danger"
            confirmButtonText="Discard Changes"
            cancelButtonText="Keep Editing"
            @confirm="confirmLeave"
            @cancel="cancelLeave"
        />

        <Confirmation
            v-model="changeStatusDialog"
            :variant="isActive ? 'danger' : 'success'"
            :header="isActive ? 'Deactivate Student' : 'Activate Student'"
            :content="
                studentRecord
                    ? `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} \u201C${studentRecord.name}\u201D?`
                    : 'Change status of this student?'
            "
            :confirmButtonText="isActive ? 'Deactivate' : 'Activate'"
            :confirmDisabled="deactivateConfirmDisabled || statusBusy"
            :closeOnConfirm="false"
            :loading="statusBusy"
            @confirm="confirmChangeStatus"
            @cancel="onChangeStatusCancel"
        >
            <div v-if="isActive" class="pb-4">
                <label
                    class="required mb-2 block"
                    for="student_deactivate_end_date"
                    >End Date</label
                >
                <InputField
                    variant="date"
                    id="student_deactivate_end_date"
                    errorKey="end_date"
                    v-model="deactivateEndDate"
                    class="w-full"
                    :disabled-date="disableFutureEndDate"
                />
            </div>
        </Confirmation>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.student-edit-split {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 16rem;
}

.student-edit-split__aside {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
    flex-shrink: 0;
    flex: 1 1 auto;
}

.student-edit-split__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
}

@media (min-width: 1024px) {
    .student-edit-split {
        flex-direction: row;
        align-items: stretch;
        height: calc(100dvh - 8.5rem);
        min-height: 0;
        overflow: hidden;
        gap: 1.5rem;
    }

    .student-edit-split__aside {
        flex: 0 0 20%;
        max-width: 20%;
        min-height: 0;
        height: 100%;
    }

    .student-edit-split__main {
        flex: 1 1 0;
        min-height: 0;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
    }
}

@media (max-width: 1023.98px) {
    .student-edit-split__aside {
        max-height: 18rem;
        min-height: 12rem;
    }
}

.student-card-schedule-panel {
    position: relative;
}

.student-card-schedule-panel__action-anchor {
    position: absolute;
    top: 50%;
    right: var(--panel-surface-padding, 1rem);
    z-index: 2;
    transform: translateY(-50%);
}

.student-card-schedule-panel__action-anchor :deep(.p-button) {
    width: auto;
    display: inline-flex;
}

.student-card-schedule-panel__grid {
    min-width: 0;
    padding-top: 2.75rem;
}

@media (min-width: 1024px) {
    .student-card-schedule-panel__grid {
        padding-top: 0;
        padding-right: 11rem;
    }
}

.student-card-schedule-panel__label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--p-text-muted-color, rgb(100 116 139));
}

.student-card-schedule-panel__value {
    font-weight: 600;
    color: var(--p-text-color);
    word-break: break-word;
}

</style>
