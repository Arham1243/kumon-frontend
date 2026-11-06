<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
    <Loader v-if="loading" />
    <template v-else-if="!studentRecord">
        <div class="flex flex-col items-center justify-center gap-4 py-16">
            <p class="text-lg text-muted-color">Student not found.</p>
            <Button label="Back to Students" @click="goBackFromNotFound" />
        </div>
    </template>
    <template v-else-if="studentRecord">
        <TitleHeader>
            <template #title>
                <div class="flex flex-wrap items-center gap-5">
                    <Button
                        type="button"
                        variant="outlined"
                        icon="pi pi-chevron-left"
                        size="large"
                        @click="goBack"
                        iconClass="!text-sm"
                        :disabled="busy"
                    />
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
                <div class="mb-6 flex flex-wrap items-center justify-end gap-4">
                    <Button
                        v-if="isActive"
                        type="button"
                        :label="
                            String(studentRecord.card_uid ?? '').trim()
                                ? 'Replace Card'
                                : 'Assign Card'
                        "
                        icon="pi pi-id-card"
                        variant="outlined"
                        size="small"
                        :disabled="busy || statusBusy"
                        @click="openAssignCardDialog"
                    />
                </div>

                <div
                    class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
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
                    <div class="min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-1">
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
                </div>

                <div class="mt-6">
                    <span class="mb-3 block">Enrolled Subjects</span>
                    <div class="flex flex-wrap items-center gap-6">
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

                <div class="mt-6">
                    <span class="mb-2 block text-sm text-muted-color">Card</span>
                    <p class="text-base">
                        {{
                            String(studentRecord.card_uid ?? '').trim() || '-'
                        }}
                    </p>
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
</template>
