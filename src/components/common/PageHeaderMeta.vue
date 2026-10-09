<script setup>
import { computed } from 'vue';
import {
    PAGE_HEADER_META_BULLET,
    pageHeaderMetaSegments
} from '@/utils/pageHeaderMeta';

const props = defineProps({
    /** Pre-built segments, or pass variadic-style array via segments prop */
    segments: {
        type: Array,
        default: () => []
    },
    /** Character between segments */
    bullet: {
        type: String,
        default: PAGE_HEADER_META_BULLET
    }
});

const visibleSegments = computed(() =>
    pageHeaderMetaSegments(props.segments)
);
</script>

<template>
    <p
        v-if="visibleSegments.length"
        class="page-header-meta mb-0 mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-1"
    >
        <template
            v-for="(segment, index) in visibleSegments"
            :key="`${index}-${segment.text}`"
        >
            <span
                v-if="index > 0"
                class="page-header-meta__sep shrink-0"
                aria-hidden="true"
                >{{ bullet }}</span
            >
            <span
                :class="{
                    'whitespace-nowrap': segment.nowrap !== false
                }"
                >{{ segment.text }}</span
            >
        </template>
    </p>
</template>

<style scoped>
.page-header-meta__sep {
    opacity: 0.55;
}
</style>
