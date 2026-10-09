<script setup>
import TableTextFilter from './TableTextFilter.vue';
import TableSelectFilter from './TableSelectFilter.vue';

const emit = defineEmits(['apply', 'update:modelValue']);

defineProps({
    modelValue: {
        type: [String, Number, Boolean, null],
        default: null
    },
    config: {
        type: Object,
        required: true
    }
});

const onApply = () => {
    emit('apply');
};

const onUpdate = (value) => {
    emit('update:modelValue', value);
};
</script>

<template>
    <TableTextFilter
        v-if="config.type === 'text' || config.type === 'number'"
        :modelValue="modelValue"
        :placeholder="config.placeholder"
        @update:modelValue="onUpdate"
        @apply="onApply"
    />
    <TableSelectFilter
        v-else-if="config.type === 'select' || config.type === 'boolean'"
        :modelValue="modelValue"
        :options="config.options"
        :placeholder="config.placeholder"
        @update:modelValue="onUpdate"
        @apply="onApply"
    />
</template>
