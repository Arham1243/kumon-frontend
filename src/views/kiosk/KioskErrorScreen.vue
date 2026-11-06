<script setup>
import { computed, ref, watch } from 'vue';
import {
    buildCelebrationFrontSvg,
    buildCelebrationGroundSvg,
    buildCelebrationHeroSvg,
    buildCelebrationSkySvg,
    buildKioskErrorFrontSvg,
    buildKioskErrorGroundSvg,
    buildKioskErrorHeroSvg,
    buildKioskErrorSkySvg,
    celebrationAriaLabel,
    celebrationPillTextColor,
    celebrationShellBg,
    celebrationTextColor,
    checkoutPillFontSizeStyle,
    greetingFontSizeStyle,
    KIOSK_THEMES,
    kioskErrorAriaLabel,
    kioskErrorHeadingFontSizeStyle,
    kioskErrorTheme
} from '@/views/kiosk/kioskCelebrationSvg';

const props = defineProps({
    scene: {
        type: String,
        required: true,
        validator: (v) =>
            [
                'notFound',
                'alreadyIn',
                'alreadyOut',
                'serverError',
                'offline'
            ].includes(v)
    },
    message: {
        type: String,
        default: ''
    },
    subline: {
        type: String,
        default: ''
    },
    headline: {
        type: String,
        default: ''
    },
    pillText: {
        type: String,
        default: ''
    },
    /** When scene is alreadyOut, use celebration art (theme + character from pickCelebrationIndices). */
    celebrationThemeIndex: {
        type: Number,
        default: -1
    },
    celebrationAnimalIndex: {
        type: Number,
        default: 0
    },
    flashKey: {
        type: Number,
        default: 0
    }
});

const reducedMotion = ref(false);

if (typeof window !== 'undefined' && window.matchMedia) {
    reducedMotion.value = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;
}

watch(
    () => props.flashKey,
    () => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            reducedMotion.value = window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches;
        }
    }
);

const usesCelebrationAlreadyOut = computed(
    () =>
        props.scene === 'alreadyOut' &&
        props.celebrationThemeIndex >= 0 &&
        props.celebrationThemeIndex < KIOSK_THEMES.length
);

const skySvgHtml = computed(() => {
    if (usesCelebrationAlreadyOut.value) {
        return buildCelebrationSkySvg(props.celebrationThemeIndex, {
            reducedMotion: reducedMotion.value
        });
    }
    return buildKioskErrorSkySvg(props.scene, {
        reducedMotion: reducedMotion.value
    });
});

const groundSvgHtml = computed(() => {
    if (usesCelebrationAlreadyOut.value) {
        return buildCelebrationGroundSvg(props.celebrationThemeIndex);
    }
    return buildKioskErrorGroundSvg(props.scene);
});

const frontSvgHtml = computed(() => {
    if (usesCelebrationAlreadyOut.value) {
        return buildCelebrationFrontSvg(props.celebrationThemeIndex);
    }
    return buildKioskErrorFrontSvg(props.scene);
});

const heroSvgHtml = computed(() => {
    if (usesCelebrationAlreadyOut.value) {
        return buildCelebrationHeroSvg(
            props.celebrationThemeIndex,
            props.celebrationAnimalIndex,
            { reducedMotion: reducedMotion.value }
        );
    }
    return buildKioskErrorHeroSvg(props.scene, {
        reducedMotion: reducedMotion.value
    });
});

const theme = computed(() => {
    if (usesCelebrationAlreadyOut.value) {
        return {
            bg: celebrationShellBg(props.celebrationThemeIndex),
            tx: celebrationTextColor(props.celebrationThemeIndex)
        };
    }
    return kioskErrorTheme(props.scene);
});

const shellStyle = computed(() => ({
    backgroundColor: theme.value.bg ?? '#f1e6fa'
}));

const hasHeadline = computed(
    () => String(props.headline ?? '').trim().length > 0
);
const hasSubline = computed(
    () => String(props.subline ?? '').trim().length > 0
);
const hasPill = computed(
    () => String(props.pillText ?? '').trim().length > 0
);
const hasMessage = computed(
    () => String(props.message ?? '').trim().length > 0
);

const usesGroundPill = computed(
    () =>
        hasHeadline.value &&
        hasMessage.value &&
        hasSubline.value &&
        (usesCelebrationAlreadyOut.value || props.scene === 'alreadyIn')
);

