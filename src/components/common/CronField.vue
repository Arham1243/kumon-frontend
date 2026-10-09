<script setup>
defineProps({
    modelValue: {
        type: String,
        default: '* * * * *'
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

defineEmits(['update:modelValue']);

// Column counts for each segment dropdown. The period menu is kept as a
// single vertical column (cols.period = 1) so it looks consistent with the
// month/day dropdowns the user expects. The dialog that hosts CronField
// must allow overflow to be visible so the menu isn't clipped by the dialog
// body -- see ScheduledJobFrequencyDialog for the corresponding override.
const cols = {
    period: 1,
    second: 5,
    minute: 5,
    hour: 4,
    day: 4
};
</script>

<template>
    <div class="cron-field" :class="{ 'cron-field--disabled': disabled }">
        <CronLight
            :model-value="modelValue"
            :disabled="disabled"
            :cols="cols"
            @update:model-value="$emit('update:modelValue', $event)"
        />
    </div>
</template>

<style lang="scss" scoped>
.cron-field {
    width: 100%;
}

.cron-field--disabled {
    opacity: 0.65;
    pointer-events: none;
}

.cron-field :deep(.cron-light) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    line-height: 1.5;
}

.cron-field :deep(.cron-light > .cl-prefix),
.cron-field :deep(.cron-light > .cl-suffix) {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--p-text-muted-color);
}

.cron-field :deep(.cron-light .cl-select) {
    display: inline-flex;
    vertical-align: middle;
}

.cron-field :deep(.cron-light .cl-select .cl-btn) {
    display: inline-flex !important;
    align-items: center !important;
    margin: 0 !important;
    min-height: 2.5rem;
    padding: 0.5rem 0.5rem !important;
    font-size: 1rem !important;
    line-height: 1.25 !important;
    border-radius: var(--p-form-field-border-radius, 6px) !important;
    box-sizing: border-box;
}

.cron-field :deep(.cron-light .cl-select .cl-btn > span) {
    margin-left: 0.25rem !important;
    font-size: 1rem !important;
    line-height: 1.25 !important;
}

.cron-field :deep(.cron-light .cl-btn-suffix) {
    margin-left: 0.25rem !important;
    line-height: 1;
}

.cron-field :deep(.cron-light .cl-menu) {
    padding: 0.25rem !important;
    min-width: 0;
}

.cron-field :deep(.cron-light .cl-col) {
    padding: 0 !important;
    text-align: left;
}

.cron-field :deep(.cron-light .cl-col > div) {
    padding: 0.375rem 0.5rem !important;
    font-size: 0.875rem;
    line-height: 1.35;
    text-align: left;
}

.cron-field :deep(.cron-light .cl-row .cl-col + .cl-col > div) {
    text-align: center;
    min-width: 2.25rem;
    padding: 0.3125rem 0.375rem !important;
    line-height: 1.25;
}

/* Period dropdown (first select in cron-light) renders as a single vertical
 * column so it matches the months / days menus visually. Give each option a
 * wider hit target and left-align the labels for that same consistency. */
.cron-field
    :deep(.cron-light > .cl-select:first-of-type .cl-menu .cl-col > div) {
    min-width: 6rem;
    padding: 0.45rem 0.875rem !important;
    text-align: left;
}
</style>
