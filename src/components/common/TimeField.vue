<script setup>
import { ref, watch } from 'vue';
import DatePicker from 'primevue/datepicker';
import dayjs from '@/plugins/dayjs';

const props = defineProps({
    modelValue: { type: String, default: '' },
    invalid: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

function parseTimeString(value) {
    if (value == null || value === '') {
        return null;
    }

    const normalized = String(value).trim().slice(0, 5);
    const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) {
        return null;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function formatTimeDate(date) {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
        return null;
    }

    return dayjs(date).format('HH:mm');
}

const internalTime = ref(parseTimeString(props.modelValue));

watch(
    () => props.modelValue,
    (value) => {
        internalTime.value = parseTimeString(value);
    }
);

function onUpdate(value) {
    internalTime.value = value;
    emit('update:modelValue', formatTimeDate(value));
}
</script>

<template>
    <DatePicker
        :modelValue="internalTime"
        timeOnly
        hourFormat="12"
        showIcon
        iconDisplay="input"
        fluid
        placeholder="Select"
        :invalid="invalid"
        v-bind="$attrs"
        @update:modelValue="onUpdate"
    >
        <template #inputicon="slotProps">
            <i class="pi pi-clock" @click="slotProps.clickCallback" />
        </template>
    </DatePicker>
</template>