const layoutKind = computed(() => {
    if (usesGroundPill.value) {
        return 'checkoutCelebration';
    }
    if (
        hasHeadline.value &&
        (hasPill.value || (hasMessage.value && hasSubline.value))
    ) {
        return 'namePill';
    }
    if (hasPill.value && hasSubline.value && hasMessage.value) {
        return 'offline';
    }
    if (hasSubline.value && hasMessage.value) {
        return 'twoLine';
    }
    return 'single';
});

const headlineUpper = computed(() =>
    String(props.headline ?? '')
        .trim()
        .toUpperCase()
);

const headlineStyle = computed(() => ({
    color: theme.value.tx ?? '#4a2c7a',
    ...(usesGroundPill.value
        ? greetingFontSizeStyle(headlineUpper.value)
        : kioskErrorHeadingFontSizeStyle(headlineUpper.value))
}));

const lineBlockStyle = computed(() => {
    const block =
        [props.message, props.subline].filter((s) => String(s ?? '').trim())
            .join(' ')
            .trim();
    return {
        color: theme.value.tx ?? '#4a2c7a',
        ...kioskErrorHeadingFontSizeStyle(block)
    };
});

const pillStyle = computed(() => ({
    color: theme.value.tx ?? '#4a2c7a'
}));

const bottomCheckoutPillStyle = computed(() => ({
    color: usesCelebrationAlreadyOut.value
        ? celebrationPillTextColor(props.celebrationThemeIndex)
        : (theme.value.tx ?? '#4a2c7a'),
    ...checkoutPillFontSizeStyle([props.message, props.subline])
}));

const namePillUsesTwoLines = computed(
    () =>
        hasHeadline.value &&
        hasMessage.value &&
        hasSubline.value &&
        !hasPill.value &&
        !usesCelebrationAlreadyOut.value
);

const ariaLabel = computed(() => {
    const parts = [];
    if (hasHeadline.value) {
        parts.push(String(props.headline).trim());
    }
    if (hasMessage.value) {
        parts.push(String(props.message).trim());
    }
    if (hasSubline.value) {
        parts.push(String(props.subline).trim());
    }
    if (hasPill.value) {
        parts.push(String(props.pillText).trim());
    }
    const joined = parts.filter(Boolean).join('. ');
    if (usesCelebrationAlreadyOut.value) {
        return `${joined}. ${celebrationAriaLabel(props.celebrationThemeIndex, props.celebrationAnimalIndex, 'out', props.headline)}`;
    }
    return kioskErrorAriaLabel(props.scene, joined);
});
</script>

<template>
    <div
        class="kiosk-error-screen"
        role="alertdialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        :style="shellStyle"
    >
        <div class="kiosk-error-screen__sky" v-html="skySvgHtml" />
        <div
            class="kiosk-error-screen__ground"
            v-html="groundSvgHtml"
            aria-hidden="true"
        />
        <div v-if="frontSvgHtml" class="kiosk-error-screen__front" v-html="frontSvgHtml" />
        <div class="kiosk-error-screen__character" v-html="heroSvgHtml" />

        <div
            v-if="layoutKind === 'checkoutCelebration'"
            class="kiosk-error-screen__checkout"
        >
            <p class="kiosk-error-screen__checkout-name" :style="headlineStyle">
                {{ headlineUpper }}
            </p>
            <div
                class="kiosk-error-screen__checkout-pill"
                :style="bottomCheckoutPillStyle"
            >
                <span class="kiosk-error-screen__checkout-line">{{ message }}</span>
                <span class="kiosk-error-screen__checkout-line">{{ subline }}</span>
            </div>
        </div>

        <div
            v-else-if="layoutKind === 'namePill'"
            class="kiosk-error-screen__stack kiosk-error-screen__stack--namePill"
        >
            <p class="kiosk-error-screen__headline" :style="headlineStyle">
                {{ headlineUpper }}
            </p>
            <div
                class="kiosk-error-screen__pill"
                :class="{
                    'kiosk-error-screen__pill--name-two-lines': namePillUsesTwoLines
                }"
                :style="pillStyle"
            >
                <template v-if="namePillUsesTwoLines">
                    <span class="kiosk-error-screen__pill-line">{{ message }}</span>
                    <span class="kiosk-error-screen__pill-line">{{ subline }}</span>
                </template>
                <template v-else>{{ pillText }}</template>
            </div>
        </div>

        <div
            v-else-if="layoutKind === 'offline'"
            class="kiosk-error-screen__stack kiosk-error-screen__stack--offline"
        >
            <p class="kiosk-error-screen__lines" :style="lineBlockStyle">
                <span class="kiosk-error-screen__line">{{ message }}</span>
                <span class="kiosk-error-screen__line">{{ subline }}</span>
            </p>
            <div class="kiosk-error-screen__pill" :style="pillStyle">
                {{ pillText }}
            </div>
        </div>

        <div
            v-else-if="layoutKind === 'twoLine'"
            class="kiosk-error-screen__stack kiosk-error-screen__stack--twoLine"
        >
            <p class="kiosk-error-screen__lines" :style="lineBlockStyle">
                <span class="kiosk-error-screen__line">{{ message }}</span>
                <span class="kiosk-error-screen__line">{{ subline }}</span>
            </p>
        </div>

        <p
            v-else
            class="kiosk-error-screen__message kiosk-error-screen__message--single"
            :style="lineBlockStyle"
        >
            {{ message }}
        </p>
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap');
</style>

