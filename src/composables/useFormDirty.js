import { ref, watch, unref } from 'vue';

export function useFormDirty(formRef, initialDataRef = null, options = {}) {
    const isDirty = ref(false);
    const defaults = ref({});
    const { excludeKeys = [] } = options;

    const sanitize = (obj, keys) => {
        if (!obj) return {};
        const raw = JSON.parse(JSON.stringify(unref(obj)));
        return keys.reduce((acc, key) => {
            if (!excludeKeys.includes(key)) {
                acc[key] = raw[key];
            }
            return acc;
        }, {});
    };

    const updateDirtyState = () => {
        const form = unref(formRef);
        if (!form) {
            isDirty.value = false;
            return;
        }

        const keys = Object.keys(form).filter(
            (key) => !excludeKeys.includes(key)
        );
        const current = sanitize(form, keys);
        const defaultValues = sanitize(defaults.value, keys);
        isDirty.value =
            JSON.stringify(current) !== JSON.stringify(defaultValues);
    };

    const resetDirty = (initial = null) => {
        const form = unref(formRef);
        if (!form) {
            defaults.value = {};
            isDirty.value = false;
            return;
        }

        const keys = Object.keys(form).filter(
            (key) => !excludeKeys.includes(key)
        );

        if (!initial) {
            defaults.value = sanitize(form, keys);
            isDirty.value = false;
            return;
        }

        defaults.value = sanitize(initial, keys);
        const current = sanitize(form, keys);
        isDirty.value =
            JSON.stringify(current) !== JSON.stringify(defaults.value);
    };

    watch(formRef, updateDirtyState, { deep: true });

    if (initialDataRef) {
        watch(
            initialDataRef,
            (newInitialData) => {
                if (newInitialData) {
                    const form = unref(formRef);
                    if (form) {
                        const keys = Object.keys(form);
                        defaults.value = sanitize(newInitialData, keys);
                        updateDirtyState();
                    }
                }
            },
            { deep: true }
        );
    }

    return { isDirty, resetDirty };
}
