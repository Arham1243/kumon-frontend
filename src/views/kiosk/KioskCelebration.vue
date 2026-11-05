<script setup>
import { computed, ref, watch } from 'vue';
import {
    buildCelebrationGreeting,
    buildCelebrationGroundSvg,
    buildCelebrationSvg,
    celebrationAriaLabel,
    greetingFontSizeStyle,
    KIOSK_THEMES,
    pickCelebrationIndices
} from '@/views/kiosk/kioskCelebrationSvg';

const props = defineProps({
    name: {
        type: String,
        default: ''
    },
    mode: {
        type: String,
        default: 'in',
        validator: (v) => v === 'in' || v === 'out'
    },
    flashKey: {
        type: Number,
        default: 0
    }
});

const themeIndex = ref(0);
const animalIndex = ref(0);

const reducedMotion = ref(false);

if (typeof window !== 'undefined' && window.matchMedia) {
    reducedMotion.value = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;
}

watch(
    () => props.flashKey,
    () => {
        const pick = pickCelebrationIndices(true);
        themeIndex.value = pick.themeIndex;
        animalIndex.value = pick.animalIndex;
    },
    { immediate: true }
);

const svgHtml = computed(() =>
    buildCelebrationSvg(themeIndex.value, animalIndex.value, {
        reducedMotion: reducedMotion.value
    })
);

const groundSvgHtml = computed(() =>
    buildCelebrationGroundSvg(themeIndex.value)
);

const greeting = computed(() =>
    buildCelebrationGreeting(props.mode, props.name)
);

const theme = computed(() => KIOSK_THEMES[themeIndex.value]);

const shellStyle = computed(() => ({
    backgroundColor: theme.value?.bg ?? '#000'
}));

const greetingStyle = computed(() => ({
    color: theme.value?.tx ?? '#2a1b4d',
    ...greetingFontSizeStyle(greeting.value)
}));

const ariaLabel = computed(() =>
    celebrationAriaLabel(
        themeIndex.value,
        animalIndex.value,
        props.mode,
        props.name
    )
);
</script>

<template>
    <div
        class="kiosk-celebration"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        :style="shellStyle"
    >
        <div class="kiosk-celebration__svg" v-html="svgHtml" />
        <div
            class="kiosk-celebration__ground"
            v-html="groundSvgHtml"
            aria-hidden="true"
        />
        <p class="kiosk-celebration__greeting" :style="greetingStyle">
            {{ greeting }}
        </p>
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap');
</style>

<style scoped>
.kiosk-celebration {
    position: fixed;
    inset: 0;
    z-index: 100;
    overflow: hidden;
}

.kiosk-celebration__greeting {
    position: absolute;
    top: 11%;
    left: 0;
    right: 0;
    height: 14%;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin: 0;
    padding: 0 clamp(0.75rem, 4vw, 1.5rem);
    font-family: Fredoka, system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: 0.02em;
    text-align: center;
    text-wrap: balance;
    pointer-events: none;
}

.kiosk-celebration__svg {
    width: 100%;
    height: 100%;
}

.kiosk-celebration__svg :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
}

.kiosk-celebration__ground {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    width: 100%;
    height: clamp(7.5rem, 22vh, 12rem);
    pointer-events: none;
}

.kiosk-celebration__ground :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
}
</style>

<style>
.kiosk-celebration__hero {
    animation: kiosk-celebration-bob 1.3s ease-in-out infinite;
}

.kiosk-celebration__tw {
    animation: kiosk-celebration-tw 1.6s ease-in-out infinite;
}

@keyframes kiosk-celebration-bob {
    50% {
        transform: translateY(-9px);
    }
}

@keyframes kiosk-celebration-tw {
    50% {
        opacity: 0.35;
    }
}

@media (prefers-reduced-motion: reduce) {
    .kiosk-celebration__hero,
    .kiosk-celebration__tw {
        animation: none;
    }
}
</style>
