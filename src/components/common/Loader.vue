<script setup>
defineProps({
    /** Tighter layout for list footers (e.g. notification infinite scroll). */
    compact: { type: Boolean, default: false }
});
</script>

<template>
    <div
        class="app-loader"
        :class="compact ? 'text-center py-3' : 'text-center mt-12'"
    >
        <ProgressSpinner
            class="app-loader__spinner"
            :style="
                compact
                    ? { width: '40px', height: '40px' }
                    : { width: '70px', height: '70px' }
            "
            strokeWidth="3"
        />
    </div>
</template>

<style lang="scss" scoped>
/* Theme primary is strong (often red in this app); keep loaders neutral. */
.app-loader :deep(.p-progressspinner-circle) {
    stroke: var(--p-text-muted-color, rgb(100 116 139));
}
</style>
