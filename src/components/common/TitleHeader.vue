<script setup>
defineProps({
    /** When true, title and actions align to the top row (same baseline as the first line of the title). */
    alignTop: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <div
        class="mb-7 flex w-full flex-col sm:flex-row sm:justify-between"
        :class="alignTop ? 'sm:items-start' : 'sm:items-center'"
    >
        <div><slot name="title" /></div>
        <div class="mt-4 flex justify-end gap-4 md:mt-0">
            <slot name="actions" />
        </div>
    </div>
</template>
