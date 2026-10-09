import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';

export const useGlobalStore = defineStore('GlobalStore', () => {
    const toast = useToast();
    const errors = ref(null);
    const loading = ref(false);
    const routeForbidden = ref(false);

    const setLoading = (value) => {
        loading.value = value;
    };

    const setRouteForbidden = (value) => {
        routeForbidden.value = value;
    };

    const clearErrors = () => {
        errors.value = null;
    };

    const firstServerValidationMessage = (errorsObj) => {
        if (!errorsObj || typeof errorsObj !== 'object') {
            return null;
        }
        for (const messages of Object.values(errorsObj)) {
            if (Array.isArray(messages) && messages.length) {
                const msg = messages[0];
                if (msg != null && String(msg).trim()) {
                    return String(msg).trim();
                }
            } else if (typeof messages === 'string' && messages.trim()) {
                return messages.trim();
            }
        }
        return null;
    };

    const setError = (serverError) => {
        if (!serverError) {
            errors.value = null;
            return;
        }
        const summary = 'Oops!';
        let detail = 'Something went wrong';

        const res = serverError.response;
        if (res && res.data) {
            if (res.data.errors) {
                errors.value = res.data.errors;
            }
            if (res.data.message) {
                detail = res.data.message;
            }
            // Inactive / forbidden: field errors only (no toast)
            if (res.status === 403 && res.data.errors) {
                return;
            }
            // Validation: keep field errors and surface first message in toast
            if (res.status === 422 && res.data.errors) {
                detail =
                    firstServerValidationMessage(res.data.errors) || detail;
                showError(summary, detail);
                return;
            }
        }

        showError(summary, detail);
    };

    const showSuccess = (summary, detail) => {
        toast.add({
            severity: 'success',
            summary,
            detail,
            life: 5000
        });
    };

    const showError = (summary, detail) => {
        toast.add({
            severity: 'error',
            summary,
            detail,
            life: 5000
        });
    };

    const showToast = (severity, summary, detail, life = 5000) => {
        toast.add({
            severity,
            summary,
            detail,
            life
        });
    };

    const actionWrapper = async (action) => {
        try {
            setLoading(true);
            clearErrors();
            const response = await action();
            return response;
        } catch (err) {
            if (err.response && err.response.status !== 401) setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        errors,
        loading,
        routeForbidden,
        setRouteForbidden,
        clearErrors,
        showSuccess,
        showError,
        showToast,
        actionWrapper
    };
});
