<script setup>
import { ref, watch, nextTick, toRef, computed } from 'vue';
import { useFormDirty } from '@/composables/useFormDirty';
import { DIALOG_CLASS } from '@/config/dialogClasses';

const props = defineProps({
    visible: { type: Boolean, default: false },
    header: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    cancelLabel: { type: String, default: 'Cancel' },
    confirmLabel: { type: String, default: undefined },
    isEditMode: { type: Boolean, default: false },
    formData: { type: Object, required: true },
    enableDirtyCheck: { type: Boolean, default: true },
    initialData: { type: Object, default: null },
    hideFooter: { type: Boolean, default: false },
    disableConfirm: { type: Boolean, default: false },
    /** PrimeVue Button severity for the confirm action (e.g. `success`). */
    confirmSeverity: { type: String, default: undefined },

    confirmBeforeSave: { type: Boolean, default: false }
});

const emit = defineEmits(['update:visible', 'cancel', 'confirm']);

const effectiveConfirmLabel = computed(() => {
    if (props.confirmLabel) {
        return props.confirmLabel;
    }
    return props.isEditMode ? 'Update' : 'Save';
});

const { isDirty, resetDirty } = useFormDirty(
    toRef(props, 'formData'),
    toRef(props, 'initialData')
);

const showUnsavedDialog = ref(false);
const showCriticalConfirm = ref(false);
let pendingClose = false;

// Reset dirty state on open
watch(
    () => props.visible,
    (isVisible, wasVisible) => {
        if (isVisible && !wasVisible) {
            nextTick(() => {
                if (props.isEditMode && props.initialData) {
                    resetDirty(props.initialData);
                } else {
                    resetDirty();
                }
            });
        }
    }
);

function handleVisibilityChange(visible) {
    if (!visible && !pendingClose) {
        handleCancel();
    } else {
        emit('update:visible', visible);
    }
}

// Cancel button or close attempt
function handleCancel() {
    if (props.enableDirtyCheck && isDirty.value) {
        showUnsavedDialog.value = true;
    } else {
        executeClose();
    }
}

function handleConfirm() {
    if (props.confirmBeforeSave) {
        showCriticalConfirm.value = true;
        return;
    }

    emit('confirm');
}

// User confirmed critical save warning
function confirmCriticalSave() {
    showCriticalConfirm.value = false;
    emit('confirm');
}

// Force close dialog
function executeClose() {
    pendingClose = true;
    emit('cancel');
    emit('update:visible', false);
    nextTick(() => {
        pendingClose = false;
    });
}

// User confirmed discarding changes
function confirmDiscard() {
    showUnsavedDialog.value = false;
    executeClose();
}

// Expose dirtiness API for parent access
defineExpose({
    isDirty,
    resetDirty
});
</script>

<template>
    <Dialog
        :header="header || (isEditMode ? 'Edit' : 'New')"
        :visible="visible"
        @update:visible="handleVisibilityChange"
        :modal="true"
        v-bind="$attrs"
        :class="DIALOG_CLASS"
    >
        <form @submit.prevent="handleConfirm">
            <div class="grid grid-cols-12 gap-4 space-y-1">
                <slot />
            </div>
        </form>

        <template #footer v-if="!props.hideFooter">
            <slot name="footer">
                <Button
                    text
                    variant="outlined"
                    :label="cancelLabel"
                    @click="handleCancel"
                    :disabled="busy"
                    class="mr-2"
                    type="button"
                />
                <Button
                    icon="pi pi-check"
                    iconPos="left"
                    :severity="confirmSeverity"
                    :loading="busy"
                    :disabled="
                        (props.enableDirtyCheck && !isDirty) ||
                        busy ||
                        props.disableConfirm
                    "
                    :label="effectiveConfirmLabel"
                    @click="handleConfirm"
                />
            </slot>
        </template>
    </Dialog>

    <Confirmation
        v-model="showUnsavedDialog"
        header="Unsaved Changes"
        content="You have unsaved changes. If you close, those changes will be lost. Do you want to discard them?"
        variant="danger"
        confirmButtonText="Discard Changes"
        cancelButtonText="Keep Editing"
        @confirm="confirmDiscard"
    />
    <Confirmation
        v-model="showCriticalConfirm"
        header="Warning"
        content="You understand the changes you are making and consequences it may have on your running system. If you are 100% sure, press OK. Otherwise, cancel immediately."
        variant="danger"
        confirmButtonText="OK"
        cancelButtonText="Cancel"
        @confirm="confirmCriticalSave"
    />
</template>
