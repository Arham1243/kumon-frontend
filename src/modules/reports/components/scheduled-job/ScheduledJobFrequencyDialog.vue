<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import CronField from '@/components/common/CronField.vue';
import { describeCronExpression } from '@/modules/reports/utils/cronDescribe';
import { DIALOG_CLASS_EXTRA_WIDE } from '@/config/dialogClasses';

const props = defineProps({
    visible: { type: Boolean, default: false },
    job: { type: Object, default: null },
    saving: { type: Boolean, default: false }
});

const emit = defineEmits(['update:visible', 'save']);

const expression = ref('0 * * * *');

watch(
    () => [props.visible, props.job],
    ([isOpen, job]) => {
        if (isOpen && job) {
            expression.value = job.frequency || '0 * * * *';
        }
    },
    { immediate: true }
);

const humanDescription = computed(() =>
    describeCronExpression(expression.value)
);

const close = () => {
    if (props.saving) return;
    emit('update:visible', false);
};

const save = () => {
    emit('save', expression.value);
};
</script>

<template>
    <Dialog
        :visible="visible"
        modal
        :closable="!saving"
        :draggable="false"
        :dismissable-mask="!saving"
        :header="job ? `Edit frequency: ${job.name}` : 'Edit frequency'"
        :class="`${DIALOG_CLASS_EXTRA_WIDE} cron-frequency-dialog`"
        @update:visible="(v) => emit('update:visible', v)"
    >
        <div class="flex flex-col gap-4">
            <p class="m-0 text-sm text-surface-600 dark:text-surface-400">
                The scheduler picks up the new expression on the next cron tick.
                No restart or server change is required. Hour and minute fields
                use UTC.
            </p>

            <div class="cron-field-row">
                <CronField v-model="expression" :disabled="saving" />
            </div>

            <div
                class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface-600 dark:text-surface-400"
            >
                <div>
                    <span
                        class="font-medium text-surface-900 dark:text-surface-0"
                        >{{ humanDescription }}</span
                    >
                </div>
                <code
                    class="rounded bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs text-surface-700 dark:text-surface-200"
                    >{{ expression }}</code
                >
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    severity="secondary"
                    :disabled="saving"
                    @click="close"
                />
                <Button
                    icon="pi pi-check"
                    label="Save"
                    :loading="saving"
                    @click="save"
                />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/*
 * The shared CronField wraps via flex-wrap: wrap so it remains responsive.
 * Inside this dialog we have plenty of horizontal room (max-w-6xl) and the
 * super admin needs to see the whole expression at once, so force a single
 * row. We intentionally do NOT set overflow on the wrapper -- per CSS spec
 * setting overflow-x to anything other than `visible` implicitly forces
 * overflow-y to `auto`, which clips the cron-light dropdown panel and shows
 * a phantom vertical scrollbar when the field expands.
 */
.cron-field-row :deep(.cron-light) {
    flex-wrap: nowrap;
    white-space: nowrap;
}
</style>

<style lang="scss">
/*
 * vue-js-cron positions its dropdown menus with `position: absolute` (the
 * library hard-codes the Floating UI strategy), which means menus get
 * visually clipped at the nearest ancestor that has overflow != visible.
 * PrimeVue's Dialog body defaults to overflow: auto so the taller field
 * menus (e.g. minute = 12 rows, hour = 6 rows) get cut off and the user
 * sees only the last few items. The dialog itself is short and never needs
 * its own scrollbar, so let menus escape the body. The :global scope is
 * required because the dialog renders in a teleport outside this component.
 */
.cron-frequency-dialog .p-dialog-content {
    overflow: visible;
}
</style>
