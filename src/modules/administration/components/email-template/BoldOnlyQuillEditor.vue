<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const props = defineProps({
    modelValue: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    minHeight: { type: String, default: '140px' },
    /** For <label for="…"> */
    id: { type: String, default: undefined },
    /**
     * When true, Quill keeps default format whitelist so stored HTML (e.g. Note block with
     * styled &lt;p&gt;/&lt;div&gt; + &lt;strong&gt;) round-trips. Toolbar stays bold-only.
     */
    preserveHtml: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const host = ref(null);
let quill = null;
let lastEmitted = '';
let applyingExternal = false;
/** Ignore Quill text-change while applying the initial HTML on mount. */
let suppressEmitDuringMount = false;

function normalizeEmpty(html) {
    const t = (html || '').trim();
    if (t === '' || t === '<p><br></p>' || t === '<p></p>') {
        return '';
    }
    return html || '';
}

function emitHtml() {
    if (!quill || applyingExternal || suppressEmitDuringMount) {
        return;
    }
    const raw = quill.root.innerHTML;
    const out = normalizeEmpty(raw);
    lastEmitted = out;
    emit('update:modelValue', out);
}

function applyFromParent(html) {
    if (!quill) {
        return;
    }
    const incoming = html?.trim() ? html : '<p><br></p>';
    applyingExternal = true;
    try {
        quill.setText('');
        quill.clipboard.dangerouslyPasteHTML(0, incoming);
        lastEmitted = normalizeEmpty(quill.root.innerHTML);
    } finally {
        applyingExternal = false;
    }
}

onMounted(() => {
    if (!host.value) {
        return;
    }

    const options = {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [['bold']]
            }
        },
        readOnly: props.disabled
    };
    if (!props.preserveHtml) {
        options.formats = ['bold'];
    }
    quill = new Quill(host.value, options);

    quill.on('text-change', emitHtml);
    suppressEmitDuringMount = true;
    try {
        applyFromParent(props.modelValue || '');
    } finally {
        suppressEmitDuringMount = false;
    }
});

watch(
    () => props.modelValue,
    (v) => {
        if (!quill) {
            return;
        }
        const incoming = normalizeEmpty(v || '');
        if (incoming === lastEmitted) {
            return;
        }
        const current = normalizeEmpty(quill.root.innerHTML);
        if (incoming === current) {
            lastEmitted = incoming;
            return;
        }
        applyFromParent(v || '');
    }
);

watch(
    () => props.disabled,
    (d) => {
        if (quill) {
            quill.enable(!d);
        }
    }
);

onBeforeUnmount(() => {
    quill = null;
});
</script>

<template>
    <div
        class="bold-only-quill rounded-md border border-surface-300 dark:border-surface-600 overflow-hidden bg-surface-0 dark:bg-surface-900"
        :id="id"
        :style="{ '--intro-editor-min-height': minHeight }"
    >
        <div ref="host" class="intro-quill-host"></div>
    </div>
</template>

<style>
.bold-only-quill .ql-toolbar {
    border: none;
    border-bottom: 1px solid
        var(--p-content-border-color, var(--p-surface-300, #e5e7eb));
    background: var(--p-surface-50, #fafafa);
}
.bold-only-quill .ql-container {
    border: none;
    font-size: 15px;
    font-family: inherit;
    min-height: var(--intro-editor-min-height, 140px);
}
.dark .bold-only-quill .ql-toolbar {
    background: var(--p-surface-800, #1c1917);
    border-bottom-color: var(--p-surface-600, #44403c);
}
.dark .bold-only-quill .ql-stroke {
    stroke: var(--p-surface-200, #e7e5e4);
}
.dark .bold-only-quill .ql-fill {
    fill: var(--p-surface-200, #e7e5e4);
}
</style>