<style scoped>
.kiosk-error-screen {
    position: fixed;
    inset: 0;
    z-index: 100;
    overflow: hidden;
}

.kiosk-error-screen__checkout {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
}

.kiosk-error-screen__checkout-name {
    position: absolute;
    top: 11%;
    left: 0;
    right: 0;
    height: 14%;
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
    box-sizing: border-box;
}

.kiosk-error-screen__checkout-pill {
    position: absolute;
    left: 50%;
    bottom: clamp(3.25rem, 8vh, 5rem);
    transform: translateX(-50%);
    width: max-content;
    max-width: 94vw;
    padding: clamp(0.55em, 1.8vh, 0.85em) clamp(1.05em, 2.4vw, 1.45em);
    font-family: Fredoka, system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.16;
    text-align: center;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 9999px;
    box-shadow: 0 3px 14px rgba(42, 27, 77, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.06em, 0.35vh, 0.14em);
    box-sizing: border-box;
}

.kiosk-error-screen__checkout-line {
    display: block;
    white-space: nowrap;
}

.kiosk-error-screen__stack {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0 clamp(0.75rem, 4vw, 1.5rem);
    pointer-events: none;
    box-sizing: border-box;
}

.kiosk-error-screen__stack--twoLine {
    top: 7%;
}

.kiosk-error-screen__stack--offline {
    top: 6%;
    gap: clamp(0.4rem, 2vh, 0.85rem);
}

.kiosk-error-screen__stack--namePill {
    top: 8%;
    gap: clamp(0.5rem, 2.5vh, 1rem);
}

.kiosk-error-screen__message--single {
    position: absolute;
    top: 8%;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin: 0;
    padding: 0 clamp(0.75rem, 4vw, 1.5rem);
    font-family: Fredoka, system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0.02em;
    text-align: center;
    text-wrap: balance;
    pointer-events: none;
    box-sizing: border-box;
}

.kiosk-error-screen__headline {
    margin: 0;
    width: min(100%, 22rem);
    font-family: Fredoka, system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: 0.02em;
    text-align: center;
    text-wrap: balance;
}

.kiosk-error-screen__lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.15rem, 0.8vh, 0.35rem);
    margin: 0;
    width: min(100%, 26rem);
    font-family: Fredoka, system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: 0.02em;
    text-align: center;
    text-wrap: balance;
}

.kiosk-error-screen__line {
    display: block;
}

.kiosk-error-screen__pill {
    max-width: min(100%, 22rem);
    padding: 0.45em 1.15em;
    font-family: Fredoka, system-ui, sans-serif;
    font-weight: 700;
    font-size: clamp(0.95rem, min(3.6vw, 3.2vh), 1.2rem);
    line-height: 1.25;
    text-align: center;
    text-wrap: balance;
    white-space: normal;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 9999px;
    box-shadow: 0 2px 10px rgba(42, 27, 77, 0.08);
}

.kiosk-error-screen__pill--name-two-lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.1rem, 0.5vh, 0.25rem);
    max-width: min(100%, 28rem);
    padding: clamp(0.55em, 1.6vh, 0.75em) clamp(1em, 3.5vw, 1.35em);
    font-size: clamp(1.15rem, min(4.8vw, 4.2vh), 1.65rem);
    line-height: 1.2;
}

.kiosk-error-screen__pill-line {
    display: block;
    text-wrap: balance;
}

.kiosk-error-screen__sky,
.kiosk-error-screen__front,
.kiosk-error-screen__character {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.kiosk-error-screen__sky {
    z-index: 0;
}

.kiosk-error-screen__front,
.kiosk-error-screen__character {
    z-index: 2;
}

.kiosk-error-screen__sky :deep(svg),
.kiosk-error-screen__front :deep(svg),
.kiosk-error-screen__character :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
}

.kiosk-error-screen__ground {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    width: 100%;
    height: clamp(10rem, 28vh, 15rem);
    pointer-events: none;
}

.kiosk-error-screen__ground :deep(svg) {
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
